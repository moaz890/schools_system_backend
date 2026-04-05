import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CourseContentDalService } from '../../course-content/services/course-content-dal.service';
import { CourseEnrollmentPersistenceService } from '../../course-enrollments/services/course-enrollment-persistence.service';
import type { PatchLessonProgressDto } from '../dto/patch-lesson-progress.dto';
import type { LessonProgressResponseDto } from '../dto/lesson-progress-response.dto';
import { ContentItemProgressPersistenceService } from './content-item-progress-persistence.service';
import { LessonCompletionCalculatorService } from './lesson-completion-calculator.service';
import { LessonProgressCompletionSyncService } from './lesson-progress-completion-sync.service';
import { LessonProgressPersistenceService } from './lesson-progress-persistence.service';
import { LessonSequentialAccessService } from './lesson-sequential-access.service';

@Injectable()
export class CourseLessonProgressService {
  constructor(
    private readonly enrollmentPersistence: CourseEnrollmentPersistenceService,
    private readonly contentDal: CourseContentDalService,
    private readonly lessonProgress: LessonProgressPersistenceService,
    private readonly itemProgress: ContentItemProgressPersistenceService,
    private readonly calculator: LessonCompletionCalculatorService,
    private readonly sync: LessonProgressCompletionSyncService,
    private readonly sequential: LessonSequentialAccessService,
  ) {}

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private async loadPublishedCourseForStudent(
    courseId: string,
    schoolId: string,
  ) {
    const course = await this.enrollmentPersistence.findCourseById(
      courseId,
      schoolId,
    );
    if (!course) throw new NotFoundException('Course not found');
    if (!course.isPublished) {
      throw new ForbiddenException('Course is not published');
    }
    return course;
  }

  private async assertStudentEnrollment(
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

  private toDto(row: {
    lessonId: string;
    startedAt: Date | null;
    completedAt: Date | null;
    completionPercentage: number;
    timeSpentSeconds: number;
    videoSecondsWatched: number;
  }): LessonProgressResponseDto {
    return {
      lessonId: row.lessonId,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      completionPercentage: row.completionPercentage,
      timeSpentSeconds: row.timeSpentSeconds,
      videoSecondsWatched: row.videoSecondsWatched,
    };
  }

  async startLesson(
    courseId: string,
    lessonId: string,
    caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can record lesson progress');
    }
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.loadPublishedCourseForStudent(courseId, schoolId);
    const enrollment = await this.assertStudentEnrollment(caller.id, courseId);
    const lessonCheck = await this.contentDal.findLesson(courseId, lessonId);
    if (!lessonCheck) throw new NotFoundException('Lesson not found');

    await this.sequential.assertLessonReachable(
      course,
      courseId,
      lessonId,
      enrollment.id,
    );

    const row = await this.lessonProgress.ensureRow(enrollment.id, lessonId);
    if (!row.startedAt) {
      row.startedAt = new Date();
      await this.lessonProgress.save(row);
    }
    return this.toDto(row);
  }

  async completeLesson(
    courseId: string,
    lessonId: string,
    caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can record lesson progress');
    }
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.loadPublishedCourseForStudent(courseId, schoolId);
    const enrollment = await this.assertStudentEnrollment(caller.id, courseId);

    const rowExisting = await this.lessonProgress.findByEnrollmentAndLesson(
      enrollment.id,
      lessonId,
    );
    if (rowExisting?.completedAt) {
      return this.toDto(rowExisting);
    }

    if (!rowExisting?.startedAt) {
      throw new BadRequestException(
        'Start the lesson before marking it complete',
      );
    }

    await this.sequential.assertLessonReachable(
      course,
      courseId,
      lessonId,
      enrollment.id,
    );

    const lesson = await this.contentDal.findLessonWithContentItems(
      courseId,
      lessonId,
    );
    if (!lesson) throw new NotFoundException('Lesson not found');

    const items = lesson.contentItems ?? [];
    const ids = items.map((i) => i.id);
    const map = await this.itemProgress.findMapForItems(enrollment.id, ids);
    const breakdown = this.calculator.computeForLesson(items, map);
    if (!breakdown.allRequiredDone) {
      throw new BadRequestException(
        `Lesson is not complete: ${breakdown.requiredDone}/${breakdown.requiredTotal} required items satisfied`,
      );
    }

    const row = await this.lessonProgress.ensureRow(enrollment.id, lessonId);
    row.completedAt = new Date();
    row.completionPercentage = 100;
    await this.lessonProgress.save(row);
    return this.toDto(row);
  }

  async patchLessonProgress(
    courseId: string,
    lessonId: string,
    dto: PatchLessonProgressDto,
    caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can record lesson progress');
    }
    const schoolId = this.resolveSchoolId(caller);
    await this.loadPublishedCourseForStudent(courseId, schoolId);
    const enrollment = await this.assertStudentEnrollment(caller.id, courseId);
    const lessonCheck = await this.contentDal.findLesson(courseId, lessonId);
    if (!lessonCheck) throw new NotFoundException('Lesson not found');

    const row = await this.lessonProgress.ensureRow(enrollment.id, lessonId);
    if (!row.startedAt) {
      throw new BadRequestException(
        'Start the lesson before updating time or completion fields',
      );
    }
    if (dto.additionalTimeSpentSeconds != null) {
      row.timeSpentSeconds += dto.additionalTimeSpentSeconds;
    }
    await this.lessonProgress.save(row);
    await this.sync.recalculateAndSave(courseId, enrollment.id, lessonId);
    const fresh = await this.lessonProgress.findByEnrollmentAndLesson(
      enrollment.id,
      lessonId,
    );
    return this.toDto(fresh!);
  }

  async acknowledgeContentItem(
    courseId: string,
    contentItemId: string,
    caller: AuthCaller,
  ): Promise<{ acknowledgedAt: Date }> {
    if (caller.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Only students can acknowledge content');
    }
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.loadPublishedCourseForStudent(courseId, schoolId);
    const enrollment = await this.assertStudentEnrollment(caller.id, courseId);

    const item = await this.contentDal.findContentItemInCourse(
      courseId,
      contentItemId,
    );
    if (!item) throw new NotFoundException('Content item not found');

    await this.sequential.assertLessonReachable(
      course,
      courseId,
      item.lessonId,
      enrollment.id,
    );

    const lpRow = await this.lessonProgress.findByEnrollmentAndLesson(
      enrollment.id,
      item.lessonId,
    );
    if (!lpRow?.startedAt) {
      throw new BadRequestException(
        'Start the lesson before acknowledging content',
      );
    }

    const result = await this.itemProgress.acknowledgeItem({
      courseEnrollmentId: enrollment.id,
      contentItemId: item.id,
    });
    await this.sync.recalculateAndSave(
      courseId,
      enrollment.id,
      item.lessonId,
    );
    return result;
  }
}
