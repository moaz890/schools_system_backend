import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SchoolStrategy,
  EGYPTIAN_GRADE_DESCRIPTORS,
} from './entities/school-strategy.entity';
import { UpdateSchoolStrategyDto } from './dto/update-school-strategy.dto';
import { AuthCaller } from '../users/types/auth-caller.type';

@Injectable()
export class SchoolStrategiesService {
  constructor(
    @InjectRepository(SchoolStrategy)
    private readonly repo: Repository<SchoolStrategy>,
  ) {}

  /**
   * Auto-called when a school is created. Creates a default strategy
   * using Egyptian MOE defaults. Idempotent — skips if already exists.
   */
  async initForSchool(schoolId: string): Promise<SchoolStrategy> {
    const existing = await this.repo.findOne({ where: { schoolId } as any });
    if (existing) return existing;

    const strategy = this.repo.create({
      schoolId,
      gradeDescriptors: EGYPTIAN_GRADE_DESCRIPTORS,
    });
    return this.repo.save(strategy);
  }

  /**
   * Returns the strategy for the caller's school.
   * School admin only — schoolId comes from the jwt via AuthCaller.
   */
  async findForCaller(caller: AuthCaller): Promise<SchoolStrategy> {
    const schoolId = this.resolveSchoolId(caller);
    const strategy = await this.repo.findOne({ where: { schoolId } as any });
    if (!strategy) {
      throw new NotFoundException(
        `Strategy for school ${schoolId} not found. It will be created on first access.`,
      );
    }
    return strategy;
  }

  /**
   * Returns the strategy for any given schoolId. Used internally by other services.
   */
  async findBySchoolId(schoolId: string): Promise<SchoolStrategy | null> {
    return this.repo.findOne({ where: { schoolId } as any });
  }

  /**
   * Patches the strategy for the caller's school.
   */
  async updateForCaller(
    dto: UpdateSchoolStrategyDto,
    caller: AuthCaller,
  ): Promise<SchoolStrategy> {
    const schoolId = this.resolveSchoolId(caller);
    const strategy = await this.repo.findOne({ where: { schoolId } as any });
    if (!strategy) {
      throw new NotFoundException(`Strategy for school ${schoolId} not found`);
    }

    // Validate gradeDescriptors if provided: max/min must be valid and cover 0-100
    if (dto.gradeDescriptors) {
      this.validateDescriptors(dto.gradeDescriptors);
    }

    Object.assign(strategy, dto);
    return this.repo.save(strategy);
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private validateDescriptors(
    descriptors: Array<{ min: number; max: number }>,
  ): void {
    // Each descriptor: min <= max, no gaps, covers full 0-100 range
    const sorted = [...descriptors].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].min > sorted[i].max) {
        throw new BadRequestException(
          `Grade descriptor has min (${sorted[i].min}) greater than max (${sorted[i].max})`,
        );
      }
      if (i > 0 && sorted[i].min !== sorted[i - 1].max + 1) {
        throw new BadRequestException(
          'Grade descriptors must be contiguous with no gaps or overlaps',
        );
      }
    }
    if (sorted[0]?.min !== 0 || sorted[sorted.length - 1]?.max !== 100) {
      throw new BadRequestException(
        'Grade descriptors must cover the full range 0–100',
      );
    }
  }
}
