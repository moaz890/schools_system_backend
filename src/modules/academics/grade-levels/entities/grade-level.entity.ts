import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../../core/schools/entities/school.entity';
import { Stage } from '../../stages/entities/stage.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';

@Entity('grade_levels')
@Index('UQ_grade_levels_stage_order', ['stageId', 'order'], { unique: true, where: '"deleted_at" IS NULL' })
export class GradeLevel extends BaseEntity {
    @Column({ name: 'school_id', type: 'uuid' })
    schoolId: string;

    @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'school_id' })
    school: School;

    @Column({ name: 'stage_id', type: 'uuid' })
    stageId: string;

    @ManyToOne(() => Stage, (stage) => stage.gradeLevels, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'stage_id' })
    stage: Stage;

    /**
     * Auto-generated for non-KG stages, manually set for KG stages.
     * Example: { en: "Grade 7", ar: "الصف 7" }
     */
    @Column({ name: 'name', type: 'jsonb' })
    name: LocalizedString;

    @Column({ name: 'order', type: 'int' })
    order: number;
}
