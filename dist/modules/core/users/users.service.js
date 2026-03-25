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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("./entities/user.entity");
const parent_student_entity_1 = require("./entities/parent-student.entity");
const user_role_enum_1 = require("../../../common/enums/user-role.enum");
const logger_service_1 = require("../logger/logger.service");
let UsersService = class UsersService {
    usersRepository;
    parentStudentRepository;
    logger;
    constructor(usersRepository, parentStudentRepository, logger) {
        this.usersRepository = usersRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.logger = logger;
    }
    async create(dto, caller) {
        if (caller.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            this.logger.warn('UsersService', 'Forbidden create attempt', {
                loggerId: 'USER-CREATE-001',
                userId: caller.id,
                schoolId: caller.schoolId,
                role: caller.role,
            });
            throw new common_1.ForbiddenException('Only super admins can create users here; other roles are created in their own modules');
        }
        const assignedSchoolId = dto.schoolId;
        const existingEmail = await this.usersRepository.findOne({
            where: { email: dto.email, schoolId: assignedSchoolId },
        });
        if (existingEmail) {
            this.logger.warn('UsersService', 'Email conflict on user create', {
                loggerId: 'USER-CREATE-002',
                schoolId: assignedSchoolId,
                email: dto.email,
            });
            throw new common_1.ConflictException(`Email "${dto.email}" is already in use in this school`);
        }
        const existingNatId = await this.usersRepository.findOne({
            where: { nationalId: dto.nationalId },
        });
        if (existingNatId) {
            this.logger.warn('UsersService', 'National ID conflict on user create', {
                loggerId: 'USER-CREATE-003',
                nationalId: dto.nationalId,
            });
            throw new common_1.ConflictException(`National ID "${dto.nationalId}" is already registered`);
        }
        const plainPassword = this.generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const user = this.usersRepository.create({
            ...dto,
            schoolId: assignedSchoolId,
            role: user_role_enum_1.UserRole.SCHOOL_ADMIN,
            passwordHash,
        });
        const saved = await this.usersRepository.save(user);
        const savedUser = (Array.isArray(saved) ? saved[0] : saved);
        this.logger.log('UsersService', 'School admin created', {
            loggerId: 'USER-CREATE-004',
            userId: savedUser.id,
            schoolId: savedUser.schoolId,
        });
        return { user: savedUser, plainPassword };
    }
    async bulkCreate(dto, caller) {
        const created = [];
        const failed = [];
        for (let i = 0; i < dto.users.length; i++) {
            try {
                const result = await this.create(dto.users[i], caller);
                created.push(result);
            }
            catch (err) {
                failed.push({
                    index: i,
                    email: dto.users[i].email,
                    reason: err.message,
                });
            }
        }
        return { created, failed };
    }
    async findAll(query, callerSchoolId, callerRole) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const qb = this.usersRepository.createQueryBuilder('user');
        if (callerRole !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            qb.where('user.school_id = :schoolId', { schoolId: callerSchoolId });
        }
        if (query.role)
            qb.andWhere('user.role = :role', { role: query.role });
        if (query.status)
            qb.andWhere('user.status = :status', { status: query.status });
        qb.andWhere('user.deleted_at IS NULL');
        qb.select([
            'user.id', 'user.email', 'user.firstName', 'user.lastName',
            'user.role', 'user.status', 'user.phone', 'user.schoolId',
            'user.nationalId', 'user.nationalIdType', 'user.avatarUrl',
            'user.createdAt',
        ]);
        qb.orderBy('user.createdAt', 'DESC');
        qb.skip(query.skip).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, caller) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: [
                'id', 'email', 'firstName', 'lastName', 'role', 'status',
                'phone', 'schoolId', 'nationalId', 'nationalIdType',
                'avatarUrl', 'createdAt',
            ],
        });
        if (!user)
            throw new common_1.NotFoundException(`User #${id} not found`);
        if (caller &&
            caller.role !== user_role_enum_1.UserRole.SUPER_ADMIN &&
            user.schoolId !== caller.schoolId) {
            throw new common_1.NotFoundException(`User #${id} not found`);
        }
        return user;
    }
    async update(id, dto, caller) {
        const user = await this.findOne(id, caller);
        if (dto.email && dto.email !== user.email) {
            const clash = await this.usersRepository.findOne({
                where: { email: dto.email, schoolId: user.schoolId },
            });
            if (clash && clash.id !== id) {
                throw new common_1.ConflictException(`Email "${dto.email}" is already in use in this school`);
            }
        }
        const patch = { ...dto };
        if (caller.role === user_role_enum_1.UserRole.SCHOOL_ADMIN) {
            delete patch.role;
        }
        await this.usersRepository.update({ id }, patch);
        return this.findOne(id, caller);
    }
    async updateProfile(id, dto) {
        await this.findOne(id);
        await this.usersRepository.update({ id }, dto);
        return this.findOne(id);
    }
    async updateAvatar(id, avatarUrl) {
        await this.findOne(id);
        await this.usersRepository.update({ id }, { avatarUrl });
        return this.findOne(id);
    }
    async remove(id, caller) {
        const user = await this.findOne(id, caller);
        await this.usersRepository.softRemove(user);
        this.logger.log('UsersService', 'User soft deleted', {
            loggerId: 'USER-DELETE-001',
            userId: id,
            schoolId: user.schoolId,
            actorUserId: caller.id,
        });
    }
    async linkParentToStudent(parentId, dto, caller) {
        const parent = await this.usersRepository.findOne({ where: { id: parentId } });
        if (!parent)
            throw new common_1.NotFoundException('Parent not found');
        if (parent.role !== user_role_enum_1.UserRole.PARENT) {
            throw new common_1.BadRequestException('User is not a parent');
        }
        const student = await this.usersRepository.findOne({ where: { id: dto.studentId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        if (student.role !== user_role_enum_1.UserRole.STUDENT) {
            throw new common_1.BadRequestException('Target user is not a student');
        }
        if (parent.schoolId !== student.schoolId) {
            throw new common_1.BadRequestException('Parent and student must belong to the same school');
        }
        if (caller.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            if (caller.schoolId === null ||
                parent.schoolId !== caller.schoolId ||
                student.schoolId !== caller.schoolId) {
                throw new common_1.ForbiddenException('You can only link users within your school');
            }
        }
        const existing = await this.parentStudentRepository.findOne({
            where: { parentId, studentId: dto.studentId },
        });
        if (existing)
            throw new common_1.ConflictException('Already linked');
        const link = this.parentStudentRepository.create({
            parentId,
            studentId: dto.studentId,
            relationship: dto.relationship,
        });
        return this.parentStudentRepository.save(link);
    }
    async getParentChildren(parentId) {
        const links = await this.parentStudentRepository.find({
            where: { parentId },
        });
        const studentIds = links.map((l) => l.studentId);
        if (studentIds.length === 0)
            return [];
        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...ids)', { ids: studentIds })
            .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.status'])
            .getMany();
    }
    async unlinkParentFromStudent(parentId, studentId, caller) {
        const parent = await this.usersRepository.findOne({ where: { id: parentId } });
        const student = await this.usersRepository.findOne({ where: { id: studentId } });
        if (!parent || !student)
            throw new common_1.NotFoundException('User not found');
        if (caller.role !== user_role_enum_1.UserRole.SUPER_ADMIN) {
            if (caller.schoolId === null ||
                parent.schoolId !== caller.schoolId ||
                student.schoolId !== caller.schoolId) {
                throw new common_1.ForbiddenException('You can only unlink users within your school');
            }
        }
        const link = await this.parentStudentRepository.findOne({
            where: { parentId, studentId },
        });
        if (!link)
            throw new common_1.NotFoundException('Link not found');
        await this.parentStudentRepository.remove(link);
    }
    generatePassword(length = 10) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(parent_student_entity_1.ParentStudent)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        logger_service_1.AppLoggerService])
], UsersService);
//# sourceMappingURL=users.service.js.map