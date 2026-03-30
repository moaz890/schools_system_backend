import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSection } from '../entities/class.entity';
import type { CreateClassDto } from '../dto/create-class.dto';
import type { UpdateClassDto } from '../dto/update-class.dto';
import type { QueryClassesDto } from '../dto/query-classes.dto';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassSection)
    private readonly repo: Repository<ClassSection>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async list(caller: AuthCaller, query: QueryClassesDto) {
    const schoolId = this.resolveSchoolId(caller);

    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.gradeLevel', 'g')
      .leftJoinAndSelect('c.academicYear', 'y')
      .leftJoinAndSelect('c.homeroomTeacher', 't')
      .where('c.schoolId = :schoolId', { schoolId })
      .andWhere('c.deletedAt IS NULL');

    if (query.gradeLevelId) {
      qb.andWhere('c.gradeLevelId = :gradeLevelId', {
        gradeLevelId: query.gradeLevelId,
      });
    }

    if (query.academicYearId) {
      qb.andWhere('c.academicYearId = :academicYearId', {
        academicYearId: query.academicYearId,
      });
    }

    qb.orderBy('g.order', 'ASC').addOrderBy('c.sectionLetter', 'ASC');

    const [data, total] = await qb
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 10)) || 0,
      },
    };
  }

  async get(id: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const found = await this.repo.findOne({
      where: { id, schoolId },
      relations: ['gradeLevel', 'academicYear', 'homeroomTeacher'],
    });

    if (!found) throw new NotFoundException('Class not found');
    return found;
  }

  async create(dto: CreateClassDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    this.validateCapacity(dto.capacity);

    const gradeLevel = await this.gradeLevelRepo.findOne({
      where: { id: dto.gradeLevelId, schoolId },
      relations: ['stage'],
    });
    if (!gradeLevel) throw new NotFoundException('Grade level not found');

    const academicYear = await this.academicYearRepo.findOne({
      where: { id: dto.academicYearId, schoolId },
    } as any);
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const teacher = await this.usersRepo.findOne({
      where: { id: dto.homeroomTeacherId, schoolId, role: UserRole.TEACHER },
    } as any);
    if (!teacher) {
      throw new BadRequestException('Homeroom teacher must be role=teacher');
    }

    // Ensure one homeroom teacher per academic year (per school) - prevents conflicts.
    const existingHomeroomCount = await this.repo.count({
      where: {
        schoolId,
        academicYearId: dto.academicYearId,
        homeroomTeacherId: dto.homeroomTeacherId,
        deletedAt: null,
      } as any,
    });
    if (existingHomeroomCount > 0) {
      throw new ConflictException(
        'This teacher is already assigned as homeroom for another class in the academic year',
      );
    }

    const gradeClassesCount = await this.repo.count({
      where: {
        schoolId,
        gradeLevelId: dto.gradeLevelId,
        academicYearId: dto.academicYearId,
        deletedAt: null,
      } as any,
    });

    if (gradeClassesCount >= LETTERS.length) {
      throw new BadRequestException(
        `Too many classes for this grade/year (max ${LETTERS.length} letters: A-${LETTERS[LETTERS.length - 1]})`,
      );
    }

    const sectionLetter = LETTERS[gradeClassesCount];
    const name = {
      en: `${gradeLevel.name.en} ${sectionLetter}`,
      ar: `${gradeLevel.name.ar} ${sectionLetter}`,
    };

    const row = this.repo.create({
      schoolId,
      gradeLevelId: gradeLevel.id,
      academicYearId: academicYear.id,
      sectionLetter,
      name,
      capacity: dto.capacity,
      homeroomTeacherId: teacher.id,
    });

    return this.repo.save(row);
  }

  async update(id: string, dto: UpdateClassDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const row = await this.repo.findOne({
      where: { id, schoolId },
    });
    if (!row) throw new NotFoundException('Class not found');

    if (dto.capacity !== undefined) {
      this.validateCapacity(dto.capacity);
      row.capacity = dto.capacity;
    }

    if (dto.homeroomTeacherId !== undefined) {
      const teacher = await this.usersRepo.findOne({
        where: {
          id: dto.homeroomTeacherId,
          schoolId,
          role: UserRole.TEACHER,
        },
      } as any);
      if (!teacher) {
        throw new BadRequestException('Homeroom teacher must be role=teacher');
      }

      const existingHomeroomCount = await this.repo.count({
        where: {
          schoolId,
          academicYearId: row.academicYearId,
          homeroomTeacherId: teacher.id,
          id: row.id,
          deletedAt: null,
        } as any,
      });

      // The count query above isn't reliably excluding current row by design.
      // So do a stricter check: count classes with the same teacher and same academicYear but different id.
      const otherHomeroom = await this.repo.count({
        where: {
          schoolId,
          academicYearId: row.academicYearId,
          homeroomTeacherId: teacher.id,
          deletedAt: null,
        } as any,
      });

      if (otherHomeroom > 0) {
        // If only the current row exists, allow.
        // We keep the logic simple for now.
        if (dto.homeroomTeacherId !== row.homeroomTeacherId || otherHomeroom > existingHomeroomCount) {
          throw new ConflictException(
            'This teacher is already assigned as homeroom for another class in the academic year',
          );
        }
      }

      row.homeroomTeacherId = teacher.id;
    }

    return this.repo.save(row);
  }

  async remove(id: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const row = await this.repo.findOne({ where: { id, schoolId } });
    if (!row) throw new NotFoundException('Class not found');
    await this.repo.softRemove(row);
  }

  private validateCapacity(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new BadRequestException('capacity must be an integer greater than 0');
    }
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }
}

