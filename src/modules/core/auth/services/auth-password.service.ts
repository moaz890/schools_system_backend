import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { SessionsService } from '../../sessions/sessions.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { AppLoggerService } from '../../logger/logger.service';
import { EmailService } from '../../email/email.service';
import { AuthDalService } from './auth-dal.service';
import { AuthSecurityAuditService } from '../../audit/services/auth-security-audit.service';
import { toAuthClientContext } from '../types';

@Injectable()
export class AuthPasswordService {
    private static readonly GENERIC_FORGOT_RESPONSE =
        'If an account exists for this email, you will receive password reset instructions shortly.';

    constructor(
        private readonly authDal: AuthDalService,
        private readonly sessionsService: SessionsService,
        private readonly logger: AppLoggerService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
        private readonly securityAudit: AuthSecurityAuditService,
    ) { }

    async changePassword(
        userId: string,
        dto: ChangePasswordDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        const user = await this.authDal.findUserById(userId);
        if (!user) throw new NotFoundException('User not found');

        const passwordOk = await this.verifyPassword(dto.currentPassword, user);
        if (!passwordOk) {
            this.logger.warn('AuthPasswordService', 'Change password failed: wrong current password', {
                loggerId: 'AUTH-PASS-001',
                userId,
                schoolId: user.schoolId,
            });
            throw new BadRequestException('Current password is incorrect');
        }

        const newHash = await this.hashPassword(dto.newPassword);
        const nextCv = (user.credentialVersion ?? 1) + 1;
        await this.authDal.updatePasswordAndCredentialVersion(userId, newHash, nextCv);
        await this.sessionsService.deleteAllForUser(userId);

        this.logger.log('AuthPasswordService', 'Password changed and sessions revoked', {
            loggerId: 'AUTH-PASS-002',
            userId,
            schoolId: user.schoolId,
            credentialVersion: nextCv,
        });

        await this.securityAudit.recordPasswordChangeSuccess(
            userId,
            user.schoolId ?? null,
            nextCv,
            toAuthClientContext(deviceInfo, ipAddress),
        );
        return { message: 'Password changed successfully. Please log in again.' };
    }

