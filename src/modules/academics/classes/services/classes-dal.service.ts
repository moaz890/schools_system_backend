import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ClassSection } from '../entities/class.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { QueryClassesDto } from '../dto/query-classes.dto';

@Injectable()
export class ClassesDalService {
  constructor(
    @InjectRepository(ClassSection)
    private readonly classRepo: Repository<ClassSection>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(AcademicYear)
    private readonly academicYearRepo: Repository<AcademicYear>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findGradeLevelWithStage(schoolId: string, gradeLevelId: string) {
    return this.gradeLevelRepo.findOne({
      where: { id: gradeLevelId, schoolId },
      relations: ['stage'],
    });
  }

  findAcademicYear(schoolId: string, academicYearId: string) {
    return this.academicYearRepo.findOne({
      where: { id: academicYearId, schoolId },
    } as any);
  }

  findTeacherInSchool(schoolId: string, teacherId: string) {
    return this.usersRepo.findOne({
      where: { id: teacherId, schoolId, role: UserRole.TEACHER },
    } as any);
  }

  countHomeroomAssignmentsForTeacherInYear(
    schoolId: string,
    academicYearId: string,
    homeroomTeacherId: string,
  ) {
    return this.classRepo.count({
      where: {
        schoolId,
        academicYearId,
        homeroomTeacherId,
        deletedAt: IsNull(),
      } as any,
    });
  }

  /**
   * Other classes (same school/year/teacher) excluding the current class row.
   */
  countOtherHomeroomAssignmentsForTeacherInYear(
    schoolId: string,
    academicYearId: string,
    homeroomTeacherId: string,
    excludeClassId: string,
  ) {
    return this.classRepo.count({
      where: {
        schoolId,
        academicYearId,
        homeroomTeacherId,
        id: Not(excludeClassId),
        deletedAt: IsNull(),
      } as any,
    });
  }

  countClassesForGradeAndYear(
    schoolId: string,
    gradeLevelId: string,
    academicYearId: string,
  ) {
    return this.classRepo.count({
      where: {
        schoolId,
        gradeLevelId,
        academicYearId,
        deletedAt: IsNull(),
      } as any,
    });
  }

  createClassEntity(partial: Partial<ClassSection>) {
    return this.classRepo.create(partial as ClassSection);
  }

  saveClass(row: ClassSection) {
    return this.classRepo.save(row);
  }

  findClassById(schoolId: string, id: string) {
    return this.classRepo.findOne({ where: { id, schoolId } });
  }

  findClassByIdWithPublicRelations(schoolId: string, id: string) {
    return this.classRepo.findOne({
      where: { id, schoolId },
      relations: ['gradeLevel', 'academicYear', 'homeroomTeacher'],
    });
  }

  async listClassesPaginated(schoolId: string, query: QueryClassesDto) {
    const qb = this.classRepo
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

    return { data, total };
  }

  softRemoveClass(row: ClassSection) {
    return this.classRepo.softRemove(row);
  }
}
