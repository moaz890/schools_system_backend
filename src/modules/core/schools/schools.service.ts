import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class SchoolsService {
    constructor(
        @InjectRepository(School)
        private readonly schoolsRepository: Repository<School>,
        private readonly logger: AppLoggerService,
    ) { }

    async create(
        createSchoolDto: CreateSchoolDto,
        logoUrl?: string,
    ): Promise<School> {
        // Check code uniqueness if provided
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
                throw new ConflictException(
                    `School with code "${createSchoolDto.code}" already exists`,
                );
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

    async findAll(pagination: PaginationDto): Promise<{ data: School[]; meta: any }> {
        const page = pagination.page ?? 1;
        const limit = pagination.limit ?? 10;
        const [data, total] = await this.schoolsRepository.findAndCount({
            skip: pagination.skip,
            take: limit,
            order: { createdAt: 'DESC' } as any,
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

    async findOne(id: string): Promise<School> {
        const school = await this.schoolsRepository.findOne({ where: { id } as any });
        if (!school) {
            this.logger.warn('SchoolsService', 'School not found', {
                loggerId: 'SCHOOL-READ-001',
                schoolId: id,
            });
            throw new NotFoundException(`School #${id} not found`);
        }
        return school;
    }

    async update(
        id: string,
        updateSchoolDto: UpdateSchoolDto,
        logoUrl?: string,
    ): Promise<School> {
        const school = await this.findOne(id);

        // If updating code, check uniqueness
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
                throw new ConflictException(
                    `School with code "${updateSchoolDto.code}" already exists`,
                );
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

    async remove(id: string): Promise<void> {
        const school = await this.findOne(id);
        await this.schoolsRepository.softRemove(school);
        this.logger.log('SchoolsService', 'School soft deleted', {
            loggerId: 'SCHOOL-DELETE-001',
            schoolId: id,
        });
    }

    async updateSettings(
        id: string,
        settingsDto: UpdateSchoolSettingsDto,
    ): Promise<School> {
        const school = await this.findOne(id);
        // Merge new settings with existing (patch behavior)
        school.settings = { ...school.settings, ...settingsDto };
        return this.schoolsRepository.save(school);
    }

    async updateLogo(id: string, logoUrl: string): Promise<School> {
        const school = await this.findOne(id);
        school.logoUrl = logoUrl;
        return this.schoolsRepository.save(school);
    }

    // ─── Analytics placeholder ────────────────────────────────────────────────
    // Will be filled when students/teachers modules are built
    async getAnalytics() {
        const total = await this.schoolsRepository.count();
        const active = await this.schoolsRepository.count({
            where: { isActive: true },
        });

        const schools = await this.schoolsRepository.find({
            select: ['name', 'code', 'isActive'] as any,
        });

        return {
            totalSchools: total,
            activeSchools: active,
            inactiveSchools: total - active,
            totalStudents: null, // TODO: fill when StudentsModule is built
            totalTeachers: null, // TODO: fill when TeachersModule is built
            schools: schools.map((s) => ({
                id: (s as any).id,
                name: s.name,
                code: s.code,
                isActive: s.isActive,
                studentCount: null, // TODO
                teacherCount: null, // TODO
            })),
        };
    }
}
