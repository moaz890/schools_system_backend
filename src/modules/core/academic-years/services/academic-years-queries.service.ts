import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { Semester } from '../entities/semester.entity';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';

@Injectable()
export class AcademicYearsQueriesService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly yearsRepo: Repository<AcademicYear>,
    @InjectRepository(Semester)
    private readonly semestersRepo: Repository<Semester>,
  ) {}

  async listYears(caller: AuthCaller, schoolId?: string) {
    const where =
      caller.role === UserRole.SUPER_ADMIN && schoolId
        ? { schoolId }
        : caller.role === UserRole.SUPER_ADMIN
          ? {}
          : { schoolId: this.requireCallerSchoolId(caller) };

    return this.yearsRepo.find({
      where: where as any,
      order: { startDate: 'DESC' },
    });
  }

  async getYear(id: string, caller: AuthCaller) {
    const year = await this.yearsRepo.findOne({
      where: {
        id,
        ...(caller.role === UserRole.SUPER_ADMIN
          ? {}
          : { schoolId: this.requireCallerSchoolId(caller) }),
      },
      relations: ['semesters'],
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async listSemesters(yearId: string, caller: AuthCaller) {
    const year = await this.yearsRepo.findOne({
      where: {
        id: yearId,
        ...(caller.role === UserRole.SUPER_ADMIN
          ? {}
          : { schoolId: this.requireCallerSchoolId(caller) }),
      } as any,
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return this.semestersRepo.find({
      where: { academicYearId: yearId },
      order: { startDate: 'ASC' },
    });
  }

  private requireCallerSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new Error('School admin has no schoolId in session');
    }
    return caller.schoolId;
  }
}
