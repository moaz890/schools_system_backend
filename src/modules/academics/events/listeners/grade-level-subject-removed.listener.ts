import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GRADE_LEVEL_SUBJECT_REMOVED_EVENT } from '../academics-events.constants';
import type { GradeLevelSubjectRemovedEvent } from '../grade-level-subject-removed.event';

/** Extend with cascades when exam/assignment entities exist. */
@Injectable()
export class GradeLevelSubjectRemovedListener {
  private readonly logger = new Logger(GradeLevelSubjectRemovedListener.name);

  @OnEvent(GRADE_LEVEL_SUBJECT_REMOVED_EVENT)
  handle(payload: GradeLevelSubjectRemovedEvent): void {
    this.logger.debug(
      `GradeLevelSubjectRemoved gradeLevel=${payload.gradeLevelId} subject=${payload.subjectId}`,
    );
  }
}
