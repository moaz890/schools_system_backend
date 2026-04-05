import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { Course } from '../../courses/entities/course.entity';
import { CourseLesson } from './course-lesson.entity';

@Entity('course_units')
@Index('UQ_course_units_course_position', ['courseId', 'position'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class CourseUnit extends BaseEntity {
  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'jsonb' })
  title: LocalizedString;

  @Column({ type: 'jsonb', nullable: true })
  description: LocalizedString | null;

  @OneToMany(() => CourseLesson, (lesson) => lesson.unit)
  lessons: CourseLesson[];
}
