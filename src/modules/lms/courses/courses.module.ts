import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../core/users/entities/user.entity';
import { AcademicYear } from '../../core/academic-years/entities/academic-year.entity';
import { ClassSection } from '../../academics/classes/entities/class.entity';
import { Subject } from '../../academics/subjects/entities/subject.entity';
import { TeacherAssignmentsModule } from '../../academics/teacher-assignments/teacher-assignments.module';
import { Course } from './entities/course.entity';
import { CoursesDalService } from './services/dal.service';
import { CoursesService } from './services/courses.service';
import { CoursesPublishingService } from './services/courses-publishing.service';
import { CoursesResponseMapperService } from './services/courses-response-mapper.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [
    TeacherAssignmentsModule,
    TypeOrmModule.forFeature([
      Course,
      User,
      AcademicYear,
      ClassSection,
      Subject,
    ]),
  ],
  controllers: [CoursesController],
  providers: [
    CoursesDalService,
    CoursesResponseMapperService,
    CoursesService,
    CoursesPublishingService,
  ],
  exports: [CoursesService],
})
export class CoursesModule {}
