import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { User } from '../../../core/users/entities/user.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

@Entity('student_grade_levels')
@Index(
  'UQ_student_grade_levels_active',
  ['schoolId', 'studentId', 'academicYearId'],
  {
    unique: true,
    where: `"status" = 'active' AND "deleted_at" IS NULL`,
  },
)
export class StudentGradeLevel extends BaseEntity {
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

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'grade_level_id', type: 'uuid' })
  gradeLevelId: string;

  @ManyToOne(() => GradeLevel, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grade_level_id' })
  gradeLevel: GradeLevel;

  @Column({ name: 'status', type: 'varchar', default: EnrollmentStatus.ACTIVE })
  status: EnrollmentStatus;
}
