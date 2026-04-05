import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../courses/entities/course.entity';
import { CourseEnrollment } from './entities/course-enrollment.entity';
import { Enrollment } from '../../academics/enrollments/entities/enrollment.entity';
import { CourseEnrollmentPersistenceService } from './services/course-enrollment-persistence.service';
import { CourseEnrollmentAutomationService } from './services/course-enrollment-automation.service';
import { StudentEnrolledCourseEnrollmentListener } from './listeners/student-enrolled-course-enrollment.listener';
import { MandatoryCourseLinkedListener } from './listeners/mandatory-course-linked.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([CourseEnrollment, Course, Enrollment]),
  ],
  providers: [
    CourseEnrollmentPersistenceService,
    CourseEnrollmentAutomationService,
    StudentEnrolledCourseEnrollmentListener,
    MandatoryCourseLinkedListener,
  ],
  exports: [CourseEnrollmentPersistenceService],
})
export class CourseEnrollmentsModule {}
