import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { Course } from '../../courses/entities/course.entity';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';
import { CourseEnrollmentStatus } from '../enums/course-enrollment-status.enum';

@Entity('course_enrollments')
@Index('IDX_course_enrollments_school_course', ['schoolId', 'courseId'])
@Index('IDX_course_enrollments_school_student', ['schoolId', 'studentId'])
@Index(
  'UQ_course_enrollments_student_course_active',
  ['studentId', 'courseId'],
  {
    unique: true,
    where: `"deleted_at" IS NULL AND status = 'active'`,
  },
)
export class CourseEnrollment extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  /** Snapshot of the course catalog type at enrollment time (audit / reporting). */
  @Column({ name: 'enrollment_type', type: 'varchar', length: 24 })
  enrollmentType: CourseCatalogEnrollmentType;

  @Column({ type: 'varchar', length: 24, default: CourseEnrollmentStatus.ACTIVE })
  status: CourseEnrollmentStatus;

  @Column({ name: 'enrolled_at', type: 'timestamptz' })
  enrolledAt: Date;
}
