import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { ClassSection } from '../../../academics/classes/entities/class.entity';
import { Subject } from '../../../academics/subjects/entities/subject.entity';
import { CourseStructureKind } from '../../course-content/enums/course-structure-kind.enum';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';

@Entity('courses')
@Index('IDX_courses_school_class', ['schoolId', 'classId'])
@Index('IDX_courses_school_subject', ['schoolId', 'subjectId'])
@Index(
  'UQ_courses_school_class_subject',
  ['schoolId', 'classId', 'subjectId'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class Course extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => ClassSection, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  classSection: ClassSection;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'description', type: 'jsonb', nullable: true })
  description: LocalizedString | null;

  @Column({ name: 'objectives', type: 'jsonb', nullable: true })
  objectives: LocalizedString | null;

  @Column({
    name: 'duration_label',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  durationLabel: string | null;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate: Date;

  @Column({
    name: 'sequential_learning_enabled',
    type: 'boolean',
    default: false,
  })
  sequentialLearningEnabled: boolean;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  /**
   * Mandatory: auto-enroll all students in the class (via events).
   * Elective: enrollment only through a future manual API (Phase 3+).
   */
  @Column({
    name: 'enrollment_type',
    type: 'varchar',
    length: 24,
    default: CourseCatalogEnrollmentType.MANDATORY,
  })
  enrollmentType: CourseCatalogEnrollmentType;

  @Column({
    name: 'structure_kind',
    type: 'varchar',
    length: 16,
    nullable: true,
  })
  structureKind: CourseStructureKind | null;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;
}
