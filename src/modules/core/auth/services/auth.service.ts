import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
    BadRequestException,
    HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { SessionsService } from '../../sessions/sessions.service';
import { LoginDto } from '../dto/login.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { AppLoggerService } from '../../logger/logger.service';
import { AuthDalService } from './auth-dal.service';
import { AuthSecurityAuditService } from '../../audit/services/auth-security-audit.service';
import { AuthPasswordService } from './auth-password.service';
import { toAuthClientContext } from '../types';

@Injectable()
export class AuthService {
    constructor(
        private authDal: AuthDalService,
        private sessionsService: SessionsService,
        private logger: AppLoggerService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private securityAudit: AuthSecurityAuditService,
        private passwordService: AuthPasswordService,
    ) {}

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

        const client = toAuthClientContext(deviceInfo, ipAddress);

        let user: User | null = null;
        try {
            user = await this.resolveUserForLogin(loginDto);
        } catch (err) {
            await this.securityAudit.recordLoginFailure(
                err instanceof Error ? err.message : 'Login failed',
                { userId: null, schoolId: null },
                client,
                {
                    email: loginDto.email,
                    schoolCode: loginDto.schoolCode ?? null,
                },
            );
            throw err;
        }

        if (!user) {
            await this.securityAudit.recordLoginFailure(
                'User not found',
                { userId: null, schoolId: null },
                client,
                {
                    email: loginDto.email,
                    schoolCode: loginDto.schoolCode ?? null,
                },
            );
            throw new UnauthorizedException('Invalid email or password');
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await this.securityAudit.recordLoginFailure(
                'Account locked due to failed attempts',
                { userId: user.id, schoolId: user.schoolId ?? null },
                client,
            );
            throw new ForbiddenException(
                `Account locked until ${user.lockedUntil.toLocaleTimeString()}. Too many failed attempts.`,
            );
        }

        if (user.status !== AccountStatus.ACTIVE) {
            await this.securityAudit.recordLoginFailure(
                `Account is ${user.status}`,
                { userId: user.id, schoolId: user.schoolId ?? null },
                client,
            );
            throw new ForbiddenException(
                `Your account is ${user.status}. Contact your administrator.`,
            );
        }

        if (user.schoolId && user.school && !user.school.isActive) {
            await this.securityAudit.recordLoginFailure(
                'School is not active',
                { userId: user.id, schoolId: user.schoolId ?? null },
                client,
            );
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
            await this.securityAudit.recordLoginFailure(
                'Wrong password',
                { userId: user.id, schoolId: user.schoolId ?? null },
                client,
            );
            this.logger.warn('AuthService', 'Invalid login password', {
                loggerId: 'AUTH-LOGIN-002',
                userId: user.id,
                schoolId: user.schoolId,
                email: loginDto.email,
            });
            throw new UnauthorizedException('Invalid email or password');
        }

