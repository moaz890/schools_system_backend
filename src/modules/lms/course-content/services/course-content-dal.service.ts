import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { CourseUnit } from '../entities/course-unit.entity';
import { CourseLesson } from '../entities/course-lesson.entity';
import { ContentItem } from '../entities/content-item.entity';

@Injectable()
export class CourseContentDalService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseUnit)
    private readonly unitRepo: Repository<CourseUnit>,
    @InjectRepository(CourseLesson)
    private readonly lessonRepo: Repository<CourseLesson>,
    @InjectRepository(ContentItem)
    private readonly itemRepo: Repository<ContentItem>,
  ) {}

  findCourse(courseId: string, schoolId: string) {
    return this.courseRepo.findOne({
      where: { id: courseId, schoolId },
    });
  }

  findUnit(courseId: string, unitId: string) {
    return this.unitRepo.findOne({
      where: { id: unitId, courseId },
    });
  }

  findLesson(courseId: string, lessonId: string) {
    return this.lessonRepo.findOne({
      where: { id: lessonId, courseId },
    });
  }

  findItemForLesson(lessonId: string, itemId: string) {
    return this.itemRepo.findOne({
      where: { id: itemId, lessonId },
    });
  }

  findContentItemInCourse(courseId: string, itemId: string) {
    return this.itemRepo
      .createQueryBuilder('i')
      .innerJoin('i.lesson', 'l')
      .where('i.id = :itemId', { itemId })
      .andWhere('l.course_id = :courseId', { courseId })
      .andWhere('i.deleted_at IS NULL')
      .getOne();
  }

  countUnits(courseId: string) {
    return this.unitRepo.count({ where: { courseId } });
  }

  countRootLessons(courseId: string) {
    return this.lessonRepo.count({
      where: { courseId, unitId: IsNull() },
    });
  }

  async nextUnitPosition(courseId: string): Promise<number> {
    const row = await this.unitRepo
      .createQueryBuilder('u')
      .select('COALESCE(MAX(u.position), -1)', 'max') 
      .where('u.course_id = :courseId', { courseId })
      .andWhere('u.deleted_at IS NULL')
      .getRawOne<{ max: string }>();
    return Number(row?.max ?? -1) + 1;
  }

  async nextLessonPositionInUnit(unitId: string): Promise<number> {
    const row = await this.lessonRepo
      .createQueryBuilder('l')
      .select('COALESCE(MAX(l.position), -1)', 'max')
      .where('l.unit_id = :unitId', { unitId })
      .andWhere('l.deleted_at IS NULL')
      .getRawOne<{ max: string }>();
    return Number(row?.max ?? -1) + 1;
  }

  async nextRootLessonPosition(courseId: string): Promise<number> {
    const row = await this.lessonRepo
      .createQueryBuilder('l')
      .select('COALESCE(MAX(l.position), -1)', 'max')
      .where('l.course_id = :courseId', { courseId })
      .andWhere('l.unit_id IS NULL')
      .andWhere('l.deleted_at IS NULL')
      .getRawOne<{ max: string }>();
    return Number(row?.max ?? -1) + 1;
  }

  async nextItemPosition(lessonId: string): Promise<number> {
    const row = await this.itemRepo
      .createQueryBuilder('i')
      .select('COALESCE(MAX(i.position), -1)', 'max')
      .where('i.lesson_id = :lessonId', { lessonId })
      .andWhere('i.deleted_at IS NULL')
      .getRawOne<{ max: string }>();
    return Number(row?.max ?? -1) + 1;
  }

  listUnitsWithLessonsAndItems(courseId: string) {
    return this.unitRepo.find({
      where: { courseId },
      relations: ['lessons', 'lessons.contentItems'],
      order: { position: 'ASC' },
    });
  }

  listRootLessonsWithItems(courseId: string) {
    return this.lessonRepo.find({
      where: { courseId, unitId: IsNull() },
      relations: ['contentItems'],
      order: { position: 'ASC' },
    });
  }

  listLessonsInUnit(unitId: string) {
    return this.lessonRepo.find({
      where: { unitId },
      relations: ['contentItems'],
      order: { position: 'ASC' },
    });
  }

  listItems(lessonId: string) {
    return this.itemRepo.find({
      where: { lessonId },
      order: { position: 'ASC' },
    });
  }

  saveUnit(row: CourseUnit) {
    return this.unitRepo.save(row);
  }

  saveLesson(row: CourseLesson) {
    return this.lessonRepo.save(row);
  }

  saveItem(row: ContentItem) {
    return this.itemRepo.save(row);
  }

  saveCourse(row: Course) {
    return this.courseRepo.save(row);
  }

  async softRemoveUnitCascade(unit: CourseUnit) {
    const lessons = await this.lessonRepo.find({
      where: { unitId: unit.id },
    });
    for (const lesson of lessons) {
      const items = await this.itemRepo.find({
        where: { lessonId: lesson.id },
      });
      if (items.length) await this.itemRepo.softRemove(items);
      await this.lessonRepo.softRemove(lesson);
    }
    await this.unitRepo.softRemove(unit);
  }

  async softRemoveLessonCascade(lesson: CourseLesson) {
    const items = await this.itemRepo.find({
      where: { lessonId: lesson.id },
    });
    if (items.length) await this.itemRepo.softRemove(items);
    await this.lessonRepo.softRemove(lesson);
  }

  async softRemoveItem(item: ContentItem) {
    await this.itemRepo.softRemove(item);
  }
}
