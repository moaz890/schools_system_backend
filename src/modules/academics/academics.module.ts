import { Module } from '@nestjs/common';
import { StagesModule } from './stages/stages.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { StageGradeLevelsController } from './stages/stage-grade-levels.controller';

@Module({
  imports: [StagesModule, GradeLevelsModule, ClassesModule, SubjectsModule, EnrollmentsModule],
  controllers: [StageGradeLevelsController],
})
export class AcademicsModule {}
