import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { ContentItem } from '../entities/content-item.entity';
import { CourseContentDalService } from './course-content-dal.service';
import { CourseContentSharedService } from './course-content-shared.service';
import type { CreateContentItemDto } from '../dto/create-content-item.dto';
import type { UpdateContentItemDto } from '../dto/update-content-item.dto';
import type { ReorderContentItemsDto } from '../dto/reorder-content-items.dto';

@Injectable()
export class CourseContentItemsService {
  constructor(
    private readonly dal: CourseContentDalService,
    private readonly shared: CourseContentSharedService,
  ) {}

  async createItem(
    courseId: string,
    lessonId: string,
    dto: CreateContentItemDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const lesson = await this.dal.findLesson(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const position =
      dto.position ?? (await this.dal.nextItemPosition(lessonId));
    const item = new ContentItem();
    item.lessonId = lessonId;
    item.position = position;
    item.contentType = dto.contentType;
    item.isRequired = dto.isRequired ?? true;
    item.payload = dto.payload;
    await this.dal.saveItem(item);

    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async updateItem(
    courseId: string,
    itemId: string,
    dto: UpdateContentItemDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);

    if (course.isPublished) {
      throw new BadRequestException(
        'Content items cannot be changed while the course is published.',
      );
    }

    const item = await this.dal.findContentItemInCourse(courseId, itemId);
    if (!item) throw new NotFoundException('Content item not found');

    if (
      dto.contentType === undefined &&
      dto.isRequired === undefined &&
      dto.payload === undefined
    ) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.contentType !== undefined) item.contentType = dto.contentType;
    if (dto.isRequired !== undefined) item.isRequired = dto.isRequired;
    if (dto.payload !== undefined) item.payload = dto.payload;
    await this.dal.saveItem(item);

    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async deleteItem(courseId: string, itemId: string, caller: AuthCaller) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const row = await this.dal.findContentItemInCourse(courseId, itemId);
    if (!row) throw new NotFoundException('Content item not found');
    await this.dal.softRemoveItem(row);

    const c = await this.shared.loadCourse(courseId, schoolId);
    return this.shared.buildStructureDto(courseId, c.structureKind);
  }

  async reorderItems(
    courseId: string,
    lessonId: string,
    dto: ReorderContentItemsDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.shared.resolveSchoolId(caller);
    const course = await this.shared.loadCourse(courseId, schoolId);
    this.shared.assertCourseAccess(course, caller);
    this.shared.assertStructuralEditAllowed(course);

    const lesson = await this.dal.findLesson(courseId, lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');

    const items = await this.dal.listItems(lessonId);
    const activeIds = new Set(items.map((i) => i.id));
    if (dto.orderedItemIds.length !== activeIds.size) {
      throw new BadRequestException(
        'orderedItemIds must list every item in the lesson exactly once',
      );
    }
    for (const id of dto.orderedItemIds) {
      if (!activeIds.has(id))
        throw new BadRequestException(`Unknown item id: ${id}`);
    }
    for (let i = 0; i < dto.orderedItemIds.length; i++) {
      const row = items.find((x) => x.id === dto.orderedItemIds[i])!;
      row.position = i;
      await this.dal.saveItem(row);
    }
    return this.shared.buildStructureDto(courseId, course.structureKind);
  }
}