    async forgotPassword(
        dto: ForgotPasswordDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        const user = await this.resolveUserForPasswordReset(dto.email, dto.schoolCode);

        if (!user) {
            this.logger.log('AuthPasswordService', 'Forgot password: no matching user (generic response)', {
                loggerId: 'AUTH-FORGOT-001',
            });
            return { message: AuthPasswordService.GENERIC_FORGOT_RESPONSE };
        }

        if (user.status !== AccountStatus.ACTIVE) {
            this.logger.log('AuthPasswordService', 'Forgot password: user not active (generic response)', {
                loggerId: 'AUTH-FORGOT-002',
                userId: user.id,
                schoolId: user.schoolId,
            });
            return { message: AuthPasswordService.GENERIC_FORGOT_RESPONSE };
        }

        if (user.schoolId && user.school && !user.school.isActive) {
            this.logger.log('AuthPasswordService', 'Forgot password: school inactive (generic response)', {
                loggerId: 'AUTH-FORGOT-003',
                userId: user.id,
                schoolId: user.schoolId,
            });
            return { message: AuthPasswordService.GENERIC_FORGOT_RESPONSE };
        }

        if (!this.configService.get<boolean>('mail.enabled')) {
            this.logger.warn(
                'AuthPasswordService',
                'Forgot password: mail is not configured (set MAIL_FROM + BREVO_API_KEY)',
                {
                    loggerId: 'AUTH-FORGOT-006',
                    userId: user.id,
                    schoolId: user.schoolId,
                },
            );
            return { message: AuthPasswordService.GENERIC_FORGOT_RESPONSE };
        }

        const { plainToken, tokenHash, expiresAt } = this.createPasswordResetTokenMaterial();
        const resetUrl = this.buildPasswordResetUrl(user.id, plainToken);

        try {
            await this.authDal.runInTransaction(async (manager) => {
                await this.authDal.setPasswordResetToken(manager, user.id, tokenHash, expiresAt);
                await this.emailService.sendPasswordReset({
                    to: user.email,
                    resetUrl,
                    name: user.name?.en ?? user.email,
                    userId: user.id,
                    schoolId: user.schoolId,
                });
            });
        } catch (err: unknown) {
            this.logger.error('AuthPasswordService', 'Forgot password: transaction or email failed', {
                loggerId: 'AUTH-FORGOT-004',
                userId: user.id,
                schoolId: user.schoolId,
                errorMessage: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }

        this.logger.log('AuthPasswordService', 'Forgot password: reset email flow completed', {
            loggerId: 'AUTH-FORGOT-005',
            userId: user.id,
            schoolId: user.schoolId,
        });

        return { message: AuthPasswordService.GENERIC_FORGOT_RESPONSE };
    }

    async resetPassword(
        dto: ResetPasswordDto,
        deviceInfo?: string,
        ipAddress?: string,
    ) {
        const client = toAuthClientContext(deviceInfo, ipAddress);
        const user = await this.authDal.findUserById(dto.userId);
        if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt) {
            await this.securityAudit.recordResetPasswordFailure({
                userId: dto.userId,
                schoolId: user?.schoolId ?? null,
                message: 'Invalid or expired reset link',
                client,
            });
            throw new BadRequestException('Invalid or expired reset link');
        }
        if (user.passwordResetExpiresAt < new Date()) {
            await this.securityAudit.recordResetPasswordFailure({
                userId: dto.userId,
                schoolId: user.schoolId ?? null,
                message: 'Expired reset token',
                client,
            });
            throw new BadRequestException('Invalid or expired reset link');
        }
        const hash = createHash('sha256').update(dto.token).digest('hex');
        if (hash !== user.passwordResetTokenHash) {
            await this.securityAudit.recordResetPasswordFailure({
                userId: dto.userId,
                schoolId: user.schoolId ?? null,
                message: 'Reset token hash mismatch',
                client,
            });
            throw new BadRequestException('Invalid or expired reset link');
        }

        const newHash = await this.hashPassword(dto.newPassword);
        await this.authDal.completePasswordReset(
            dto.userId,
            newHash,
            (user.credentialVersion ?? 1) + 1,
        );
        await this.sessionsService.deleteAllForUser(dto.userId);

        this.logger.log('AuthPasswordService', 'Password reset completed', {
            loggerId: 'AUTH-RESET-001',
            userId: dto.userId,
            schoolId: user.schoolId,
        });

        await this.securityAudit.recordResetPasswordSuccess(
            dto.userId,
            user.schoolId ?? null,
            client,
        );
        return { message: 'Password reset successful. You can log in with your new password.' };
    }

    private async resolveUserForPasswordReset(
        email: string,
        schoolCode?: string,
    ): Promise<User | null> {
        const code = schoolCode?.trim();
        if (code) {
            const school = await this.authDal.findSchoolByCodeInsensitive(code);
            if (!school) {
                return null;
            }
            return this.authDal.findUserByEmailAndSchoolId(email, school.id);
        }
        return this.authDal.findSuperAdminByEmail(email);
    }

    private async verifyPassword(plain: string, user: User): Promise<boolean> {
        return bcrypt.compare(plain, (user as any).passwordHash);
    }

    private async hashPassword(plain: string): Promise<string> {
        return bcrypt.hash(plain, 10);
    }

    private createPasswordResetTokenMaterial(): {
        plainToken: string;
        tokenHash: string;
        expiresAt: Date;
    } {
        const plainToken = randomBytes(32).toString('hex');
        const tokenHash = createHash('sha256').update(plainToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        return { plainToken, tokenHash, expiresAt };
    }

    private buildPasswordResetUrl(userId: string, plainToken: string): string {
        const baseUrl =
            this.configService.get<string>('mail.frontendPasswordResetBaseUrl') ??
            'http://localhost:3001';
        const base = baseUrl.replace(/\/$/, '');
        return `${base}/reset-password?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(plainToken)}`;
    }

}
