import { Module } from '@nestjs/common';
import { StagesModule } from './stages/stages.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { TeacherAssignmentsModule } from './teacher-assignments/teacher-assignments.module';
import { StageGradeLevelsController } from './stages/stage-grade-levels.controller';
import { AcademicsEventsModule } from './events/academics-events.module';

@Module({
  imports: [
    StagesModule,
    GradeLevelsModule,
    ClassesModule,
    SubjectsModule,
    EnrollmentsModule,
    TeacherAssignmentsModule,
    AcademicsEventsModule,
  ],
  controllers: [StageGradeLevelsController],
})
export class AcademicsModule {}
