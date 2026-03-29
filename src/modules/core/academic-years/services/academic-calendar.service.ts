import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semester } from '../entities/semester.entity';
import { AcademicYear } from '../entities/academic-year.entity';

@Injectable()
export class AcademicCalendarService {
  constructor(
    @InjectRepository(AcademicYear)
    private readonly yearsRepo: Repository<AcademicYear>,
    @InjectRepository(Semester)
    private readonly semestersRepo: Repository<Semester>,
  ) {}

  async getCurrentSemester(schoolId: string, now = new Date()) {
    const year = await this.findYearByDate(schoolId, now);
    if (!year) return null;
    return this.findSemesterByDate(year.id, now);
  }

  private async findYearByDate(
    schoolId: string,
    now: Date,
  ): Promise<AcademicYear | null> {
    return this.yearsRepo
      .createQueryBuilder('y')
      .where('y.schoolId = :schoolId', { schoolId })
      .andWhere('y.startDate <= :now', { now })
      .andWhere('y.endDate >= :now', { now })
      .andWhere('y.deletedAt IS NULL')
      .orderBy('y.startDate', 'DESC')
      .getOne();
  }

  private async findSemesterByDate(
    yearId: string,
    now: Date,
  ): Promise<Semester | null> {
    return this.semestersRepo
      .createQueryBuilder('s')
      .where('s.academicYearId = :yearId', { yearId })
      .andWhere('s.startDate <= :now', { now })
      .andWhere('s.endDate >= :now', { now })
      .andWhere('s.deletedAt IS NULL')
      .orderBy('s.startDate', 'ASC')
      .getOne();
  }
}
