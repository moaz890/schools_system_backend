import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CoursesPublishingService } from './services/courses-publishing.service';
import { CoursesService } from './services/courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  ContentItemSnippetDto,
  CourseContentStructureDto,
  CourseLessonSnippetDto,
  CourseUnitSnippetDto,
} from '../course-content/dto/course-content-structure-response.dto';
import {
  CourseAcademicYearSnippetDto,
  CourseClassSnippetDto,
  CourseGradeLevelSnippetDto,
  CourseResponseDto,
  CourseSubjectSnippetDto,
  CourseTeacherSnippetDto,
} from './dto/course-response.dto';

@ApiTags('LMS Courses')
@ApiExtraModels(
  CourseResponseDto,
  CourseTeacherSnippetDto,
  CourseSubjectSnippetDto,
  CourseClassSnippetDto,
  CourseGradeLevelSnippetDto,
  CourseAcademicYearSnippetDto,
  CourseContentStructureDto,
  CourseUnitSnippetDto,
  CourseLessonSnippetDto,
  ContentItemSnippetDto,
)
@ApiBearerAuth('access-token')
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly publishingService: CoursesPublishingService,
    private readonly coursesService: CoursesService,
  ) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a course' })
  @ApiOkResponse({
    description: 'Public course payload (no sensitive teacher or admin-only fields)',
    schema: { $ref: getSchemaPath(CourseResponseDto) },
  })
  create(@Body() dto: CreateCourseDto, @CurrentUser() caller: AuthCaller) {
    return this.coursesService.create(dto, caller);
  }

  /** Must be registered before `GET :id` so `subjects` is not parsed as an id. */
  @Get('subjects/:subjectId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'List courses for a subject' })
  @ApiOkResponse({
    description: 'Public course payloads',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(CourseResponseDto) },
    },
  })
  listBySubject(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.listBySubject(subjectId, caller);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get course by id' })
  @ApiOkResponse({
    description: 'Public course payload',
    schema: { $ref: getSchemaPath(CourseResponseDto) },
  })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.get(id, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a course' })
  @ApiOkResponse({
    description: 'Public course payload',
    schema: { $ref: getSchemaPath(CourseResponseDto) },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete (soft) a course' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.delete(id, caller);
  }

  @Patch(':id/publish')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Publish a course' })
  @ApiOkResponse({
    description: 'Public course payload',
    schema: { $ref: getSchemaPath(CourseResponseDto) },
  })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.publishingService.publish(id, caller);
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Unpublish a course' })
  @ApiOkResponse({
    description: 'Public course payload',
    schema: { $ref: getSchemaPath(CourseResponseDto) },
  })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.publishingService.unpublish(id, caller);
  }
}
