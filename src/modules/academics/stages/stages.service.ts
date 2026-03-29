import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stage } from './entities/stage.entity';
import { GradeLevel } from '../grade-levels/entities/grade-level.entity';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';

@Injectable()
export class StagesService {
  constructor(
    @InjectRepository(Stage)
    private readonly repo: Repository<Stage>,
  ) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  async list(caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    return this.repo.find({
      where: { schoolId },
      order: { order: 'ASC' },
      relations: ['gradeLevels'],
    });
  }

  async get(id: string, caller: AuthCaller) {
    const stage = await this.findOneOrFail(id, caller);
    return stage;
  }

  // ─── Commands ──────────────────────────────────────────────────────────────

  async create(dto: CreateStageDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolIdForWrite(caller);

    // Validate non-KG stages must have gradeNamePrefix
    if (!dto.isKindergarten && !dto.gradeNamePrefix) {
      throw new BadRequestException(
        'gradeNamePrefix is required for non-kindergarten stages',
      );
    }

    await this.assertOrderUnique(schoolId, dto.order);

    const stage = this.repo.create({
      schoolId,
      name: dto.name,
      order: dto.order,
      maxGrades: dto.maxGrades,
      isKindergarten: dto.isKindergarten,
      gradeNamePrefix: dto.isKindergarten ? null : dto.gradeNamePrefix!,
    });

    return this.repo.save(stage);
  }

  async update(id: string, dto: UpdateStageDto, caller: AuthCaller) {
    const stage = await this.findOneOrFailForWrite(id, caller);

    if (dto.order !== undefined && dto.order !== stage.order) {
      await this.assertOrderUnique(stage.schoolId, dto.order, id);
    }

    // If switching from KG to non-KG, gradeNamePrefix becomes required
    const willBeKG = dto.isKindergarten ?? stage.isKindergarten;
    const nextPrefix = dto.gradeNamePrefix ?? stage.gradeNamePrefix;
    if (!willBeKG && !nextPrefix) {
      throw new BadRequestException(
        'gradeNamePrefix is required for non-kindergarten stages',
      );
    }

    if (dto.name !== undefined) stage.name = dto.name;
    if (dto.order !== undefined) stage.order = dto.order;
    if (dto.maxGrades !== undefined) stage.maxGrades = dto.maxGrades;
    if (dto.isKindergarten !== undefined)
      stage.isKindergarten = dto.isKindergarten;
    if (dto.gradeNamePrefix !== undefined) {
      stage.gradeNamePrefix = stage.isKindergarten ? null : dto.gradeNamePrefix;
    }

    return this.repo.save(stage);
  }

  async remove(id: string, caller: AuthCaller) {
    const stage = await this.findOneOrFailForWrite(id, caller);

    // Cascade soft-delete all grade levels in this stage
    await this.repo.manager.transaction(async (manager) => {
      const gradeLevelRepo = manager.getRepository(GradeLevel);
      const grades = await gradeLevelRepo.find({
        where: { stageId: stage.id },
      });
      if (grades.length > 0) {
        await gradeLevelRepo.softRemove(grades);
      }
      await manager.getRepository(Stage).softRemove(stage);
    });
  }

  // ─── Helpers used by GradeLevelsService ────────────────────────────────────

  async findById(id: string): Promise<Stage | null> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Compute gradeStartNumber for a non-KG stage by summing maxGrades
   * of all preceding non-KG stages (lower order) in the same school.
   */
  async computeGradeStartNumber(stage: Stage): Promise<number> {
    if (stage.isKindergarten) return 1; // not used for KG, but safe default

    const precedingStages = await this.repo
      .createQueryBuilder('s')
      .where('s.schoolId = :schoolId', { schoolId: stage.schoolId })
      .andWhere('s.order < :order', { order: stage.order })
      .andWhere('s.isKindergarten = false')
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.order', 'ASC')
      .getMany();

    const sum = precedingStages.reduce((acc, s) => acc + s.maxGrades, 0);
    return sum + 1; // grades start numbering from 1
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private resolveSchoolId(caller: AuthCaller): string {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super admin must access stages via a specific school context',
      );
    }
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private resolveSchoolIdForWrite(caller: AuthCaller): string {
    if (caller.role !== UserRole.SCHOOL_ADMIN) {
      throw new ForbiddenException('Only school admins can manage stages');
    }
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private async findOneOrFail(id: string, caller: AuthCaller): Promise<Stage> {
    const schoolId = this.resolveSchoolId(caller);
    const stage = await this.repo.findOne({
      where: { id, schoolId },
      relations: ['gradeLevels'],
    });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
  }

  private async findOneOrFailForWrite(
    id: string,
    caller: AuthCaller,
  ): Promise<Stage> {
    const schoolId = this.resolveSchoolIdForWrite(caller);
    const stage = await this.repo.findOne({
      where: { id, schoolId },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
  }

  private async assertOrderUnique(
    schoolId: string,
    order: number,
    excludeId?: string,
  ) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.schoolId = :schoolId', { schoolId })
      .andWhere('s.order = :order', { order })
      .andWhere('s.deletedAt IS NULL');

    if (excludeId) {
      qb.andWhere('s.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException(
        `A stage with order ${order} already exists in this school`,
      );
    }
  }
}
