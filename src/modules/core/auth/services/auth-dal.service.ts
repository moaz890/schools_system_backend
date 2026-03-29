import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { School } from '../../schools/entities/school.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';

@Injectable()
export class AuthDalService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
  ) {}

  findSchoolByCodeInsensitive(code: string): Promise<School | null> {
    return this.schoolsRepository
      .createQueryBuilder('school')
      .where('LOWER(school.code) = LOWER(:code)', { code })
      .andWhere('school.deleted_at IS NULL')
      .getOne();
  }

  findUserByEmailAndSchoolId(
    email: string,
    schoolId: string,
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email, schoolId },
      relations: ['school'],
    });
  }

  findSuperAdminByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        email,
        role: UserRole.SUPER_ADMIN,
        schoolId: IsNull(),
      },
      relations: ['school'],
    });
  }

  findUserById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findUserWithSchoolById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['school'],
    });
  }

  async resetFailedLoginState(userId: string): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    );
  }

  async updateFailedLoginState(
    userId: string,
    failedLoginAttempts: number,
    lockedUntil: Date | null,
  ): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      {
        failedLoginAttempts,
        lockedUntil,
      },
    );
  }

  async updatePasswordAndCredentialVersion(
    userId: string,
    passwordHash: string,
    credentialVersion: number,
  ): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      {
        passwordHash,
        credentialVersion,
      },
    );
  }

  async completePasswordReset(
    userId: string,
    passwordHash: string,
    credentialVersion: number,
  ): Promise<void> {
    await this.usersRepository.update(
      { id: userId },
      {
        passwordHash,
        credentialVersion,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    );
  }

  runInTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.usersRepository.manager.transaction(work);
  }

  async setPasswordResetToken(
    manager: EntityManager,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await manager.update(
      User,
      { id: userId },
      {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    );
  }
}
