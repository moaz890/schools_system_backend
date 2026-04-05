import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { CourseLesson } from '../../course-content/entities/course-lesson.entity';
import { CourseEnrollment } from '../../course-enrollments/entities/course-enrollment.entity';

@Entity('lesson_progress')
@Index('IDX_lesson_progress_enrollment', ['courseEnrollmentId'])
@Index('UQ_lesson_progress_enrollment_lesson', ['courseEnrollmentId', 'lessonId'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class LessonProgress extends BaseEntity {
  @Column({ name: 'course_enrollment_id', type: 'uuid' })
  courseEnrollmentId: string;

  @ManyToOne(() => CourseEnrollment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_enrollment_id' })
  courseEnrollment: CourseEnrollment;

  @Column({ name: 'lesson_id', type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => CourseLesson, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lesson_id' })
  lesson: CourseLesson;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'completion_percentage', type: 'smallint', default: 0 })
  completionPercentage: number;

  @Column({ name: 'time_spent_seconds', type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ name: 'video_seconds_watched', type: 'int', default: 0 })
  videoSecondsWatched: number;
}
