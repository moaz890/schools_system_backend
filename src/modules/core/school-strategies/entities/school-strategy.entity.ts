import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../schools/entities/school.entity';

export enum CalculationMethod {
  CREDIT_HOURS = 'CREDIT_HOURS',
  TOTAL_POINTS = 'TOTAL_POINTS',
}

export enum PromotionPolicy {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
  CONDITIONAL = 'CONDITIONAL',
}

export interface GradeDescriptor {
  min: number;
  max: number;
  label: { en: string; ar: string };
}

export const EGYPTIAN_GRADE_DESCRIPTORS: GradeDescriptor[] = [
  { min: 85, max: 100, label: { en: 'Excellent', ar: 'ممتاز' } },
  { min: 75, max: 84, label: { en: 'Very Good', ar: 'جيد جداً' } },
  { min: 65, max: 74, label: { en: 'Good', ar: 'جيد' } },
  { min: 50, max: 64, label: { en: 'Pass', ar: 'مقبول' } },
  { min: 0, max: 49, label: { en: 'Fail', ar: 'ضعيف' } },
];

@Entity('school_strategies')
@Unique('UQ_school_strategies_school_id', ['schoolId'])
export class SchoolStrategy extends BaseEntity {
  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @OneToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school?: School;

  // ─── Grading & Calculation ────────────────────────────────────────────────

  /**
   * How grades are calculated school-wide.
   * CREDIT_HOURS: weighted by credit hours per subject.
   * TOTAL_POINTS: raw points out of a total maximum per subject.
   * (Simple cumulative average may be added later — not available in the API yet.)
   */
  @Column({
    name: 'calculation_method',
    type: 'enum',
    enum: CalculationMethod,
    default: CalculationMethod.CREDIT_HOURS,
  })
  calculationMethod: CalculationMethod;

  /**
   * Minimum percentage to pass a subject. Egypt = 50, KSA = 60.
   */
  @Column({ name: 'passing_threshold', type: 'int', default: 50 })
  passingThreshold: number;

  /**
   * Whether to round final grade totals (e.g. 49.6 → 50).
   */
  @Column({ name: 'enable_rounding', type: 'boolean', default: false })
  enableRounding: boolean;

  /**
   * Number of decimal places to show in grades (0, 1, or 2).
   */
  @Column({ name: 'decimal_places', type: 'int', default: 0 })
  decimalPlaces: number;

  // ─── Exam & Resit Policy ─────────────────────────────────────────────────

  /**
   * Student must pass the final exam to pass the subject, regardless of
   * cumulative score. Core to "Dour Thani" (الدور الثاني) logic.
   */
  @Column({
    name: 'must_pass_final_to_pass_subject',
    type: 'boolean',
    default: true,
  })
  mustPassFinalToPassSubject: boolean;

  /**
   * Whether this school allows resit/makeup exams (Dour Thani).
   */
  @Column({ name: 'allow_resit', type: 'boolean', default: true })
  allowResit: boolean;

  /**
   * Number of failed subjects that qualifies a student for resit.
   * If a student fails MORE than this number, they repeat the whole year.
   * e.g. maxFailedSubjectsForResit = 2: fail 1-2 → resit; fail 3+ → repeat year.
   */
  @Column({ name: 'max_failed_subjects_for_resit', type: 'int', default: 2 })
  maxFailedSubjectsForResit: number;

  // ─── Promotion Policy ────────────────────────────────────────────────────

  /**
   * How students are promoted at year-end.
   * AUTO: automatically promoted if passing threshold is met.
   * MANUAL: school admin must manually promote each student.
   * CONDITIONAL: auto-promote if passing, hold if failing (default).
   */
  @Column({
    name: 'promotion_policy',
    type: 'enum',
    enum: PromotionPolicy,
    default: PromotionPolicy.CONDITIONAL,
  })
  promotionPolicy: PromotionPolicy;

  // ─── Grade Descriptors ───────────────────────────────────────────────────

  /**
   * Ordered list of grade bands with localized labels.
   * Defaults to the Egyptian MOE scale.
   * KSA schools override with min: 60 for pass, 90 for excellent, etc.
   */
  @Column({
    name: 'grade_descriptors',
    type: 'jsonb',
    default: () => `'${JSON.stringify(EGYPTIAN_GRADE_DESCRIPTORS)}'`,
  })
  gradeDescriptors: GradeDescriptor[];
}
