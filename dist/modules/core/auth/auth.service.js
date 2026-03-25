"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../users/entities/user.entity");
const school_entity_1 = require("../schools/entities/school.entity");
const sessions_service_1 = require("../sessions/sessions.service");
const account_status_enum_1 = require("../../../common/enums/account-status.enum");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const logger_service_1 = require("../logger/logger.service");
const email_service_1 = require("../email/email.service");
let AuthService = class AuthService {
    usersRepository;
    schoolsRepository;
    sessionsService;
    logger;
    jwtService;
    configService;
    emailService;
    constructor(usersRepository, schoolsRepository, sessionsService, logger, jwtService, configService, emailService) {
        this.usersRepository = usersRepository;
        this.schoolsRepository = schoolsRepository;
        this.sessionsService = sessionsService;
        this.logger = logger;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async login(loginDto, deviceInfo, ipAddress) {
        this.logger.log('AuthService', 'Login attempt started', {
            loggerId: 'AUTH-LOGIN-001',
            email: loginDto.email,
            schoolCode: loginDto.schoolCode ?? null,
            ipAddress: ipAddress ?? null,
        });
        const user = await this.resolveUserForLogin(loginDto);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.ForbiddenException(`Account locked until ${user.lockedUntil.toLocaleTimeString()}. Too many failed attempts.`);
        }
        if (user.status !== account_status_enum_1.AccountStatus.ACTIVE) {
            throw new common_1.ForbiddenException(`Your account is ${user.status}. Contact your administrator.`);
        }
        if (user.schoolId && user.school && !user.school.isActive) {
            throw new common_1.ForbiddenException('This school is not active. Please contact support.');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
        if (!isPasswordValid) {
            await this.handleFailedLogin(user);
            this.logger.warn('AuthService', 'Invalid login password', {
                loggerId: 'AUTH-LOGIN-002',
                userId: user.id,
                schoolId: user.schoolId,
                email: loginDto.email,
            });
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        await this.usersRepository.update({ id: user.id }, {
            failedLoginAttempts: 0,
            lockedUntil: null,
        });
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
    async resolveUserForLogin(loginDto) {
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
                throw new common_1.BadRequestException('Unknown school code');
            }
            if (!school.isActive) {
                throw new common_1.ForbiddenException('This school is not active. Please contact support.');
            }
            return this.usersRepository.findOne({
                where: { email, schoolId: school.id },
                relations: ['school'],
            });
        }
        const superAdmin = await this.usersRepository.findOne({
            where: {
                email,
                role: user_role_enum_1.UserRole.SUPER_ADMIN,
                schoolId: (0, typeorm_2.IsNull)(),
            },
            relations: ['school'],
        });
        if (superAdmin) {
            return superAdmin;
        }
        throw new common_1.BadRequestException('School code is required for this account. Use the code for your school (same as your portal subdomain).');
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('jwt.refreshSecret'),
            });
        }
        catch {
            this.logger.warn('AuthService', 'Refresh token verification failed', {
                loggerId: 'AUTH-REFRESH-001',
            });
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const matchedSession = await this.sessionsService.findMatchingRefreshSession(payload.sub, refreshToken);
        this.sessionsService.assertRefreshSessionValid(matchedSession);
        const user = await this.usersRepository.findOne({
            where: { id: payload.sub },
            relations: ['school'],
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        if (user.status !== account_status_enum_1.AccountStatus.ACTIVE) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        if (user.schoolId && user.school && !user.school.isActive) {
            throw new common_1.UnauthorizedException('School is not active');
        }
        const tokens = await this.generateTokens(user);
        await this.sessionsService.rotateRefreshToken(matchedSession.id, tokens.refreshToken);
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
    }
    async logout(userId, refreshToken) {
        await this.sessionsService.removeByRefreshToken(userId, refreshToken);
        this.logger.log('AuthService', 'Logout succeeded', {
            loggerId: 'AUTH-LOGOUT-001',
            userId,
        });
        return { message: 'Logout successful' };
    }
    async changePassword(userId, dto) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isValid) {
            this.logger.warn('AuthService', 'Change password failed: wrong current password', {
                loggerId: 'AUTH-PASS-001',
                userId,
                schoolId: user.schoolId,
            });
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const newHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.update({ id: userId }, {
            passwordHash: newHash,
            credentialVersion: (user.credentialVersion ?? 1) + 1,
        });
        await this.sessionsService.deleteAllForUser(userId);
        this.logger.log('AuthService', 'Password changed and sessions revoked', {
            loggerId: 'AUTH-PASS-002',
            userId,
            schoolId: user.schoolId,
            credentialVersion: (user.credentialVersion ?? 1) + 1,
        });
        return { message: 'Password changed successfully. Please log in again.' };
    }
    async forgotPassword(dto) {
        const genericMessage = 'If an account exists for this email, you will receive password reset instructions shortly.';
        const user = await this.resolveUserForPasswordReset(dto.email, dto.schoolCode);
        if (!user) {
            this.logger.log('AuthService', 'Forgot password: no matching user (generic response)', {
                loggerId: 'AUTH-FORGOT-001',
            });
            return { message: genericMessage };
        }
        if (user.status !== account_status_enum_1.AccountStatus.ACTIVE) {
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
        if (!this.configService.get('mail.enabled')) {
            this.logger.warn('AuthService', 'Forgot password: mail is not configured (set MAIL_FROM + BREVO_API_KEY)', {
                loggerId: 'AUTH-FORGOT-006',
                userId: user.id,
                schoolId: user.schoolId,
            });
            return { message: genericMessage };
        }
        const plainToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, crypto_1.createHash)('sha256').update(plainToken).digest('hex');
        const passwordResetExpiresAt = new Date();
        passwordResetExpiresAt.setHours(passwordResetExpiresAt.getHours() + 1);
        const baseUrl = this.configService.get('mail.frontendPasswordResetBaseUrl') ??
            'http://localhost:3001';
        const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(plainToken)}`;
        try {
            await this.usersRepository.manager.transaction(async (manager) => {
                await manager.update(user_entity_1.User, { id: user.id }, {
                    passwordResetTokenHash: tokenHash,
                    passwordResetExpiresAt,
                });
                await this.emailService.sendPasswordReset({
                    to: user.email,
                    resetUrl,
                    firstName: user.firstName,
                    userId: user.id,
                    schoolId: user.schoolId,
                });
            });
        }
        catch (err) {
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
    async resetPassword(dto) {
        const user = await this.usersRepository.findOne({
            where: { id: dto.userId },
        });
        if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt) {
            throw new common_1.BadRequestException('Invalid or expired reset link');
        }
        if (user.passwordResetExpiresAt < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset link');
        }
        const hash = (0, crypto_1.createHash)('sha256').update(dto.token).digest('hex');
        if (hash !== user.passwordResetTokenHash) {
            throw new common_1.BadRequestException('Invalid or expired reset link');
        }
        const newHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersRepository.update({ id: dto.userId }, {
            passwordHash: newHash,
            credentialVersion: (user.credentialVersion ?? 1) + 1,
            passwordResetTokenHash: null,
            passwordResetExpiresAt: null,
        });
        await this.sessionsService.deleteAllForUser(dto.userId);
        this.logger.log('AuthService', 'Password reset completed', {
            loggerId: 'AUTH-RESET-001',
            userId: dto.userId,
            schoolId: user.schoolId,
        });
        return { message: 'Password reset successful. You can log in with your new password.' };
    }
    async resolveUserForPasswordReset(email, schoolCode) {
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
                role: user_role_enum_1.UserRole.SUPER_ADMIN,
                schoolId: (0, typeorm_2.IsNull)(),
            },
            relations: ['school'],
        });
    }
    async generateTokens(user) {
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
    async handleFailedLogin(user) {
        const attempts = user.failedLoginAttempts + 1;
        const maxAttempts = 5;
        const updateData = { failedLoginAttempts: attempts };
        if (attempts >= maxAttempts) {
            const lockDuration = 30;
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + lockDuration);
            updateData.lockedUntil = lockedUntil;
        }
        await this.usersRepository.update({ id: user.id }, updateData);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        sessions_service_1.SessionsService,
        logger_service_1.AppLoggerService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map