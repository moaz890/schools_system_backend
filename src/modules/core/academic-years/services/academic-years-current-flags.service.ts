import { Injectable } from '@nestjs/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { Semester } from '../entities/semester.entity';

@Injectable()
export class AcademicYearsCurrentFlagsService {
  async markCurrentByIds(
    manager: any,
    schoolId: string,
    yearId: string,
    semesterId: string,
  ) {
    await this.unsetCurrentFlagsForSchool(manager, schoolId);
    await this.setAcademicYearCurrent(manager, yearId);
    await this.setSemesterCurrent(manager, semesterId);
  }

  async repairCurrentByNow(manager: any, schoolId: string) {
    const now = new Date();
    const year = await this.findYearByDate(manager, schoolId, now);
    if (!year) return;
    const semester = await this.findSemesterByDate(manager, year.id, now);
    if (!semester) return;
    await this.markCurrentByIds(manager, schoolId, year.id, semester.id);
  }

  async unsetCurrentFlagsForSchool(manager: any, schoolId: string) {
    await manager.query(
      `UPDATE "academic_years"
             SET "is_current" = false
             WHERE "school_id" = $1 AND "deleted_at" IS NULL`,
      [schoolId],
    );
    await manager.query(
      `UPDATE "semesters"
             SET "is_current" = false
             WHERE "deleted_at" IS NULL
             AND "academic_year_id" IN (
                 SELECT "id" FROM "academic_years"
                 WHERE "school_id" = $1 AND "deleted_at" IS NULL
             )`,
      [schoolId],
    );
  }

  async findYearByDate(
    manager: any,
    schoolId: string,
    now: Date,
  ): Promise<AcademicYear | null> {
    return manager
      .getRepository(AcademicYear)
      .createQueryBuilder('y')
      .where('y.schoolId = :schoolId', { schoolId })
      .andWhere('y.startDate <= :now', { now })
      .andWhere('y.endDate >= :now', { now })
      .andWhere('y.deletedAt IS NULL')
      .getOne();
  }

  async findSemesterByDate(
    manager: any,
    yearId: string,
    now: Date,
  ): Promise<Semester | null> {
    return manager
      .getRepository(Semester)
      .createQueryBuilder('s')
      .where('s.academicYearId = :yearId', { yearId })
      .andWhere('s.startDate <= :now', { now })
      .andWhere('s.endDate >= :now', { now })
      .andWhere('s.deletedAt IS NULL')
      .getOne();
  }

  private async setAcademicYearCurrent(manager: any, yearId: string) {
    await manager.query(
      `UPDATE "academic_years"
             SET "is_current" = true
             WHERE "id" = $1 AND "deleted_at" IS NULL`,
      [yearId],
    );
  }

  private async setSemesterCurrent(manager: any, semesterId: string) {
    await manager.query(
      `UPDATE "semesters"
             SET "is_current" = true
             WHERE "id" = $1 AND "deleted_at" IS NULL`,
      [semesterId],
    );
  }
}
