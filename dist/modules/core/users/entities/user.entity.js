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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.NationalIdType = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const user_role_enum_1 = require("../../../../common/enums/user-role.enum");
const account_status_enum_1 = require("../../../../common/enums/account-status.enum");
const school_entity_1 = require("../../schools/entities/school.entity");
const session_entity_1 = require("../../sessions/entities/session.entity");
var NationalIdType;
(function (NationalIdType) {
    NationalIdType["NATIONAL_ID"] = "national_id";
    NationalIdType["PASSPORT"] = "passport";
    NationalIdType["IQAMA"] = "iqama";
})(NationalIdType || (exports.NationalIdType = NationalIdType = {}));
let User = class User extends base_entity_1.BaseEntity {
    schoolId;
    school;
    email;
    passwordHash;
    firstName;
    lastName;
    phone;
    role;
    status;
    avatarUrl;
    nationalId;
    nationalIdType;
    failedLoginAttempts;
    lockedUntil;
    credentialVersion;
    passwordResetTokenHash;
    passwordResetExpiresAt;
    sessions;
};
exports.User = User;
__decorate([
    (0, typeorm_1.Column)({ name: 'school_id', type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "schoolId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => school_entity_1.School, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'school_id' }),
    __metadata("design:type", Object)
], User.prototype, "school", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_hash', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'first_name', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_name', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_role_enum_1.UserRole }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: account_status_enum_1.AccountStatus,
        default: account_status_enum_1.AccountStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avatar_url', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'national_id', type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], User.prototype, "nationalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'national_id_type',
        type: 'enum',
        enum: NationalIdType,
        default: NationalIdType.NATIONAL_ID,
    }),
    __metadata("design:type", String)
], User.prototype, "nationalIdType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_login_attempts', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failedLoginAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'locked_until', nullable: true, type: 'timestamptz' }),
    __metadata("design:type", Object)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'credential_version', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], User.prototype, "credentialVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_reset_token_hash', type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "passwordResetTokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_reset_expires_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "passwordResetExpiresAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_entity_1.Session, (session) => session.user, { cascade: true }),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users'),
    (0, typeorm_1.Index)('UQ_users_school_email_active', ['schoolId', 'email'], {
        unique: true,
        where: '"school_id" IS NOT NULL AND "deleted_at" IS NULL',
    }),
    (0, typeorm_1.Index)('UQ_users_superadmin_email_active', ['email'], {
        unique: true,
        where: '"school_id" IS NULL AND "deleted_at" IS NULL',
    })
], User);
//# sourceMappingURL=user.entity.js.map