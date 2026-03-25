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
exports.School = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const defaultSettings = {
    gradingScale: 'letter',
    allowLateSubmissions: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    academicYearStartMonth: 9,
};
let School = class School extends base_entity_1.BaseEntity {
    name;
    code;
    email;
    phone;
    address;
    logoUrl;
    primaryColor;
    isActive;
    settings;
};
exports.School = School;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], School.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, unique: true }),
    __metadata("design:type", String)
], School.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], School.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], School.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], School.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], School.prototype, "logoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'primary_color',
        type: 'varchar',
        length: 7,
        nullable: true,
        default: '#1a56db',
    }),
    __metadata("design:type", Object)
], School.prototype, "primaryColor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], School.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: defaultSettings,
    }),
    __metadata("design:type", Object)
], School.prototype, "settings", void 0);
exports.School = School = __decorate([
    (0, typeorm_1.Entity)('schools')
], School);
//# sourceMappingURL=school.entity.js.map