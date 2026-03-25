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
exports.Session = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let Session = class Session extends base_entity_1.BaseEntity {
    userId;
    user;
    token;
    deviceInfo;
    ipAddress;
    expiresAt;
    lastActive;
};
exports.Session = Session;
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'uuid' }),
    __metadata("design:type", String)
], Session.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.sessions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Session.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Session.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_info', type: 'varchar', length: 200, nullable: true }),
    __metadata("design:type", Object)
], Session.prototype, "deviceInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', type: 'varchar', length: 45, nullable: true }),
    __metadata("design:type", Object)
], Session.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Session.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_active', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Session.prototype, "lastActive", void 0);
exports.Session = Session = __decorate([
    (0, typeorm_1.Entity)('sessions')
], Session);
//# sourceMappingURL=session.entity.js.map