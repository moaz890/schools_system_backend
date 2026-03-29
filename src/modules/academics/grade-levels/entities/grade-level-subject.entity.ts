import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { GradeLevel } from './grade-level.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('grade_level_subjects')
@Index('UQ_grade_level_subjects_pair', ['gradeLevelId', 'subjectId'], {
    unique: true,
    where: '"deleted_at" IS NULL',
})
export class GradeLevelSubject extends BaseEntity {
    @Column({ name: 'grade_level_id', type: 'uuid' })
    gradeLevelId: string;

    @ManyToOne(() => GradeLevel, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grade_level_id' })
    gradeLevel: GradeLevel;

    @Column({ name: 'subject_id', type: 'uuid' })
    subjectId: string;

    @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'subject_id' })
    subject: Subject;
}
