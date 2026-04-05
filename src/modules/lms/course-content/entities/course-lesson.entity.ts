import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { Course } from '../../courses/entities/course.entity';
import { CourseUnit } from './course-unit.entity';
import { ContentItem } from './content-item.entity';

@Entity('course_lessons')
@Index('UQ_course_lessons_unit_position', ['unitId', 'position'], {
  unique: true,
  where: '"unit_id" IS NOT NULL AND "deleted_at" IS NULL',
})
@Index('UQ_course_lessons_course_position_root', ['courseId', 'position'], {
  unique: true,
  where: '"unit_id" IS NULL AND "deleted_at" IS NULL',
})
export class CourseLesson extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'unit_id', type: 'uuid', nullable: true })
  unitId: string | null;

  @ManyToOne(() => CourseUnit, (unit) => unit.lessons, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'unit_id' })
  unit: CourseUnit | null;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'jsonb' })
  title: LocalizedString;

  @Column({ type: 'jsonb', nullable: true })
  description: LocalizedString | null;

  @OneToMany(() => ContentItem, (item) => item.lesson)
  contentItems: ContentItem[];
}
