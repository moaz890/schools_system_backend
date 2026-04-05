import { Module } from '@nestjs/common';
import { CourseEnrollmentsModule } from './course-enrollments/course-enrollments.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    CoursesModule,
    CourseEnrollmentsModule,
    // LessonsModule,
    // QuizModule,
    // SubmissionModule,
    // UserModule,
  ],
})
export class LmsModule {}