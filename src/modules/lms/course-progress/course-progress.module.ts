import { Module } from '@nestjs/common';
import { CourseContentModule } from '../course-content/course-content.module';
import { CourseEnrollmentsModule } from '../course-enrollments/course-enrollments.module';
import { VideoStreamingModule } from '../video-streaming/video-streaming.module';
import { CoursePlaybackController } from './course-playback.controller';
import { ContentItemProgressWriteService } from './services/content-item-progress-write.service';
import { CoursePlaybackService } from './services/course-playback.service';

@Module({
  imports: [
    VideoStreamingModule,
    CourseContentModule,
    CourseEnrollmentsModule,
  ],
  controllers: [CoursePlaybackController],
  providers: [CoursePlaybackService, ContentItemProgressWriteService],
})
export class CourseProgressModule {}
