import { Module } from '@nestjs/common';
import { StudentEnrolledListener } from './listeners/student-enrolled.listener';
import { GradeLevelSubjectRemovedListener } from './listeners/grade-level-subject-removed.listener';

@Module({
  providers: [StudentEnrolledListener, GradeLevelSubjectRemovedListener],
})
export class AcademicsEventsModule {}
