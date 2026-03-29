import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { Semester } from '../entities/semester.entity';
import type { AuthCaller } from '../../users/types/auth-caller.type';

@Injectable()
export class AcademicYearsWriterDalService {
  async ensureSemestersFit(
    manager: any,
    yearId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const semesters = await manager.getRepository(Semester).find({
      where: { academicYearId: yearId } as any,
    });
    for (const s of semesters) {
      if (s.startDate < startDate || s.endDate > endDate) {
        throw new BadRequestException(
          'Existing semesters must stay within the academic year',
        );
      }
    }
  }

  async findYearForWrite(manager: any, yearId: string, schoolId: string) {
    const year = await manager.getRepository(AcademicYear).findOne({
      where: { id: yearId, schoolId } as any,
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async findYearForRead(manager: any, yearId: string, schoolId: string) {
    const year = await manager.getRepository(AcademicYear).findOne({
      where: { id: yearId, schoolId } as any,
      relations: ['semesters'],
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async findSemesterForWrite(
    manager: any,
    semesterId: string,
    schoolId: string,
  ) {
    const semester = await manager.getRepository(Semester).findOne({
      where: { id: semesterId } as any,
      relations: ['academicYear'],
    });
    const isAllowed = semester?.academicYear?.schoolId === schoolId;
    if (!semester || !isAllowed)
      throw new NotFoundException('Semester not found');
    return semester;
  }
}
