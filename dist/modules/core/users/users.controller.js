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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const bulk_create_users_dto_1 = require("./dto/bulk-create-users.dto");
const link_parent_student_dto_1 = require("./dto/link-parent-student.dto");
const query_users_dto_1 = require("./dto/query-users.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const uploadBaseDir = (0, path_1.join)(process.cwd(), process.env.UPLOAD_DEST || './uploads');
const avatarUploadDir = (0, path_1.join)(uploadBaseDir, 'avatars');
fs_1.default.mkdirSync(avatarUploadDir, { recursive: true });
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(dto, caller) {
        return this.usersService.create(dto, caller);
    }
    bulkCreate(dto, caller) {
        return this.usersService.bulkCreate(dto, caller);
    }
    findAll(query, user) {
        return this.usersService.findAll(query, user.schoolId, user.role);
    }
    getMe(user) {
        return this.usersService.findOne(user.id);
    }
    updateMe(user, dto) {
        return this.usersService.updateProfile(user.id, dto);
    }
    uploadAvatar(user, file) {
        if (!file)
            throw new common_1.BadRequestException('Avatar file is required');
        return this.usersService.updateAvatar(user.id, `/uploads/avatars/${file.filename}`);
    }
    findOne(id, caller) {
        return this.usersService.findOne(id, caller);
    }
    update(id, dto, caller) {
        return this.usersService.update(id, dto, caller);
    }
    remove(id, caller) {
        return this.usersService.remove(id, caller);
    }
    linkChild(parentId, dto, caller) {
        return this.usersService.linkParentToStudent(parentId, dto, caller);
    }
    getChildren(parentId, user) {
        if (user.role === user_role_enum_1.UserRole.PARENT && parentId !== user.id) {
            throw new common_1.ForbiddenException('You can only view your own children');
        }
        return this.usersService.getParentChildren(parentId);
    }
    unlinkChild(parentId, studentId, caller) {
        return this.usersService.unlinkParentFromStudent(parentId, studentId, caller);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a school admin (super admin only)',
        description: 'Creates a user with role school_admin for the given school. Teachers, students, and parents are created elsewhere.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Bulk create school admins (super admin only)',
        description: 'Same rules as POST /users — each entry is a school_admin for its schoolId.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_create_users_dto_1.BulkCreateUsersDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "bulkCreate", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List users (filter by ?role= or ?status=)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_users_dto_1.QueryUsersDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get own profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Patch)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Update own profile (name, phone)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateMe", null);
__decorate([
    (0, common_1.Post)('me/avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload own avatar photo' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: (0, multer_1.diskStorage)({
            destination: avatarUploadDir,
            filename: (_req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `avatar-${unique}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
            if (!allowed.includes((0, path_1.extname)(file.originalname).toLowerCase())) {
                return cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 2 * 1024 * 1024 },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (status, name, phone)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a user' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':parentId/children'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Link a student to a parent' }),
    __param(0, (0, common_1.Param)('parentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, link_parent_student_dto_1.LinkParentStudentDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "linkChild", null);
__decorate([
    (0, common_1.Get)(':parentId/children'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN, user_role_enum_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "Get parent's linked children" }),
    __param(0, (0, common_1.Param)('parentId', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Delete)(':parentId/children/:studentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Unlink a student from a parent' }),
    __param(0, (0, common_1.Param)('parentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('studentId', common_1.ParseUUIDPipe)),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "unlinkChild", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map