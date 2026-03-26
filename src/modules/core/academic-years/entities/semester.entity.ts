import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { AcademicYear } from './academic-year.entity';

@Entity('semesters')
@Index('IDX_semesters_academic_year_id', ['academicYearId'])
export class Semester extends BaseEntity {
    @Column({ name: 'academic_year_id', type: 'uuid' })
    academicYearId: string;

    @ManyToOne(() => AcademicYear, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'academic_year_id' })
    academicYear: AcademicYear;

    @Column({ name: 'name', type: 'jsonb' })
    name: { en: string; ar: string };

    @Column({ name: 'start_date', type: 'timestamptz' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamptz' })
    endDate: Date;

    @Column({ name: 'is_current', type: 'boolean', default: false })
    isCurrent: boolean;
}

