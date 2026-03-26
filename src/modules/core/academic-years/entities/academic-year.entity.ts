import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { School } from '../../schools/entities/school.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { Semester } from './semester.entity';

@Entity('academic_years')
export class AcademicYear extends BaseEntity {
    @Column({ name: 'school_id', type: 'uuid' })
    schoolId: string;

    @ManyToOne(() => School, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'school_id' })
    school: School;

    @Column({ name: 'name', type: 'jsonb' })
    name: LocalizedString;

    @Column({ name: 'start_date', type: 'timestamptz' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamptz' })
    endDate: Date;

    @Column({ name: 'is_current', type: 'boolean', default: false })
    isCurrent: boolean;

    @OneToMany(() => Semester, (s) => s.academicYear)
    semesters: Semester[];
}

