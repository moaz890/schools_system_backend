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
exports.ParentStudent = exports.ParentRelationship = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../common/entities/base.entity");
const user_entity_1 = require("./user.entity");
var ParentRelationship;
(function (ParentRelationship) {
    ParentRelationship["FATHER"] = "father";
    ParentRelationship["MOTHER"] = "mother";
    ParentRelationship["GUARDIAN"] = "guardian";
})(ParentRelationship || (exports.ParentRelationship = ParentRelationship = {}));
let ParentStudent = class ParentStudent extends base_entity_1.BaseEntity {
    parentId;
    parent;
    studentId;
    student;
    relationship;
};
exports.ParentStudent = ParentStudent;
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', type: 'uuid' }),
    __metadata("design:type", String)
], ParentStudent.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", user_entity_1.User)
], ParentStudent.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id', type: 'uuid' }),
    __metadata("design:type", String)
], ParentStudent.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", user_entity_1.User)
], ParentStudent.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ParentRelationship,
        default: ParentRelationship.GUARDIAN,
    }),
    __metadata("design:type", String)
], ParentStudent.prototype, "relationship", void 0);
exports.ParentStudent = ParentStudent = __decorate([
    (0, typeorm_1.Entity)('parent_student')
], ParentStudent);
//# sourceMappingURL=parent-student.entity.js.map