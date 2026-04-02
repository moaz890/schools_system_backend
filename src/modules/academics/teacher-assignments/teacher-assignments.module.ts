import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherSubjectSpecialization } from './entities/teacher-subject-specialization.entity';
import { TeacherAssignment } from './entities/teacher-assignment.entity';
import { TeacherSpecializationsService } from './services/teacher-specializations.service';
import { TeacherSpecializationsController } from './controllers/teacher-specializations.controller';
import { User } from '../../core/users/entities/user.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { Stage } from '../stages/entities/stage.entity';
import { ClassSection } from '../classes/entities/class.entity';
import { GradeLevelSubject } from '../grade-levels/entities/grade-level-subject.entity';
import { TeacherAssignmentsService } from './services/teacher-assignments.service';
import { TeacherAssignmentsDalService } from './services/teacher-assignments-dal.service';
import { TeacherAssignmentsHelpersService } from './services/teacher-assignments-helpers.service';
import { TeacherAssignmentsController } from './controllers/teacher-assignments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeacherSubjectSpecialization,
      TeacherAssignment,
      ClassSection,
      GradeLevelSubject,
      User,
      Subject,
      Stage,
    ]),
  ],
  controllers: [TeacherSpecializationsController, TeacherAssignmentsController],
  providers: [
    TeacherSpecializationsService,
    TeacherAssignmentsDalService,
    TeacherAssignmentsHelpersService,
    TeacherAssignmentsService,
  ],
  exports: [TeacherSpecializationsService, TeacherAssignmentsService],
})
export class TeacherAssignmentsModule {}
