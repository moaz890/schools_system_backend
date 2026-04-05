import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';
import { CourseContentUnitsService } from './services/course-content-units.service';
import { CourseContentLessonsService } from './services/course-content-lessons.service';
import { CourseContentItemsService } from './services/course-content-items.service';
import { CreateCourseUnitDto } from './dto/create-course-unit.dto';
import { UpdateCourseUnitDto } from './dto/update-course-unit.dto';
import { ReorderCourseUnitsDto } from './dto/reorder-course-units.dto';
import { CreateCourseLessonDto } from './dto/create-course-lesson.dto';
import { UpdateCourseLessonDto } from './dto/update-course-lesson.dto';
import { ReorderCourseLessonsDto } from './dto/reorder-course-lessons.dto';
import { CreateContentItemDto } from './dto/create-content-item.dto';
import { UpdateContentItemDto } from './dto/update-content-item.dto';
import { ReorderContentItemsDto } from './dto/reorder-content-items.dto';

@ApiTags('LMS Course content')
@ApiBearerAuth('access-token')
@Controller('courses/:courseId')
export class CourseContentController {
  constructor(
    private readonly units: CourseContentUnitsService,
    private readonly lessons: CourseContentLessonsService,
    private readonly items: CourseContentItemsService,
  ) {}

  @Post('units')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a unit (nested structure)' })
  createUnit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateCourseUnitDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.units.createUnit(courseId, dto, caller);
  }

  @Patch('units/reorder')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Reorder units' })
  reorderUnits(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderCourseUnitsDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.units.reorderUnits(courseId, dto, caller);
  }

  @Patch('units/:unitId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update unit title/description' })
  updateUnit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: UpdateCourseUnitDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.units.updateUnit(courseId, unitId, dto, caller);
  }

  @Delete('units/:unitId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Delete a unit (cascades lessons and their content items)',
  })
  deleteUnit(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.units.deleteUnit(courseId, unitId, caller);
  }

  @Post('lessons')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary:
      'Create a lesson (root lesson for flat mode, or set unitId for nested mode)',
  })
  createLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateCourseLessonDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.lessons.createLesson(courseId, dto, caller);
  }

  @Patch('lessons/reorder')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary:
      'Reorder lessons (omit unitId for root lessons; set unitId for lessons inside a unit)',
  })
  reorderLessons(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: ReorderCourseLessonsDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.lessons.reorderLessons(courseId, dto, caller);
  }

  @Patch('lessons/:lessonId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update lesson title/description' })
  updateLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateCourseLessonDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.lessons.updateLesson(courseId, lessonId, dto, caller);
  }

  @Delete('lessons/:lessonId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({
    summary: 'Delete a lesson (cascades content items)',
  })
  deleteLesson(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.lessons.deleteLesson(courseId, lessonId, caller);
  }

  @Post('lessons/:lessonId/items')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Add a content item to a lesson' })
  createItem(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: CreateContentItemDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.items.createItem(courseId, lessonId, dto, caller);
  }

  @Patch('lessons/:lessonId/items/reorder')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Reorder content items within a lesson' })
  reorderItems(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: ReorderContentItemsDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.items.reorderItems(courseId, lessonId, dto, caller);
  }

  @Patch('items/:itemId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a content item (blocked while published)' })
  updateItem(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateContentItemDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.items.updateItem(courseId, itemId, dto, caller);
  }

  @Delete('items/:itemId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete a content item' })
  deleteItem(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.items.deleteItem(courseId, itemId, caller);
  }
}
