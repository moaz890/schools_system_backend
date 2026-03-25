import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { SessionsService } from '../sessions/sessions.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AccountStatus } from '../../../common/enums/account-status.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AppLoggerService } from '../logger/logger.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(School)
        private schoolsRepository: Repository<School>,
        private sessionsService: SessionsService,
        private logger: AppLoggerService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
    ) { }

    async login(
        loginDto: LoginDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        this.logger.log('AuthService', 'Login attempt started', {
            loggerId: 'AUTH-LOGIN-001',
            email: loginDto.email,
            schoolCode: loginDto.schoolCode ?? null,
            ipAddress: ipAddress ?? null,
        });
        const user = await this.resolveUserForLogin(loginDto);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new ForbiddenException(
                `Account locked until ${user.lockedUntil.toLocaleTimeString()}. Too many failed attempts.`,
            );
        }

        if (user.status !== AccountStatus.ACTIVE) {
            throw new ForbiddenException(
                `Your account is ${user.status}. Contact your administrator.`,
            );
        }

        if (user.schoolId && user.school && !user.school.isActive) {
            throw new ForbiddenException(
                'This school is not active. Please contact support.',
            );
        }

        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            (user as any).passwordHash,
        );
        if (!isPasswordValid) {
            await this.handleFailedLogin(user);
            this.logger.warn('AuthService', 'Invalid login password', {
                loggerId: 'AUTH-LOGIN-002',
                userId: user.id,
                schoolId: user.schoolId,
                email: loginDto.email,
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        await this.usersRepository.update({ id: (user as any).id } as any, {
            failedLoginAttempts: 0,
            lockedUntil: null,
        } as any);

        const tokens = await this.generateTokens(user);

        await this.sessionsService.enforceLimitAndCreateSession({
            user,
            plainRefreshToken: tokens.refreshToken,
            deviceInfo,
            ipAddress,
        });
        this.logger.log('AuthService', 'Login succeeded', {
            loggerId: 'AUTH-LOGIN-003',
            userId: user.id,
            schoolId: user.schoolId,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: (user as any).id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                schoolId: user.schoolId,
                schoolCode: user.school?.code ?? null,
            },
        };
    }

    private async resolveUserForLogin(loginDto: LoginDto): Promise<User | null> {
        const { email, schoolCode } = loginDto;

        if (schoolCode?.trim()) {
            const school = await this.schoolsRepository
                .createQueryBuilder('school')
                .where('LOWER(school.code) = LOWER(:code)', {
                    code: schoolCode.trim(),
                })
                .andWhere('school.deleted_at IS NULL')
                .getOne();

            if (!school) {
                throw new BadRequestException('Unknown school code');
            }

            if (!school.isActive) {
                throw new ForbiddenException(
                    'This school is not active. Please contact support.',
                );
            }

            return this.usersRepository.findOne({
                where: { email, schoolId: school.id } as any,
                relations: ['school'],
            });
        }

        const superAdmin = await this.usersRepository.findOne({
            where: {
                email,
                role: UserRole.SUPER_ADMIN,
                schoolId: IsNull(),
            } as any,
            relations: ['school'],
        });

        if (superAdmin) {
            return superAdmin;
        }

        throw new BadRequestException(
            'School code is required for this account. Use the code for your school (same as your portal subdomain).',
        );
    }

    async refresh(refreshToken: string) {
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
        } catch {
            this.logger.warn('AuthService', 'Refresh token verification failed', {
                loggerId: 'AUTH-REFRESH-001',
            });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const matchedSession = await this.sessionsService.findMatchingRefreshSession(
            payload.sub,
            refreshToken,
        );
        this.sessionsService.assertRefreshSessionValid(matchedSession);

        const user = await this.usersRepository.findOne({
            where: { id: payload.sub } as any,
            relations: ['school'],
        });
        if (!user) throw new UnauthorizedException('User not found');

        if (user.status !== AccountStatus.ACTIVE) {
            throw new UnauthorizedException('Account is not active');
        }

        if (user.schoolId && user.school && !user.school.isActive) {
            throw new UnauthorizedException('School is not active');
        }

        const tokens = await this.generateTokens(user);

        await this.sessionsService.rotateRefreshToken(
            (matchedSession as any).id,
            tokens.refreshToken,
        );

        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }

    async logout(userId: string, refreshToken: string) {
        await this.sessionsService.removeByRefreshToken(userId, refreshToken);
        this.logger.log('AuthService', 'Logout succeeded', {
            loggerId: 'AUTH-LOGOUT-001',
            userId,
        });
        return { message: 'Logout successful' };
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.usersRepository.findOne({
            where: { id: userId } as any,
        });
        if (!user) throw new NotFoundException('User not found');

        const isValid = await bcrypt.compare(
            dto.currentPassword,
            (user as any).passwordHash,
        );
        if (!isValid) {
            this.logger.warn('AuthService', 'Change password failed: wrong current password', {
                loggerId: 'AUTH-PASS-001',
                userId,
                schoolId: user.schoolId,
            });
            throw new BadRequestException('Current password is incorrect');
        }

        const newHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.update({ id: userId } as any, {
            passwordHash: newHash,
            credentialVersion: (user.credentialVersion ?? 1) + 1,
        } as any);

        
        await this.sessionsService.deleteAllForUser(userId);
        this.logger.log('AuthService', 'Password changed and sessions revoked', {
            loggerId: 'AUTH-PASS-002',
            userId,
            schoolId: user.schoolId,
            credentialVersion: (user.credentialVersion ?? 1) + 1,
        });

        return { message: 'Password changed successfully. Please log in again.' };
    }

    /**
     * Anti-enumeration: same response whether the user exists or not.
     * DB update + send mail run in one transaction so a failed send does not leave a stray token.
     */
    async forgotPassword(dto: ForgotPasswordDto) {
        const genericMessage =
            'If an account exists for this email, you will receive password reset instructions shortly.';

        const user = await this.resolveUserForPasswordReset(dto.email, dto.schoolCode);

        if (!user) {
            this.logger.log('AuthService', 'Forgot password: no matching user (generic response)', {
                loggerId: 'AUTH-FORGOT-001',
            });
            return { message: genericMessage };
        }

        if (user.status !== AccountStatus.ACTIVE) {
            this.logger.log('AuthService', 'Forgot password: user not active (generic response)', {
                loggerId: 'AUTH-FORGOT-002',
                userId: user.id,
                schoolId: user.schoolId,
            });
            return { message: genericMessage };
        }

        if (user.schoolId && user.school && !user.school.isActive) {
            this.logger.log('AuthService', 'Forgot password: school inactive (generic response)', {
                loggerId: 'AUTH-FORGOT-003',
                userId: user.id,
                schoolId: user.schoolId,
            });
            return { message: genericMessage };
        }

        if (!this.configService.get<boolean>('mail.enabled')) {
            this.logger.warn(
                'AuthService',
                'Forgot password: mail is not configured (set MAIL_FROM + BREVO_API_KEY)',
                {
                    loggerId: 'AUTH-FORGOT-006',
                    userId: user.id,
                    schoolId: user.schoolId,
                },
            );
            return { message: genericMessage };
        }

        const plainToken = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(plainToken).digest('hex');
        const passwordResetExpiresAt = new Date();
        passwordResetExpiresAt.setHours(passwordResetExpiresAt.getHours() + 1);

        const baseUrl =
            this.configService.get<string>('mail.frontendPasswordResetBaseUrl') ??
            'http://localhost:3001';
        const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(plainToken)}`;

        try {
            await this.usersRepository.manager.transaction(async (manager) => {
                await manager.update(
                    User,
                    { id: user.id },
                    {
                        passwordResetTokenHash: tokenHash,
                        passwordResetExpiresAt,
                    },
                );
                await this.emailService.sendPasswordReset({
                    to: user.email,
                    resetUrl,
                    firstName: user.firstName,
                    userId: user.id,
                    schoolId: user.schoolId,
                });
            });
        } catch (err: unknown) {
            this.logger.error('AuthService', 'Forgot password: transaction or email failed', {
                loggerId: 'AUTH-FORGOT-004',
                userId: user.id,
                schoolId: user.schoolId,
                errorMessage: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }

        this.logger.log('AuthService', 'Forgot password: reset email flow completed', {
            loggerId: 'AUTH-FORGOT-005',
            userId: user.id,
            schoolId: user.schoolId,
        });

        return { message: genericMessage };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.usersRepository.findOne({
            where: { id: dto.userId },
        });
        if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt) {
            throw new BadRequestException('Invalid or expired reset link');
        }
        if (user.passwordResetExpiresAt < new Date()) {
            throw new BadRequestException('Invalid or expired reset link');
        }
        const hash = createHash('sha256').update(dto.token).digest('hex');
        if (hash !== user.passwordResetTokenHash) {
            throw new BadRequestException('Invalid or expired reset link');
        }

        const newHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.update(
            { id: dto.userId },
            {
                passwordHash: newHash,
                credentialVersion: (user.credentialVersion ?? 1) + 1,
                passwordResetTokenHash: null,
                passwordResetExpiresAt: null,
            },
        );
        await this.sessionsService.deleteAllForUser(dto.userId);
        this.logger.log('AuthService', 'Password reset completed', {
            loggerId: 'AUTH-RESET-001',
            userId: dto.userId,
            schoolId: user.schoolId,
        });
        return { message: 'Password reset successful. You can log in with your new password.' };
    }

    /**
     * Same tenant rules as login, but never throws — returns null so callers can respond generically.
     */
    private async resolveUserForPasswordReset(
        email: string,
        schoolCode?: string,
    ): Promise<User | null> {
        const code = schoolCode?.trim();
        if (code) {
            const school = await this.schoolsRepository
                .createQueryBuilder('school')
                .where('LOWER(school.code) = LOWER(:code)', { code })
                .andWhere('school.deleted_at IS NULL')
                .getOne();
            if (!school) {
                return null;
            }
            return this.usersRepository.findOne({
                where: { email, schoolId: school.id },
                relations: ['school'],
            });
        }

        return this.usersRepository.findOne({
            where: {
                email,
                role: UserRole.SUPER_ADMIN,
                schoolId: IsNull(),
            },
            relations: ['school'],
        });
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: (user as any).id,
            schoolId: user.schoolId,
            schoolCode: user.school?.code ?? null,
            role: user.role,
            cv: user.credentialVersion ?? 1,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.accessSecret'),
                expiresIn: this.configService.get('jwt.accessExpiresIn'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('jwt.refreshSecret'),
                expiresIn: this.configService.get('jwt.refreshExpiresIn'),
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async handleFailedLogin(user: User) {
        const attempts = user.failedLoginAttempts + 1;
        const maxAttempts = 5;

        const updateData: any = { failedLoginAttempts: attempts };

        if (attempts >= maxAttempts) {
            const lockDuration = 30;
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
            updateData.lockedUntil = lockedUntil;
        }

        await this.usersRepository.update({ id: (user as any).id } as any, updateData);
    }
}
