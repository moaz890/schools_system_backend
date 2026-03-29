import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../../common/entities/base.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { School } from '../../schools/entities/school.entity';
import { Session } from '../../sessions/entities/session.entity';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';

export enum NationalIdType {
  NATIONAL_ID = 'national_id', // Saudi national ID
  PASSPORT = 'passport',
  IQAMA = 'iqama', // Residency permit
}

@Entity('users')
@Index('UQ_users_school_email_active', ['schoolId', 'email'], {
  unique: true,
  where: '"school_id" IS NOT NULL AND "deleted_at" IS NULL',
})
@Index('UQ_users_superadmin_email_active', ['email'], {
  unique: true,
  where: '"school_id" IS NULL AND "deleted_at" IS NULL',
})
export class User extends BaseEntity {
  /** Null for super-admin. Same column as `school` relation (see migration for email uniqueness). */
  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  /** Hard-deleting a school removes its users (sessions cascade). Prefer soft-delete via API. */
  @ManyToOne(() => School, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school?: School | null;

  /** Unique per school (see migration UQ_users_school_email_active). */
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  /** Full name in Arabic and English. Example: { en: "Ahmed Rashid", ar: "أحمد راشد" } */
  @Column({ name: 'name', type: 'jsonb' })
  name: LocalizedString;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  status: AccountStatus;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  // national_id — required for all, unique globally
  @Column({ name: 'national_id', type: 'varchar', length: 50, unique: true })
  nationalId: string;

  @Column({
    name: 'national_id_type',
    type: 'enum',
    enum: NationalIdType,
    default: NationalIdType.NATIONAL_ID,
  })
  nationalIdType: NationalIdType;

  // Account lockout fields
  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', nullable: true, type: 'timestamptz' })
  lockedUntil: Date | null;

  /** Bumped when credentials change; JWT must carry matching version. */
  @Column({ name: 'credential_version', type: 'int', default: 1 })
  credentialVersion: number;

  /** SHA-256 hex of the raw reset token; cleared after successful reset. */
  @Column({
    name: 'password_reset_token_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
  })
  passwordResetTokenHash: string | null;

  @Column({
    name: 'password_reset_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  passwordResetExpiresAt: Date | null;

  // Relations
  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions: Session[];
}
