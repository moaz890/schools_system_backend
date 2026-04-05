import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { ContentItem } from '../../course-content/entities/content-item.entity';
import { CourseEnrollment } from '../../course-enrollments/entities/course-enrollment.entity';

@Entity('content_item_progress')
@Index('IDX_content_item_progress_enrollment', ['courseEnrollmentId'])
@Index(
  'UQ_content_item_progress_enrollment_item',
  ['courseEnrollmentId', 'contentItemId'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class ContentItemProgress extends BaseEntity {
  @Column({ name: 'course_enrollment_id', type: 'uuid' })
  courseEnrollmentId: string;

  @ManyToOne(() => CourseEnrollment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_enrollment_id' })
  courseEnrollment: CourseEnrollment;

  @Column({ name: 'content_item_id', type: 'uuid' })
  contentItemId: string;

  @ManyToOne(() => ContentItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'content_item_id' })
  contentItem: ContentItem;

  @Column({ name: 'video_seconds_watched_max', type: 'int', default: 0 })
  videoSecondsWatchedMax: number;

  /** Set when the student explicitly acknowledges static / link content, or video without reliable duration. */
  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt: Date | null;
}
