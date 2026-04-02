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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CoursesPublishingService } from './services/courses-publishing.service';
import { CoursesService } from './services/courses.service';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('LMS Courses')
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
  create(@Body() dto: CreateCourseDto, @CurrentUser() caller: AuthCaller) {
    return this.coursesService.create(dto, caller);
  }

  /** Must be registered before `GET :id` so `subjects` is not parsed as an id. */
  @Get('subjects/:subjectId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'List courses for a subject' })
  listBySubject(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.listBySubject(subjectId, caller);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get course by id' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.coursesService.get(id, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a course' })
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
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.publishingService.publish(id, caller);
  }

  @Patch(':id/unpublish')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Unpublish a course' })
  unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.publishingService.unpublish(id, caller);
  }
}
