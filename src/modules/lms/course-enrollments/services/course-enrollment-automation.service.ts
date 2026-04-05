import { Injectable, Logger } from '@nestjs/common';
import { StudentEnrolledEvent } from '../../../academics/events/student-enrolled.event';
import { MandatoryCourseLinkedToClassEvent } from '../../events/mandatory-course-linked-to-class.event';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';
import { CourseEnrollmentPersistenceService } from './course-enrollment-persistence.service';

/**
 * Orchestrates automatic LMS course enrollments in response to domain events.
 * No HTTP or Nest decorators — easy to unit test (SRP / DIP).
 *
 * Policy: auto-enrollment does not depend on course `isPublished`; visibility is a separate concern.
 */
@Injectable()
export class CourseEnrollmentAutomationService {
  private readonly logger = new Logger(CourseEnrollmentAutomationService.name);

  constructor(
    private readonly persistence: CourseEnrollmentPersistenceService,
  ) {}

  /** Student joined a class → enroll in every mandatory course for that class. */
  async enrollStudentInMandatoryCoursesForClass(
    event: StudentEnrolledEvent,
  ): Promise<void> {
    const courses = await this.persistence.listMandatoryCoursesForClass(
      event.classId,
      event.schoolId,
    );
    for (const course of courses) {
      const created = await this.persistence.tryCreateActiveEnrollment({
        schoolId: event.schoolId,
        studentId: event.studentId,
        courseId: course.id,
        enrollmentType: course.enrollmentType,
      });
      if (created) {
        this.logger.debug(
          `Auto-enrolled student ${event.studentId} in course ${course.id}`,
        );
      }
    }
  }

  /** Mandatory course created for a class → enroll all active class students. */
  async enrollClassStudentsInMandatoryCourse(
    event: MandatoryCourseLinkedToClassEvent,
  ): Promise<void> {
    const course = await this.persistence.findCourseById(
      event.courseId,
      event.schoolId,
    );
    if (!course) {
      this.logger.warn(
        `Mandatory course event for missing course ${event.courseId}`,
      );
      return;
    }
    if (course.enrollmentType !== CourseCatalogEnrollmentType.MANDATORY) {
      return;
    }
    if (course.classId !== event.classId) {
      this.logger.warn(
        `Course ${event.courseId} class mismatch for event class ${event.classId}`,
      );
      return;
    }

    const studentIds = await this.persistence.listActiveStudentIdsInClass(
      event.classId,
      event.schoolId,
    );

    for (const studentId of studentIds) {
      const created = await this.persistence.tryCreateActiveEnrollment({
        schoolId: event.schoolId,
        studentId,
        courseId: course.id,
        enrollmentType: course.enrollmentType,
      });
      if (created) {
        this.logger.debug(
          `Bulk-enrolled student ${studentId} in new course ${course.id}`,
        );
      }
    }
  }
}
