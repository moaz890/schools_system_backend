import { Module } from '@nestjs/common';
import { CourseEnrollmentsModule } from './course-enrollments/course-enrollments.module';
import { CourseProgressModule } from './course-progress/course-progress.module';
import { CoursesModule } from './courses/courses.module';

@Module({
  imports: [
    CourseProgressModule,
    CoursesModule,
    CourseEnrollmentsModule,
    // LessonsModule,
    // QuizModule,
    // SubmissionModule,
    // UserModule,
  ],
})
export class LmsModule {}