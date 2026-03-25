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
exports.SchoolsController = void 0;
const common_1 = require("@nestjs/common");
const conditional_file_interceptor_1 = require("../../../common/interceptors/conditional-file.interceptor");
const logo_upload_helper_1 = require("../../../common/upload/logo-upload.helper");
const swagger_1 = require("@nestjs/swagger");
const schools_service_1 = require("./schools.service");
const create_school_dto_1 = require("./dto/create-school.dto");
const update_school_dto_1 = require("./dto/update-school.dto");
const update_school_settings_dto_1 = require("./dto/update-school-settings.dto");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
let SchoolsController = class SchoolsController {
    schoolsService;
    constructor(schoolsService) {
        this.schoolsService = schoolsService;
    }
    assertSchoolScope(user, schoolId) {
        if (user.role === user_role_enum_1.UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
            throw new common_1.ForbiddenException('You can only manage your own school');
        }
    }
    create(createSchoolDto, file) {
        const logoUrl = file ? (0, logo_upload_helper_1.getPublicLogoUrl)(file.filename) : undefined;
        return this.schoolsService.create(createSchoolDto, logoUrl);
    }
    findAll(pagination) {
        return this.schoolsService.findAll(pagination);
    }
    remove(id) {
        return this.schoolsService.remove(id);
    }
    getAnalytics() {
        return this.schoolsService.getAnalytics();
    }
    getMySchool(user) {
        return this.schoolsService.findOne(user.schoolId);
    }
    findOne(id, user) {
        this.assertSchoolScope(user, id);
        return this.schoolsService.findOne(id);
    }
    update(id, updateSchoolDto, user, file) {
        this.assertSchoolScope(user, id);
        const logoUrl = file ? (0, logo_upload_helper_1.getPublicLogoUrl)(file.filename) : undefined;
        return this.schoolsService.update(id, updateSchoolDto, logoUrl);
    }
    updateSettings(id, settingsDto, user) {
        this.assertSchoolScope(user, id);
        return this.schoolsService.updateSettings(id, settingsDto);
    }
    uploadLogo(id, file, user) {
        this.assertSchoolScope(user, id);
        if (!file)
            throw new common_1.BadRequestException('Logo file is required');
        const logoUrl = (0, logo_upload_helper_1.getPublicLogoUrl)(file.filename);
        return this.schoolsService.updateLogo(id, logoUrl);
    }
};
exports.SchoolsController = SchoolsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new school (Super Admin only)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, conditional_file_interceptor_1.ConditionalFileInterceptor)('logo', (0, logo_upload_helper_1.getLogoMulterOptions)())),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_school_dto_1.CreateSchoolDto, Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all schools (Super Admin only)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a school (Super Admin only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Cross-school analytics (Super Admin only, placeholder)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SCHOOL_ADMIN, user_role_enum_1.UserRole.TEACHER, user_role_enum_1.UserRole.STUDENT, user_role_enum_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's school (no need to know the ID)" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "getMySchool", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get one school by ID (Super Admin Only)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update school info used by ( Super Admin only )' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, conditional_file_interceptor_1.ConditionalFileInterceptor)('logo', (0, logo_upload_helper_1.getLogoMulterOptions)())),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_school_dto_1.UpdateSchoolDto, Object, Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/settings'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN, user_role_enum_1.UserRole.SCHOOL_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update school settings (JSON patch) (Super and School Admins)' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_school_settings_dto_1.UpdateSchoolSettingsDto, Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(':id/logo'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Upload school logo ( Super Admin )' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, conditional_file_interceptor_1.ConditionalFileInterceptor)('logo', (0, logo_upload_helper_1.getLogoMulterOptions)())),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], SchoolsController.prototype, "uploadLogo", null);
exports.SchoolsController = SchoolsController = __decorate([
    (0, swagger_1.ApiTags)('Schools'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('schools'),
    __metadata("design:paramtypes", [schools_service_1.SchoolsService])
], SchoolsController);
//# sourceMappingURL=schools.controller.js.map