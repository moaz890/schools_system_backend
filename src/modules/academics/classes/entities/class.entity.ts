import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { User } from '../../../core/users/entities/user.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';

@Entity('classes')
@Index(
  'UQ_classes_grade_year_letter',
  ['schoolId', 'gradeLevelId', 'academicYearId', 'sectionLetter'],
  {
    unique: true,
    where: '"deleted_at" IS NULL',
  },
)
export class ClassSection extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'grade_level_id', type: 'uuid' })
  gradeLevelId: string;

  @ManyToOne(() => GradeLevel, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grade_level_id' })
  gradeLevel: GradeLevel;

  @Column({ name: 'academic_year_id', type: 'uuid' })
  academicYearId: string;

  @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'academic_year_id' })
  academicYear: AcademicYear;

  @Column({ name: 'section_letter', type: 'varchar', length: 5 })
  sectionLetter: string;

  @Column({ name: 'name', type: 'jsonb' })
  name: LocalizedString;

  @Column({ name: 'capacity', type: 'int' })
  capacity: number;

  @Column({ name: 'homeroom_teacher_id', type: 'uuid' })
  homeroomTeacherId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeroom_teacher_id' })
  homeroomTeacher: User;
}
