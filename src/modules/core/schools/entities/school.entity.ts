import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';

export interface SchoolSettings {
    gradingScale: 'letter' | 'percentage' | 'gpa';
    allowLateSubmissions: boolean;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    academicYearStartMonth: number; // 1-12
}

const defaultSettings: SchoolSettings = {
    gradingScale: 'letter',
    allowLateSubmissions: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    academicYearStartMonth: 9,
};

@Entity('schools')
export class School extends BaseEntity {
    @Column({ type: 'varchar', length: 100 })
    name: string;

    /** Explicit varchar so TypeORM does not infer `Object` from `string | null` union (reflect-metadata). */
    @Column({ type: 'varchar', length: 20, unique: true })
    code: string;

    /** Unique among non-deleted rows — enforced by partial index in migrations. */
    @Column({ type: 'varchar', length: 100 })
    email: string;

    @Column({ type: 'varchar', length: 20})
    phone: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ name: 'logo_url', type: 'varchar', nullable: true })
    logoUrl: string;

    @Column({
        name: 'primary_color',
        type: 'varchar',
        length: 7,
        nullable: true,
        default: '#1a56db',
    })
    primaryColor: string | null;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({
        type: 'jsonb',
        default: defaultSettings,
    })
    settings: SchoolSettings;
}
