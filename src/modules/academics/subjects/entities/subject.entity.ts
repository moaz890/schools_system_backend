import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { SubjectCategory } from '../enums/subject-category.enum';

@Entity('subjects')
@Index('UQ_subjects_school_code', ['schoolId', 'code'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class Subject extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  /** Display name, e.g. { en: "Mathematics", ar: "الرياضيات" } */
  @Column({ name: 'name', type: 'jsonb' })
  name: LocalizedString;

  /** Short code unique within the school, e.g. MATH */
  @Column({ type: 'varchar', length: 32 })
  code: string;

  @Column({ type: 'varchar', length: 32 })
  category: SubjectCategory;

  @Column({ name: 'description', type: 'jsonb', nullable: true })
  description: LocalizedString | null;

  /**
   * Weight when SchoolStrategy.calculation_method is CREDIT_HOURS.
   */
  @Column({ name: 'credit_hours', type: 'double precision', nullable: true })
  creditHours: number | null;

  /**
   * Cap / budget when calculation_method is TOTAL_POINTS (e.g. 100 per subject).
   */
  @Column({ name: 'max_points', type: 'int', nullable: true })
  maxPoints: number | null;

  @Column({ name: 'counts_toward_gpa', type: 'boolean', default: true })
  countsTowardGpa: boolean;

  /** Sort order in admin lists (lower first). */
  @Column({ name: 'order', type: 'int', default: 0 })
  order: number;
}
