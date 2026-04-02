import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CoursesDalService } from './dal.service';
import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesPublishingService {
  constructor(private readonly dal: CoursesDalService) {}

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

  async publish(courseId: string, caller: AuthCaller): Promise<Course> {
    const schoolId = this.resolveSchoolId(caller);

    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');

    this.assertTeacherOwnership(course, caller);

    course.isPublished = true;
    return this.dal.saveCourse(course);
  }

  async unpublish(courseId: string, caller: AuthCaller): Promise<Course> {
    const schoolId = this.resolveSchoolId(caller);

    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');

    this.assertTeacherOwnership(course, caller);

    course.isPublished = false;
    return this.dal.saveCourse(course);
  }
}

