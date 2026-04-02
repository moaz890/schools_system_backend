import { Module } from "@nestjs/common";
import { CoursesModule } from "./courses/courses.module";


@Module({
  imports: [
    CoursesModule,
    // LessonsModule,
    // QuizModule,
    // SubmissionModule,
    // UserModule,
  ],
})
export class LmsModule {}