import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseContentModule } from '../course-content/course-content.module';
import { CourseEnrollmentsModule } from '../course-enrollments/course-enrollments.module';
import { VideoStreamingModule } from '../video-streaming/video-streaming.module';
import { ContentItemProgress } from './entities/content-item-progress.entity';
import { LessonProgress } from './entities/lesson-progress.entity';
import { CourseLearningProgressController } from './course-learning-progress.controller';
import { CoursePlaybackController } from './course-playback.controller';
import { ContentItemProgressPersistenceService } from './services/content-item-progress-persistence.service';
import { CourseLessonOrderService } from './services/course-lesson-order.service';
import { CourseLessonProgressService } from './services/course-lesson-progress.service';
import { CoursePlaybackService } from './services/course-playback.service';
import { CourseProgressOverviewService } from './services/course-progress-overview.service';
import { LessonCompletionCalculatorService } from './services/lesson-completion-calculator.service';
import { LessonProgressCompletionSyncService } from './services/lesson-progress-completion-sync.service';
import { LessonProgressPersistenceService } from './services/lesson-progress-persistence.service';
import { LessonSequentialAccessService } from './services/lesson-sequential-access.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LessonProgress, ContentItemProgress]),
    VideoStreamingModule,
    CourseContentModule,
    CourseEnrollmentsModule,
  ],
  controllers: [CoursePlaybackController, CourseLearningProgressController],
  providers: [
    ContentItemProgressPersistenceService,
    LessonCompletionCalculatorService,
    CourseLessonOrderService,
    LessonProgressPersistenceService,
    LessonProgressCompletionSyncService,
    LessonSequentialAccessService,
    CoursePlaybackService,
    CourseLessonProgressService,
    CourseProgressOverviewService,
  ],
})
export class CourseProgressModule {}
