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
exports.SessionAccessPolicy = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const logger_service_1 = require("../../logger/logger.service");
let SessionAccessPolicy = class SessionAccessPolicy {
    usersRepository;
    logger;
    constructor(usersRepository, logger) {
        this.usersRepository = usersRepository;
        this.logger = logger;
    }
    async assertCanListSessions(caller, targetUserId) {
        if (caller.role === user_role_enum_1.UserRole.SUPER_ADMIN) {
            return;
        }
        if (caller.role === user_role_enum_1.UserRole.SCHOOL_ADMIN) {
            const target = await this.usersRepository.findOne({
                where: { id: targetUserId },
            });
            if (!target || target.schoolId !== caller.schoolId) {
                this.logger.warn('SessionAccessPolicy', 'School admin tried cross-school session listing', {
                    loggerId: 'SESSION-POLICY-001',
                    userId: caller.id,
                    schoolId: caller.schoolId,
                    targetUserId,
                });
                throw new common_1.NotFoundException('User not found');
            }
            return;
        }
        if (caller.id === targetUserId) {
            return;
        }
        throw new common_1.ForbiddenException('Cannot access another user\'s sessions');
    }
    async assertCanRevokeSession(caller, session) {
        if (caller.role === user_role_enum_1.UserRole.SUPER_ADMIN) {
            return;
        }
        if (session.userId === caller.id) {
            return;
        }
        if (caller.role === user_role_enum_1.UserRole.SCHOOL_ADMIN) {
            const sessionOwner = await this.usersRepository.findOne({
                where: { id: session.userId },
            });
            if (sessionOwner &&
                sessionOwner.schoolId === caller.schoolId) {
                return;
            }
        }
        this.logger.warn('SessionAccessPolicy', 'Unauthorized session revoke attempt', {
            loggerId: 'SESSION-POLICY-002',
            userId: caller.id,
            schoolId: caller.schoolId,
            targetUserId: session.userId,
            targetSessionId: session.id,
        });
        throw new common_1.ForbiddenException('Cannot revoke another user\'s session');
    }
};
exports.SessionAccessPolicy = SessionAccessPolicy;
exports.SessionAccessPolicy = SessionAccessPolicy = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        logger_service_1.AppLoggerService])
], SessionAccessPolicy);
//# sourceMappingURL=session-access.policy.js.map