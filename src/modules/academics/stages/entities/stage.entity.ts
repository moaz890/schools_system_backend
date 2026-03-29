import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import type { GradeLevel } from '../../grade-levels/entities/grade-level.entity';

@Entity('stages')
@Index('UQ_stages_school_order', ['schoolId', 'order'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Stage extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @Column({ name: 'name', type: 'jsonb' })
  name: LocalizedString;

  @Column({ name: 'order', type: 'int' })
  order: number;

  @Column({ name: 'max_grades', type: 'int' })
  maxGrades: number;

  @Column({ name: 'is_kindergarten', type: 'boolean', default: false })
  isKindergarten: boolean;

  /**
   * Prefix used to auto-name grades, e.g. { en: "Grade", ar: "الصف" }.
   * Required for non-KG stages; nullable for KG (where names are manual).
   */
  @Column({ name: 'grade_name_prefix', type: 'jsonb', nullable: true })
  gradeNamePrefix: LocalizedString | null;

  @OneToMany('GradeLevel', 'stage')
  gradeLevels: GradeLevel[];
}
