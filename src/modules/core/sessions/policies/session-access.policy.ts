import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { Session } from '../entities/session.entity';
import { AppLoggerService } from '../../logger/logger.service';

/**
 * Authorization rules for listing and revoking refresh-token sessions.
 * Keeps access checks out of persistence logic (SRP).
 */
@Injectable()
export class SessionAccessPolicy {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: AppLoggerService,
  ) {}

  async assertCanListSessions(
    caller: AuthCaller,
    targetUserId: string,
  ): Promise<void> {
    if (caller.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (caller.role === UserRole.SCHOOL_ADMIN) {
      const target = await this.usersRepository.findOne({
        where: { id: targetUserId } as any,
      });
      if (!target || target.schoolId !== caller.schoolId) {
        this.logger.warn(
          'SessionAccessPolicy',
          'School admin tried cross-school session listing',
          {
            loggerId: 'SESSION-POLICY-001',
            userId: caller.id,
            schoolId: caller.schoolId,
            targetUserId,
          },
        );
        throw new NotFoundException('User not found');
      }
      return;
    }

    if (caller.id === targetUserId) {
      return;
    }

    throw new ForbiddenException("Cannot access another user's sessions");
  }

  async assertCanRevokeSession(
    caller: AuthCaller,
    session: Session,
  ): Promise<void> {
    if (caller.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (session.userId === caller.id) {
      return;
    }

    if (caller.role === UserRole.SCHOOL_ADMIN) {
      const sessionOwner = await this.usersRepository.findOne({
        where: { id: session.userId } as any,
      });
      if (sessionOwner && sessionOwner.schoolId === caller.schoolId) {
        return;
      }
    }

    this.logger.warn(
      'SessionAccessPolicy',
      'Unauthorized session revoke attempt',
      {
        loggerId: 'SESSION-POLICY-002',
        userId: caller.id,
        schoolId: caller.schoolId,
        targetUserId: session.userId,
        targetSessionId: session.id,
      },
    );
    throw new ForbiddenException("Cannot revoke another user's session");
  }
}
