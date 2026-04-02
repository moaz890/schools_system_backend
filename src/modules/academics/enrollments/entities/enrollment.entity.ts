import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

@Entity('enrollments')
@Index('IDX_enrollments_student_year', ['studentId', 'academicYearId'])
@Index('IDX_enrollments_class', ['classId'])
export class Enrollment extends BaseEntity {
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

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @ManyToOne(() => ClassSection, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassSection;

  // Stored for easier validation/indexing.
  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'enrollment_date', type: 'timestamptz' })
  enrollmentDate: Date;

  @Column({ name: 'status', type: 'varchar', default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;
}
