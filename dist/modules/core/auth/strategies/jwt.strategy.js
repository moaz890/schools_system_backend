"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const account_status_enum_1 = require("../../../../common/enums/account-status.enum");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    usersRepository;
    constructor(configService, usersRepository) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.accessSecret') ?? '',
        });
        this.configService = configService;
        this.usersRepository = usersRepository;
    }
    async validate(payload) {
        const user = await this.usersRepository.findOne({
            where: { id: payload.sub },
            relations: ['school'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.status !== account_status_enum_1.AccountStatus.ACTIVE) {
            throw new common_1.UnauthorizedException(`Your account is ${user.status}. Please contact your administrator.`);
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new common_1.UnauthorizedException(`Your account is temporarily locked. Try again after ${user.lockedUntil.toISOString()}.`);
        }
        if (user.schoolId && user.school && !user.school.isActive) {
            throw new common_1.UnauthorizedException('This school is not active. Please contact support.');
        }
        if (payload.schoolId !== undefined &&
            payload.schoolId !== user.schoolId) {
            throw new common_1.UnauthorizedException('Session expired or invalid. Please sign in again.');
        }
        const tokenCredentialVersion = payload.cv ?? 1;
        const currentCredentialVersion = user.credentialVersion ?? 1;
        if (tokenCredentialVersion !== currentCredentialVersion) {
            throw new common_1.UnauthorizedException('Credentials changed. Please sign in again.');
        }
        return {
            id: user.id,
            schoolId: user.schoolId,
            schoolCode: user.school?.code ?? null,
            role: user.role,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map