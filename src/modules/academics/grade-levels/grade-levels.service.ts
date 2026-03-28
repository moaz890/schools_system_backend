import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevel } from './entities/grade-level.entity';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';
import { StagesService } from '../stages/stages.service';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { Stage } from '../stages/entities/stage.entity';
import type { LocalizedString } from '../../../common/i18n/localized-string.type';

@Injectable()
export class GradeLevelsService {
    constructor(
        @InjectRepository(GradeLevel)
        private readonly repo: Repository<GradeLevel>,
        private readonly stagesService: StagesService,
    ) { }

    // ─── Queries ───────────────────────────────────────────────────────────────

    async list(caller: AuthCaller, stageId?: string) {
        const schoolId = this.resolveSchoolId(caller);
        const where: any = { schoolId };
        if (stageId) where.stageId = stageId;

        return this.repo.find({
            where,
            order: { order: 'ASC' },
            relations: ['stage'],
        });
    }

    async get(id: string, caller: AuthCaller) {
        return this.findOneOrFail(id, caller);
    }

    async listByStage(stageId: string, caller: AuthCaller) {
        const schoolId = this.resolveSchoolId(caller);

        // Verify stage belongs to this school
        const stage = await this.stagesService.findById(stageId);
        if (!stage || stage.schoolId !== schoolId) {
            throw new NotFoundException('Stage not found');
        }

        return this.repo.find({
            where: { stageId, schoolId },
            order: { order: 'ASC' },
        });
    }

    // ─── Commands ──────────────────────────────────────────────────────────────

    async create(dto: CreateGradeLevelDto, caller: AuthCaller) {
        const schoolId = this.resolveSchoolId(caller);

        // Validate stage exists and belongs to same school
        const stage = await this.stagesService.findById(dto.stageId);
        if (!stage || stage.schoolId !== schoolId) {
            throw new NotFoundException('Stage not found in your school');
        }

        // Check maxGrades limit
        await this.assertMaxGradesNotExceeded(stage);

        // Check order uniqueness within stage
        await this.assertOrderUnique(dto.stageId, dto.order);

        // Validate order does not exceed maxGrades
        if (dto.order > stage.maxGrades) {
            throw new BadRequestException(
                `Grade order cannot exceed ${stage.maxGrades} (max grades for this stage)`,
            );
        }

        // Generate name
        const name = await this.resolveGradeName(stage, dto.order, dto.name);

        const grade = this.repo.create({
            schoolId,
            stageId: dto.stageId,
            name,
            order: dto.order,
        });

        return this.repo.save(grade);
    }

    async update(id: string, dto: UpdateGradeLevelDto, caller: AuthCaller) {
        const grade = await this.findOneOrFailForWrite(id, caller);
        const stage = await this.stagesService.findById(grade.stageId);
        if (!stage) throw new NotFoundException('Stage not found');

        if (dto.order !== undefined && dto.order !== grade.order) {
            await this.assertOrderUnique(grade.stageId, dto.order, id);
            if (dto.order > stage.maxGrades) {
                throw new BadRequestException(
                    `Grade order cannot exceed ${stage.maxGrades} (max grades for this stage)`,
                );
            }
            grade.order = dto.order;

            // Re-generate name for non-KG stages when order changes
            if (!stage.isKindergarten) {
                grade.name = await this.generateAutoName(stage, dto.order);
            }
        }

        // For KG stages, allow manual name update
        if (stage.isKindergarten && dto.name !== undefined) {
            grade.name = dto.name;
        }

        return this.repo.save(grade);
    }

    async remove(id: string, caller: AuthCaller) {
        const grade = await this.findOneOrFailForWrite(id, caller);
        await this.repo.softRemove(grade);
    }

    // ─── Naming Logic ──────────────────────────────────────────────────────────

    private async resolveGradeName(
        stage: Stage,
        order: number,
        manualName?: LocalizedString,
    ): Promise<LocalizedString> {
        if (stage.isKindergarten) {
            if (!manualName) {
                throw new BadRequestException(
                    'Grade name is required for kindergarten stages',
                );
            }
            return manualName;
        }

        // Auto-generate name for non-KG stages
        return this.generateAutoName(stage, order);
    }

    private async generateAutoName(
        stage: Stage,
        order: number,
    ): Promise<LocalizedString> {
        const startNumber = await this.stagesService.computeGradeStartNumber(stage);
        const gradeNumber = startNumber + order - 1;
        const prefix = stage.gradeNamePrefix!;

        return {
            en: `${prefix.en} ${gradeNumber}`,
            ar: `${prefix.ar} ${gradeNumber}`,
        };
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private resolveSchoolId(caller: AuthCaller): string {
        if (!caller.schoolId) {
            throw new BadRequestException('You must be assigned to a school');
        }
        return caller.schoolId;
    }

    private async findOneOrFail(id: string, caller: AuthCaller): Promise<GradeLevel> {
        const schoolId = this.resolveSchoolId(caller);
        const grade = await this.repo.findOne({
            where: { id, schoolId },
            relations: ['stage'],
        });
        if (!grade) throw new NotFoundException('Grade level not found');
        return grade;
    }

    private async findOneOrFailForWrite(id: string, caller: AuthCaller): Promise<GradeLevel> {
        const schoolId = this.resolveSchoolId(caller);
        const grade = await this.repo.findOne({
            where: { id, schoolId },
        });
        if (!grade) throw new NotFoundException('Grade level not found');
        return grade;
    }

    private async assertMaxGradesNotExceeded(stage: Stage) {
        const count = await this.repo.count({
            where: { stageId: stage.id },
        });
        if (count >= stage.maxGrades) {
            throw new BadRequestException(
                `This stage already has the maximum number of grades (${stage.maxGrades})`,
            );
        }
    }

    private async assertOrderUnique(
        stageId: string,
        order: number,
        excludeId?: string,
    ) {
        const qb = this.repo
            .createQueryBuilder('g')
            .where('g.stageId = :stageId', { stageId })
            .andWhere('g.order = :order', { order })
            .andWhere('g.deletedAt IS NULL');

        if (excludeId) {
            qb.andWhere('g.id != :excludeId', { excludeId });
        }

        const existing = await qb.getOne();
        if (existing) {
            throw new BadRequestException(
                `A grade with order ${order} already exists in this stage`,
            );
        }
    }
}
