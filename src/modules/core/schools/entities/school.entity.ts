import { Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { SchoolStrategy } from '../../school-strategies/entities/school-strategy.entity';

@Entity('schools')
export class School extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Unique non-deleted school code (see migration for partial index). */
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 20 })
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

  /** Loaded on demand via JOIN — use SchoolStrategiesService to read/write. */
  @OneToOne(() => SchoolStrategy, (s) => s.school)
  strategy?: SchoolStrategy;
}
