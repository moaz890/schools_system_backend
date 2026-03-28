import { Module } from '@nestjs/common';
import { StagesModule } from './stages/stages.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { StageGradeLevelsController } from './stages/stage-grade-levels.controller';

@Module({
    imports: [StagesModule, GradeLevelsModule],
    controllers: [StageGradeLevelsController],
})
export class AcademicsModule { }
