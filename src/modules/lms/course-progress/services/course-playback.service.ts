import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { LessonContentType } from '../../course-content/enums/lesson-content-type.enum';
import { CourseContentDalService } from '../../course-content/services/course-content-dal.service';
import { CourseEnrollmentPersistenceService } from '../../course-enrollments/services/course-enrollment-persistence.service';
import { VideoStreamingStrategyFactory } from '../../video-streaming/video-streaming-strategy.factory';
import type { VideoStreamConfigResponseDto } from '../../video-streaming/dto/video-stream-config-response.dto';
import { coerceVideoPayload } from '../../video-streaming/types/video-content-payload.type';
import { ContentItemProgressPersistenceService } from './content-item-progress-persistence.service';
import { LessonProgressCompletionSyncService } from './lesson-progress-completion-sync.service';
import { LessonProgressPersistenceService } from './lesson-progress-persistence.service';
import { LessonSequentialAccessService } from './lesson-sequential-access.service';
import type { PatchVideoProgressDto } from '../dto/patch-video-progress.dto';
import type { VideoProgressResponseDto } from '../dto/video-progress-response.dto';

@Injectable()
export class CoursePlaybackService {
  constructor(
    private readonly enrollmentPersistence: CourseEnrollmentPersistenceService,
    private readonly contentDal: CourseContentDalService,
    private readonly videoFactory: VideoStreamingStrategyFactory,
    private readonly itemProgress: ContentItemProgressPersistenceService,
    private readonly completionSync: LessonProgressCompletionSyncService,
    private readonly sequential: LessonSequentialAccessService,
    private readonly lessonProgressPersistence: LessonProgressPersistenceService,
  ) {}

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private async loadCourse(courseId: string, schoolId: string) {
    const course = await this.enrollmentPersistence.findCourseById(
      courseId,
      schoolId,
    );
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  /**
   * Students: published course + active LMS enrollment.
   * Teachers: own course. School admins: any course in their school (schoolId scoping).
   */
  private assertStreamViewAccess(
    course: { id: string; isPublished: boolean; teacherId: string },
    caller: AuthCaller,
  ): void {
    if (caller.role === UserRole.STUDENT) {
      if (!course.isPublished) {
        throw new ForbiddenException('Course is not published');
      }
      return;
    }
    if (caller.role === UserRole.TEACHER) {
      if (course.teacherId !== caller.id) {
        throw new ForbiddenException('You can only preview your own courses');
      }
      return;
    }
    if (caller.role === UserRole.SCHOOL_ADMIN) {
      return;
    }
    throw new ForbiddenException();
  }

  private async assertStudentEnrolled(
    studentId: string,
    courseId: string,
  ) {
    const en = await this.enrollmentPersistence.findActiveEnrollment(
      studentId,
      courseId,
    );
    if (!en) {
      throw new ForbiddenException('You are not enrolled in this course');
    }
    return en;
  }

  async getStreamConfig(
    courseId: string,
    contentItemId: string,
    caller: AuthCaller,
  ): Promise<VideoStreamConfigResponseDto> {
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.loadCourse(courseId, schoolId);
    this.assertStreamViewAccess(course, caller);

    if (caller.role === UserRole.STUDENT) {
      await this.assertStudentEnrolled(caller.id, courseId);
    }

    const item = await this.contentDal.findContentItemInCourse(
      courseId,
      contentItemId,
    );
    if (!item) {
      throw new NotFoundException('Content item not found');
    }

    return this.videoFactory.resolveForContentItem(item);
  }

  /**
   * Only enrolled students may persist video telemetry. Unpublished courses reject new writes.
   */
  async patchVideoProgress(
    courseId: string,
    contentItemId: string,
    dto: PatchVideoProgressDto,
    caller: AuthCaller,
  ): Promise<VideoProgressResponseDto> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can record video progress');
    }

    const schoolId = this.resolveSchoolId(caller);
    const course = await this.loadCourse(courseId, schoolId);

    if (!course.isPublished) {
      throw new ForbiddenException(
        'Progress cannot be updated while the course is unpublished',
      );
    }

    const enrollment = await this.assertStudentEnrolled(
      caller.id,
      courseId,
    );

    const item = await this.contentDal.findContentItemInCourse(
      courseId,
      contentItemId,
    );
    if (!item) {
      throw new NotFoundException('Content item not found');
    }
    if (item.contentType !== LessonContentType.VIDEO) {
      throw new BadRequestException(
        'Video progress applies only to VIDEO content items',
      );
    }

    await this.sequential.assertLessonReachable(
      course,
      courseId,
      item.lessonId,
      enrollment.id,
    );

    const lpRow = await this.lessonProgressPersistence.findByEnrollmentAndLesson(
      enrollment.id,
      item.lessonId,
    );
    if (!lpRow?.startedAt) {
      throw new BadRequestException(
        'Start the lesson before reporting video progress',
      );
    }

    const meta = coerceVideoPayload(item.payload);
    let seconds = dto.secondsWatched;
    if (
      meta.durationSeconds != null &&
      Number.isFinite(meta.durationSeconds)
    ) {
      const cap = Math.max(0, Math.floor(meta.durationSeconds));
      seconds = Math.min(seconds, cap);
    }

    const result = await this.itemProgress.applyMonotonicMax({
      courseEnrollmentId: enrollment.id,
      contentItemId: item.id,
      reportedSeconds: seconds,
    });

    await this.completionSync.recalculateAndSave(
      courseId,
      enrollment.id,
      item.lessonId,
    );

    return result;
  }
}
