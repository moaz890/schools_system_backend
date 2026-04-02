import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CoursesDalService } from './dal.service';
import { CoursesResponseMapperService } from './courses-response-mapper.service';
import { Course } from '../entities/course.entity';
import type { CourseResponseDto } from '../dto/course-response.dto';

@Injectable()
export class CoursesPublishingService {
  constructor(
    private readonly dal: CoursesDalService,
    private readonly responseMapper: CoursesResponseMapperService,
  ) {}

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private assertTeacherOwnership(course: Course, caller: AuthCaller) {
    if (caller.role !== UserRole.TEACHER) return;

    if (course.teacherId !== caller.id) {
      throw new BadRequestException('You can only publish/unpublish your own courses');
    }
  }

  async publish(
    courseId: string,
    caller: AuthCaller,
  ): Promise<CourseResponseDto> {
    const schoolId = this.resolveSchoolId(caller);

    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');

    this.assertTeacherOwnership(course, caller);

    course.isPublished = true;
    await this.dal.saveCourse(course);
    const full = await this.dal.findCourseById(courseId, schoolId);
    if (!full) throw new NotFoundException('Course not found after publish');
    return this.responseMapper.toCourseResponse(full);
  }

  async unpublish(
    courseId: string,
    caller: AuthCaller,
  ): Promise<CourseResponseDto> {
    const schoolId = this.resolveSchoolId(caller);

    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');

    this.assertTeacherOwnership(course, caller);

    course.isPublished = false;
    await this.dal.saveCourse(course);
    const full = await this.dal.findCourseById(courseId, schoolId);
    if (!full) throw new NotFoundException('Course not found after unpublish');
    return this.responseMapper.toCourseResponse(full);
  }
}

