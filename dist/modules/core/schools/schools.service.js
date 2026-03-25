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
exports.SchoolsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const school_entity_1 = require("./entities/school.entity");
const logger_service_1 = require("../logger/logger.service");
let SchoolsService = class SchoolsService {
    schoolsRepository;
    logger;
    constructor(schoolsRepository, logger) {
        this.schoolsRepository = schoolsRepository;
        this.logger = logger;
    }
    async create(createSchoolDto, logoUrl) {
        if (createSchoolDto.code) {
            const existing = await this.schoolsRepository.findOne({
                where: { code: createSchoolDto.code },
                withDeleted: false,
            });
            if (existing) {
                this.logger.warn('SchoolsService', 'School code conflict on create', {
                    loggerId: 'SCHOOL-CREATE-001',
                    code: createSchoolDto.code,
                    email: createSchoolDto.email,
                });
                throw new common_1.ConflictException(`School with code "${createSchoolDto.code}" already exists`);
            }
        }
        const school = this.schoolsRepository.create(createSchoolDto);
        if (logoUrl) {
            school.logoUrl = logoUrl;
        }
        const created = await this.schoolsRepository.save(school);
        this.logger.log('SchoolsService', 'School created', {
            loggerId: 'SCHOOL-CREATE-002',
            schoolId: created.id,
            code: created.code,
        });
        return created;
    }
    async findAll(pagination) {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 10;
        const [data, total] = await this.schoolsRepository.findAndCount({
            skip: pagination.skip,
            take: limit,
            order: { createdAt: 'DESC' },
        });
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const school = await this.schoolsRepository.findOne({ where: { id } });
        if (!school) {
            this.logger.warn('SchoolsService', 'School not found', {
                loggerId: 'SCHOOL-READ-001',
                schoolId: id,
            });
            throw new common_1.NotFoundException(`School #${id} not found`);
        }
        return school;
    }
    async update(id, updateSchoolDto, logoUrl) {
        const school = await this.findOne(id);
        if (updateSchoolDto.code && updateSchoolDto.code !== school.code) {
            const existing = await this.schoolsRepository.findOne({
                where: { code: updateSchoolDto.code },
            });
            if (existing && existing.id !== id) {
                this.logger.warn('SchoolsService', 'School code conflict on update', {
                    loggerId: 'SCHOOL-UPDATE-001',
                    schoolId: id,
                    code: updateSchoolDto.code,
                });
                throw new common_1.ConflictException(`School with code "${updateSchoolDto.code}" already exists`);
            }
        }
        Object.assign(school, updateSchoolDto);
        if (logoUrl) {
            school.logoUrl = logoUrl;
        }
        const updated = await this.schoolsRepository.save(school);
        this.logger.log('SchoolsService', 'School updated', {
            loggerId: 'SCHOOL-UPDATE-002',
            schoolId: id,
        });
        return updated;
    }
    async remove(id) {
        const school = await this.findOne(id);
        await this.schoolsRepository.softRemove(school);
        this.logger.log('SchoolsService', 'School soft deleted', {
            loggerId: 'SCHOOL-DELETE-001',
            schoolId: id,
        });
    }
    async updateSettings(id, settingsDto) {
        const school = await this.findOne(id);
        school.settings = { ...school.settings, ...settingsDto };
        return this.schoolsRepository.save(school);
    }
    async updateLogo(id, logoUrl) {
        const school = await this.findOne(id);
        school.logoUrl = logoUrl;
        return this.schoolsRepository.save(school);
    }
    async getAnalytics() {
        const total = await this.schoolsRepository.count();
        const active = await this.schoolsRepository.count({
            where: { isActive: true },
        });
        const schools = await this.schoolsRepository.find({
            select: ['name', 'code', 'isActive'],
        });
        return {
            totalSchools: total,
            activeSchools: active,
            inactiveSchools: total - active,
            totalStudents: null,
            totalTeachers: null,
            schools: schools.map((s) => ({
                id: s.id,
                name: s.name,
                code: s.code,
                isActive: s.isActive,
                studentCount: null,
                teacherCount: null,
            })),
        };
    }
};
exports.SchoolsService = SchoolsService;
exports.SchoolsService = SchoolsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(school_entity_1.School)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        logger_service_1.AppLoggerService])
], SchoolsService);
//# sourceMappingURL=schools.service.js.map