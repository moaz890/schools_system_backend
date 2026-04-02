import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { GradeLevelSubject } from './entities/grade-level-subject.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { GradeLevelsService } from './services/grade-levels.service';
import { GradeLevelSubjectsService } from './services/grade-level-subjects.service';
import { GradeLevelsController } from './grade-levels.controller';
import { StagesModule } from '../stages/stages.module';
import { TeacherAssignment } from '../teacher-assignments/entities/teacher-assignment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GradeLevel,
      GradeLevelSubject,
      Subject,
      TeacherAssignment,
    ]),
    StagesModule,
  ],
  controllers: [GradeLevelsController],
  providers: [GradeLevelsService, GradeLevelSubjectsService],
  exports: [GradeLevelsService, GradeLevelSubjectsService],
})
export class GradeLevelsModule {}
