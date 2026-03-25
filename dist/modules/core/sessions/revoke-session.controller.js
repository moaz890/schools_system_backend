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
exports.RevokeSessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const sessions_service_1 = require("./sessions.service");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
let RevokeSessionController = class RevokeSessionController {
    sessionsService;
    constructor(sessionsService) {
        this.sessionsService = sessionsService;
    }
    revoke(id, caller) {
        return this.sessionsService.revokeSession(id, caller);
    }
};
exports.RevokeSessionController = RevokeSessionController;
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Revoke a session',
        description: 'Owner can revoke own session; super admin any; school admin sessions in their school.',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RevokeSessionController.prototype, "revoke", null);
exports.RevokeSessionController = RevokeSessionController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [sessions_service_1.SessionsService])
], RevokeSessionController);
//# sourceMappingURL=revoke-session.controller.js.map