import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { Subject } from './subject.entity';
import type { AssessmentComponentJson } from '../types/assessment-component-json.type';

/**
 * Option A: weights and buckets for one subject (MVP: default profile only —
 * `grade_level_id` and `academic_year_id` null). Extend later for per-grade/year overrides.
 */
@Entity('subject_assessment_profiles')
@Index('UQ_subject_assessment_profiles_default', ['subjectId'], {
    unique: true,
    where:
        '"grade_level_id" IS NULL AND "academic_year_id" IS NULL AND "deleted_at" IS NULL',
})
export class SubjectAssessmentProfile extends BaseEntity {
    @Column({ name: 'subject_id', type: 'uuid' })
    subjectId: string;

    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subject_id' })
    subject: Subject;

    /** Null = school-wide default for this subject (MVP). */
    @Column({ name: 'grade_level_id', type: 'uuid', nullable: true })
    gradeLevelId: string | null;

    /** Null = not scoped to a single year (MVP). */
    @Column({ name: 'academic_year_id', type: 'uuid', nullable: true })
    academicYearId: string | null;

    @Column({ type: 'jsonb' })
    components: AssessmentComponentJson[];
}
