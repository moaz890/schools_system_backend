import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolStrategiesModule } from '../../core/school-strategies/school-strategies.module';
import { Subject } from './entities/subject.entity';
import { SubjectAssessmentProfile } from './entities/subject-assessment-profile.entity';
import { SubjectsService } from './subjects.service';
import { SubjectAssessmentProfilesService } from './subject-assessment-profiles.service';
import { SubjectsController } from './subjects.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, SubjectAssessmentProfile]),
    SchoolStrategiesModule,
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService, SubjectAssessmentProfilesService],
  exports: [SubjectsService, SubjectAssessmentProfilesService],
})
export class SubjectsModule {}
