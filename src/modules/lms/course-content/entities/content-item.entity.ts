import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { LessonContentType } from '../enums/lesson-content-type.enum';
import { CourseLesson } from './course-lesson.entity';

@Entity('content_items')
@Index('UQ_content_items_lesson_position', ['lessonId', 'position'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class ContentItem extends BaseEntity {
  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => CourseLesson, (lesson) => lesson.contentItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lesson_id' })
  lesson: CourseLesson;

  @Column({ type: 'int' })
  position: number;

  @Column({ name: 'content_type', type: 'varchar', length: 32 })
  contentType: LessonContentType;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;
}
