import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateClassDto } from '../dto/create-class.dto';
import type { UpdateClassDto } from '../dto/update-class.dto';
import type { QueryClassesDto } from '../dto/query-classes.dto';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { ClassesDalService } from './classes-dal.service';
import { ClassesHelpersService } from './classes-helpers.service';

@Injectable()
export class ClassesService {
  constructor(
    private readonly dal: ClassesDalService,
    private readonly helpers: ClassesHelpersService,
  ) {}

  async list(caller: AuthCaller, query: QueryClassesDto) {
    const schoolId = this.helpers.resolveCallerSchoolId(caller);

    const { data, total } = await this.dal.listClassesPaginated(
      schoolId,
      query,
    );

    return {
      data: data.map((c) => this.helpers.toPublicClassResponse(c)),
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total,
        totalPages: Math.ceil(total / (query.limit ?? 10)) || 0,
      },
    };
  }

  async get(id: string, caller: AuthCaller) {
    const schoolId = this.helpers.resolveCallerSchoolId(caller);
    const found = await this.dal.findClassByIdWithPublicRelations(schoolId, id);

    if (!found) throw new NotFoundException('Class not found');
    return this.helpers.toPublicClassResponse(found);
  }

  async create(dto: CreateClassDto, caller: AuthCaller) {
    const schoolId = this.helpers.resolveCallerSchoolId(caller);
    this.helpers.assertValidClassCapacity(dto.capacity);

    const gradeLevel = await this.dal.findGradeLevelWithStage(
      schoolId,
      dto.gradeLevelId,
    );
    if (!gradeLevel) throw new NotFoundException('Grade level not found');

    const academicYear = await this.dal.findAcademicYear(
      schoolId,
      dto.academicYearId,
    );
    if (!academicYear) throw new NotFoundException('Academic year not found');

    const teacher = await this.dal.findTeacherInSchool(
      schoolId,
      dto.homeroomTeacherId,
    );
    if (!teacher) {
      throw new BadRequestException('Homeroom teacher must be role=teacher');
    }

    const homeroomTaken =
      await this.dal.countHomeroomAssignmentsForTeacherInYear(
        schoolId,
        dto.academicYearId,
        dto.homeroomTeacherId,
      );
    if (homeroomTaken > 0) {
      throw new ConflictException(
        'This teacher is already assigned as homeroom for another class in the academic year',
      );
    }

    const gradeClassesCount = await this.dal.countClassesForGradeAndYear(
      schoolId,
      dto.gradeLevelId,
      dto.academicYearId,
    );

    const sectionLetter =
      this.helpers.sectionLetterForExistingClassCount(gradeClassesCount);
    const name = this.helpers.localizedSectionName(
      gradeLevel.name.en,
      gradeLevel.name.ar,
      sectionLetter,
    );

    const row = this.dal.createClassEntity({
      schoolId,
      gradeLevelId: gradeLevel.id,
      academicYearId: academicYear.id,
      sectionLetter,
      name,
      capacity: dto.capacity,
      homeroomTeacherId: teacher.id,
    });

    const saved = await this.dal.saveClass(row);
    const withRelations = await this.dal.findClassByIdWithPublicRelations(
      schoolId,
      saved.id,
    );
    if (!withRelations) {
      throw new NotFoundException('Class not found after create');
    }
    return this.helpers.toPublicClassResponse(withRelations);
  }

  async update(id: string, dto: UpdateClassDto, caller: AuthCaller) {
    const schoolId = this.helpers.resolveCallerSchoolId(caller);
    const row = await this.dal.findClassById(schoolId, id);
    if (!row) throw new NotFoundException('Class not found');

    if (dto.capacity !== undefined) {
      this.helpers.assertValidClassCapacity(dto.capacity);
      row.capacity = dto.capacity;
    }

    if (
      dto.homeroomTeacherId !== undefined &&
      dto.homeroomTeacherId !== row.homeroomTeacherId
    ) {
      const teacher = await this.dal.findTeacherInSchool(
        schoolId,
        dto.homeroomTeacherId,
      );
      if (!teacher) {
        throw new BadRequestException('Homeroom teacher must be role=teacher');
      }

      const conflicts =
        await this.dal.countOtherHomeroomAssignmentsForTeacherInYear(
          schoolId,
          row.academicYearId,
          teacher.id,
          row.id,
        );
      if (conflicts > 0) {
        throw new ConflictException(
          'This teacher is already assigned as homeroom for another class in the academic year',
        );
      }

      row.homeroomTeacherId = teacher.id;
    }

    await this.dal.saveClass(row);
    const withRelations = await this.dal.findClassByIdWithPublicRelations(
      schoolId,
      row.id,
    );
    if (!withRelations) throw new NotFoundException('Class not found');
    return this.helpers.toPublicClassResponse(withRelations);
  }

  async remove(id: string, caller: AuthCaller) {
    const schoolId = this.helpers.resolveCallerSchoolId(caller);
    const row = await this.dal.findClassById(schoolId, id);
    if (!row) throw new NotFoundException('Class not found');
    await this.dal.softRemoveClass(row);
  }
}
