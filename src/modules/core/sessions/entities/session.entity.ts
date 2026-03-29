import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  token: string; // hashed refresh token (current)

  /** Bcrypt hash of the refresh token before last rotation; used for reuse detection. */
  @Column({ name: 'previous_token_hash', type: 'text', nullable: true })
  previousTokenHash: string | null;

  @Column({ name: 'device_info', type: 'varchar', length: 200, nullable: true })
  deviceInfo: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'last_active', type: 'timestamptz', nullable: true })
  lastActive: Date | null;
}
