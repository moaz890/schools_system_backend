import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import type { LocalizedString } from '../../../common/i18n/localized-string.type';
import { SchoolStrategiesService } from '../../core/school-strategies/school-strategies.service';
import { CalculationMethod } from '../../core/school-strategies/entities/school-strategy.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly repo: Repository<Subject>,
    private readonly schoolStrategiesService: SchoolStrategiesService,
  ) {}

  async list(caller: AuthCaller, query: QuerySubjectsDto) {
    const schoolId = this.resolveSchoolId(caller);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.schoolId = :schoolId', { schoolId })
      .andWhere('s.deletedAt IS NULL');

    if (query.category) {
      qb.andWhere('s.category = :category', { category: query.category });
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere(
        new Brackets((q) => {
          q.where('s.code ILIKE :term', { term })
            .orWhere("s.name->>'en' ILIKE :term", { term })
            .orWhere("s.name->>'ar' ILIKE :term", { term });
        }),
      );
    }

    qb.orderBy('s.order', 'ASC').addOrderBy('s.code', 'ASC');

    const [data, total] = await qb
      .skip(query.skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  async get(id: string, caller: AuthCaller) {
    return this.findOneOrFail(id, caller);
  }

  async create(dto: CreateSubjectDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const code = this.normalizeCode(dto.code);
    await this.assertCodeUnique(schoolId, code);

    const creditHours = dto.creditHours ?? null;
    const maxPoints = dto.maxPoints ?? null;
    await this.assertSubjectWeightsMatchStrategy(schoolId, creditHours, maxPoints);

    const subject = this.repo.create({
      schoolId,
      name: dto.name as LocalizedString,
      code,
      category: dto.category,
      description: (dto.description ?? null) as LocalizedString | null,
      creditHours,
      maxPoints,
      countsTowardGpa: dto.countsTowardGpa ?? true,
      order: dto.order ?? 0,
    });

    return this.repo.save(subject);
  }

  async update(id: string, dto: UpdateSubjectDto, caller: AuthCaller) {
    const subject = await this.findOneOrFail(id, caller);

    if (dto.code !== undefined) {
      const code = this.normalizeCode(dto.code);
      if (code !== subject.code) {
        await this.assertCodeUnique(subject.schoolId, code, subject.id);
      }
      subject.code = code;
    }

    if (dto.name !== undefined) subject.name = dto.name as LocalizedString;
    if (dto.category !== undefined) subject.category = dto.category;
    if (dto.description !== undefined) {
      subject.description = (dto.description ?? null) as LocalizedString | null;
    }
    if (dto.creditHours !== undefined)
      subject.creditHours = dto.creditHours ?? null;
    if (dto.maxPoints !== undefined) subject.maxPoints = dto.maxPoints ?? null;
    if (dto.countsTowardGpa !== undefined)
      subject.countsTowardGpa = dto.countsTowardGpa;
    if (dto.order !== undefined) subject.order = dto.order;

    await this.assertSubjectWeightsMatchStrategy(
      subject.schoolId,
      subject.creditHours,
      subject.maxPoints,
    );

    return this.repo.save(subject);
  }

  async remove(id: string, caller: AuthCaller) {
    const subject = await this.findOneOrFail(id, caller);
    await this.repo.softRemove(subject);
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private async findOneOrFail(
    id: string,
    caller: AuthCaller,
  ): Promise<Subject> {
    const schoolId = this.resolveSchoolId(caller);
    const subject = await this.repo.findOne({
      where: { id, schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  /**
   * Aligns subject.creditHours vs subject.maxPoints with SchoolStrategy.calculationMethod.
   */
  private async assertSubjectWeightsMatchStrategy(
    schoolId: string,
    creditHours: number | null,
    maxPoints: number | null,
  ): Promise<void> {
    const strategy =
      await this.schoolStrategiesService.findBySchoolId(schoolId);
    if (!strategy) {
      throw new BadRequestException(
        'School grading strategy is missing. It is created automatically when the school is registered.',
      );
    }

    const method = strategy.calculationMethod as string;

    if (
      method !== CalculationMethod.CREDIT_HOURS &&
      method !== CalculationMethod.TOTAL_POINTS
    ) {
      throw new BadRequestException(
        `School calculation method "${method}" is not supported. Update the school strategy to Credit hours or Total points (admin: PATCH school strategy).`,
      );
    }

    if (method === CalculationMethod.CREDIT_HOURS) {
      if (creditHours == null || creditHours <= 0) {
        throw new BadRequestException(
          'This school uses credit-hour weighting: set creditHours to a value greater than 0, and do not set maxPoints.',
        );
      }
      if (maxPoints != null) {
        throw new BadRequestException(
          'This school uses credit-hour weighting: remove maxPoints from this subject (it must be empty).',
        );
      }
      return;
    }

    if (method === CalculationMethod.TOTAL_POINTS) {
      if (maxPoints == null || maxPoints < 1) {
        throw new BadRequestException(
          'This school uses total-points aggregation: set maxPoints to at least 1, and do not set creditHours.',
        );
      }
      if (creditHours != null) {
        throw new BadRequestException(
          'This school uses total-points aggregation: remove creditHours from this subject (it must be empty).',
        );
      }
    }
  }

  private async assertCodeUnique(
    schoolId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.schoolId = :schoolId', { schoolId })
      .andWhere('s.code = :code', { code })
      .andWhere('s.deletedAt IS NULL');

    if (excludeId) {
      qb.andWhere('s.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new ConflictException(
        `A subject with code "${code}" already exists in this school`,
      );
    }
  }
}
