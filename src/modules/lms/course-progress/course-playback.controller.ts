import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
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
import { VideoStreamConfigResponseDto } from '../video-streaming/dto/video-stream-config-response.dto';
import { PatchVideoProgressDto } from './dto/patch-video-progress.dto';
import { VideoProgressResponseDto } from './dto/video-progress-response.dto';
import { CoursePlaybackService } from './services/course-playback.service';

/**
 * Student playback + telemetry. Routes use multi-segment paths so they must be registered
 * before `GET /courses/:id` in {@link CoursesController} (import order in {@link LmsModule}).
 */
@ApiTags('LMS Course playback')
@ApiBearerAuth('access-token')
@Controller('courses')
export class CoursePlaybackController {
  constructor(private readonly playback: CoursePlaybackService) {}

  @Get(':courseId/content-items/:contentItemId/stream-config')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Video stream config for a content item (strategy + URLs + tracking rules)',
  })
  @ApiOkResponse({ type: VideoStreamConfigResponseDto })
  getStreamConfig(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @CurrentUser() caller: AuthCaller,
  ): Promise<VideoStreamConfigResponseDto> {
    return this.playback.getStreamConfig(courseId, contentItemId, caller);
  }

  @Patch(':courseId/content-items/:contentItemId/video-progress')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Report video seconds watched (monotonic max stored server-side)',
  })
  @ApiOkResponse({ type: VideoProgressResponseDto })
  patchVideoProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('contentItemId', ParseUUIDPipe) contentItemId: string,
    @Body() dto: PatchVideoProgressDto,
    @CurrentUser() caller: AuthCaller,
  ): Promise<VideoProgressResponseDto> {
    return this.playback.patchVideoProgress(courseId, contentItemId, dto, caller);
  }
}