        await this.authDal.resetFailedLoginState(user.id);
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
        await this.securityAudit.recordLoginSuccess(
            user.id,
            user.schoolId ?? null,
            client,
        );

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
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
            const school = await this.authDal.findSchoolByCodeInsensitive(schoolCode.trim());
            if (!school) {
                throw new BadRequestException('Unknown school code');
            }
            if (!school.isActive) {
                throw new ForbiddenException(
                    'This school is not active. Please contact support.',
                );
            }
            return this.authDal.findUserByEmailAndSchoolId(email, school.id);
        }

        const superAdmin = await this.authDal.findSuperAdminByEmail(email);
        if (superAdmin) {
            return superAdmin;
        }
        throw new BadRequestException(
            'School code is required for this account. Use the code for your school (same as your portal subdomain).',
        );
    }

    async refresh(
        refreshToken: string,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        const client = toAuthClientContext(deviceInfo, ipAddress);
        let payload: any;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
        } catch {
            await this.securityAudit.recordRefreshFailure(
                'Refresh token verification failed',
                { actorUserId: null, schoolId: null },
                client,
            );
            this.logger.warn('AuthService', 'Refresh token verification failed', {
                loggerId: 'AUTH-REFRESH-001',
            });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const resolved = await this.sessionsService.resolveRefreshSessionForUser(
            payload.sub,
            refreshToken,
        );

        if (!resolved) {
            let schoolId: string | null = null;
            const u = await this.authDal.findUserById(payload.sub);
            schoolId = u?.schoolId ?? null;
            await this.securityAudit.recordRefreshFailure(
                'Refresh token not recognized for this user',
                {
                    actorUserId: payload.sub,
                    schoolId,
                },
                client,
            );
            this.logger.warn('AuthService', 'Refresh token not matched to any session', {
                loggerId: 'AUTH-REFRESH-002',
                userId: payload.sub,
            });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        if (resolved.kind === 'reuse') {
            await this.sessionsService.deleteAllForUser(payload.sub);
            const reuseUser = await this.authDal.findUserById(payload.sub);
            const reuseSchoolId = reuseUser?.schoolId ?? null;
            await this.securityAudit.recordRefreshTokenReuseDetected(
                payload.sub,
                reuseSchoolId,
                client,
                { sessionId: resolved.session.id },
            );
            this.logger.warn('AuthService', 'Refresh token reuse detected; all sessions revoked', {
                loggerId: 'AUTH-REFRESH-REUSE-001',
                userId: payload.sub,
                sessionId: resolved.session.id,
            });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        try {
            this.sessionsService.assertRefreshSessionValid(resolved.session);

            const user = await this.authDal.findUserWithSchoolById(payload.sub);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            this.assertUserEligibleForRefresh(user);

            const tokens = await this.generateTokens(user);
            await this.sessionsService.rotateRefreshToken(
                resolved.session.id,
                tokens.refreshToken,
            );

            await this.securityAudit.recordRefreshSuccess(
                user.id,
                user.schoolId ?? null,
                client,
            );

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            };
        } catch (err) {
            let schoolId: string | null = null;
            if (payload?.sub) {
                const u = await this.authDal.findUserById(payload.sub);
                schoolId = u?.schoolId ?? null;
            }
            await this.securityAudit.recordRefreshFailure(
                this.httpOrErrorMessage(err),
                {
                    actorUserId: payload?.sub ?? null,
                    schoolId,
                },
                client,
            );
            throw err;
        }
    }

    async logout(
        userId: string,
        refreshToken: string,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        await this.sessionsService.removeByRefreshToken(userId, refreshToken);
        this.logger.log('AuthService', 'Logout succeeded', {
            loggerId: 'AUTH-LOGOUT-001',
            userId,
        });
        await this.securityAudit.recordLogoutSuccess(
            userId,
            toAuthClientContext(deviceInfo, ipAddress),
        );
        return { message: 'Logout successful' };
    }

    changePassword(
        userId: string,
        dto: ChangePasswordDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        return this.passwordService.changePassword(userId, dto, deviceInfo, ipAddress);
    }

    forgotPassword(dto: ForgotPasswordDto, deviceInfo?: string, ipAddress?: string) {
        return this.passwordService.forgotPassword(dto, deviceInfo, ipAddress);
    }

    resetPassword(
        dto: ResetPasswordDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        return this.passwordService.resetPassword(dto, deviceInfo, ipAddress);
    }

    private assertUserEligibleForRefresh(user: User): void {
        if (user.status !== AccountStatus.ACTIVE) {
            throw new UnauthorizedException('Account is not active');
        }
        if (user.schoolId && user.school && !user.school.isActive) {
            throw new UnauthorizedException('School is not active');
        }
    }

    private httpOrErrorMessage(err: unknown): string {
        if (err instanceof HttpException) {
            const r = err.getResponse();
            if (typeof r === 'string') return r;
            if (typeof r === 'object' && r !== null && 'message' in r) {
                const m = (r as { message: unknown }).message;
                if (Array.isArray(m)) return m.map(String).join(', ');
                if (typeof m === 'string') return m;
            }
            return err.message;
        }
        if (err instanceof Error) return err.message;
        return 'Refresh failed';
    }

    private async generateTokens(user: User) {
        const payload = {
            sub: user.id,
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
        let lockedUntil: Date | null = null;
        if (attempts >= maxAttempts) {
            lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
        }
        await this.authDal.updateFailedLoginState(user.id, attempts, lockedUntil);
    }
}
