import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ContentItemAckResponseDto } from './dto/content-item-ack-response.dto';
import { CourseProgressOverviewDto } from './dto/course-progress-overview.dto';
import { LessonProgressResponseDto } from './dto/lesson-progress-response.dto';
import { PatchLessonProgressDto } from './dto/patch-lesson-progress.dto';
import { CourseLessonProgressService } from './services/course-lesson-progress.service';
import { CourseProgressOverviewService } from './services/course-progress-overview.service';

@ApiTags('LMS Course learning progress')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CourseLearningProgressController {
  constructor(
    private readonly lessonProgress: CourseLessonProgressService,
    private readonly overview: CourseProgressOverviewService,
  ) {}

  @Post(':courseId/lessons/:lessonId/start')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Mark lesson as started (enforces sequential order when enabled)' })
  @ApiOkResponse({ type: LessonProgressResponseDto })
  startLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    return this.lessonProgress.startLesson(courseId, lessonId, caller);
  }

  @Post(':courseId/lessons/:lessonId/complete')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary:
      'Mark lesson complete when all required content items are satisfied (server-validated)',
  })
  @ApiOkResponse({ type: LessonProgressResponseDto })
  completeLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    return this.lessonProgress.completeLesson(courseId, lessonId, caller);
  }

  @Patch(':courseId/lessons/:lessonId/progress')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary:
      'Update lesson progress (e.g. time spent); recomputes completion % from item-level data',
  })
  @ApiOkResponse({ type: LessonProgressResponseDto })
  patchLessonProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: PatchLessonProgressDto,
    @CurrentUser() caller: AuthCaller,
  ): Promise<LessonProgressResponseDto> {
    return this.lessonProgress.patchLessonProgress(courseId, lessonId, dto, caller);
  }

  @Post(':courseId/content-items/:contentItemId/acknowledge')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary:
      'Acknowledge static / link content (and VIDEO without duration) as satisfied for completion rules',
  })
  @ApiOkResponse({ type: ContentItemAckResponseDto })
  acknowledgeContentItem(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @CurrentUser() caller: AuthCaller,
  ): Promise<ContentItemAckResponseDto> {
    return this.lessonProgress.acknowledgeContentItem(
      courseId,
      contentItemId,
      caller,
    );
  }

  @Get(':courseId/progress')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Course + per-lesson progress summary for the current student' })
  @ApiOkResponse({ type: CourseProgressOverviewDto })
  getCourseProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() caller: AuthCaller,
  ): Promise<CourseProgressOverviewDto> {
    return this.overview.getStudentCourseProgress(courseId, caller);
  }
}
