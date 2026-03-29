import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AccountStatus } from '../../../../common/enums/account-status.enum';

export interface JwtPayload {
  sub: string;
  schoolId: string | null;
  schoolCode?: string | null;
  role: string;
  cv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret') ?? '',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub } as any,
      relations: ['school'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Your account is ${user.status}. Please contact your administrator.`,
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Your account is temporarily locked. Try again after ${user.lockedUntil.toISOString()}.`,
      );
    }

    if (user.schoolId && user.school && !user.school.isActive) {
      throw new UnauthorizedException(
        'This school is not active. Please contact support.',
      );
    }

    if (payload.schoolId !== undefined && payload.schoolId !== user.schoolId) {
      throw new UnauthorizedException(
        'Session expired or invalid. Please sign in again.',
      );
    }

    const tokenCredentialVersion = payload.cv ?? 1;
    const currentCredentialVersion = user.credentialVersion ?? 1;

    if (tokenCredentialVersion !== currentCredentialVersion) {
      throw new UnauthorizedException(
        'Credentials changed. Please sign in again.',
      );
    }

    return {
      id: user.id,
      schoolId: user.schoolId,
      schoolCode: user.school?.code ?? null,
      role: user.role,
    };
  }
}
