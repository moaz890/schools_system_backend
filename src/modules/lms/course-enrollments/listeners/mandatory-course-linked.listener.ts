import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LMS_MANDATORY_COURSE_LINKED_TO_CLASS_EVENT } from '../../events/lms-events.constants';
import { MandatoryCourseLinkedToClassEvent } from '../../events/mandatory-course-linked-to-class.event';
import { CourseEnrollmentAutomationService } from '../services/course-enrollment-automation.service';

@Injectable()
export class MandatoryCourseLinkedListener {
  constructor(
    private readonly automation: CourseEnrollmentAutomationService,
  ) {}

  @OnEvent(LMS_MANDATORY_COURSE_LINKED_TO_CLASS_EVENT, { async: true })
  async handleMandatoryCourseLinked(
    event: MandatoryCourseLinkedToClassEvent,
  ): Promise<void> {
    await this.automation.enrollClassStudentsInMandatoryCourse(event);
  }
}
