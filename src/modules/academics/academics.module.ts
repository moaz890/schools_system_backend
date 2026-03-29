import { Module } from '@nestjs/common';
import { StagesModule } from './stages/stages.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StageGradeLevelsController } from './stages/stage-grade-levels.controller';

@Module({
  imports: [StagesModule, GradeLevelsModule, SubjectsModule],
  controllers: [StageGradeLevelsController],
})
export class AcademicsModule {}
