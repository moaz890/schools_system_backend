import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { GradeLevelSubject } from './entities/grade-level-subject.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { GradeLevelsService } from './grade-levels.service';
import { GradeLevelSubjectsService } from './grade-level-subjects.service';
import { GradeLevelsController } from './grade-levels.controller';
import { StagesModule } from '../stages/stages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GradeLevel, GradeLevelSubject, Subject]),
    StagesModule,
  ],
  controllers: [GradeLevelsController],
  providers: [GradeLevelsService, GradeLevelSubjectsService],
  exports: [GradeLevelsService, GradeLevelSubjectsService],
})
export class GradeLevelsModule {}
