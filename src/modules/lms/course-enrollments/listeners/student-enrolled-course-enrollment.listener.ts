import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { STUDENT_ENROLLED_EVENT } from '../../../academics/events/academics-events.constants';
import { StudentEnrolledEvent } from '../../../academics/events/student-enrolled.event';
import { CourseEnrollmentAutomationService } from '../services/course-enrollment-automation.service';

@Injectable()
export class StudentEnrolledCourseEnrollmentListener {
  constructor(
    private readonly automation: CourseEnrollmentAutomationService,
  ) {}

  @OnEvent(STUDENT_ENROLLED_EVENT, { async: true })
  async handleStudentEnrolled(event: StudentEnrolledEvent): Promise<void> {
    await this.automation.enrollStudentInMandatoryCoursesForClass(event);
  }
}
