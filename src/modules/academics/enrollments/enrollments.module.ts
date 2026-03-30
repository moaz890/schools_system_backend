import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { StudentGradeLevel } from './entities/student-grade-level.entity';
import { EnrollmentsService } from './services/enrollments.service';
import { EnrollmentsController } from './controllers/enrollments.controller';
import { ClassSection } from '../classes/entities/class.entity';
import { User } from '../../core/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      StudentGradeLevel,
      ClassSection,
      User,
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}

