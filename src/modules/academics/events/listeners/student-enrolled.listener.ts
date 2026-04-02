import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { STUDENT_ENROLLED_EVENT } from '../academics-events.constants';
import type { StudentEnrolledEvent } from '../student-enrolled.event';

/**
 * Hook point for caches, notifications, or future materialized gradebook rows.
 * Subject membership stays derived from class → grade curriculum (no per-student rows).
 */
@Injectable()
export class StudentEnrolledListener {
  private readonly logger = new Logger(StudentEnrolledListener.name);

  @OnEvent(STUDENT_ENROLLED_EVENT)
  handle(payload: StudentEnrolledEvent): void {
    this.logger.debug(
      `StudentEnrolled enrollment=${payload.enrollmentId} student=${payload.studentId} class=${payload.classId}`,
    );
  }
}
