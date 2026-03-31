import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';

@Entity('teacher_assignments')
@Index('IDX_teacher_assignments_school_class', ['schoolId', 'classId'])
@Index('IDX_teacher_assignments_school_teacher', ['schoolId', 'teacherId'])
@Index('IDX_teacher_assignments_school_subject', ['schoolId', 'subjectId'])
@Index(
  'UQ_teacher_assignments_active_unique',
  ['schoolId', 'teacherId', 'classId', 'subjectId'],
  { unique: true, where: '"is_active" IS TRUE AND "deleted_at" IS NULL' },
)
export class TeacherAssignment extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => ClassSection, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassSection;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId: string;

  @ManyToOne(() => Subject, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subject_id' })
  subject: Subject;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'start_date', type: 'timestamptz', default: () => 'now()' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}

