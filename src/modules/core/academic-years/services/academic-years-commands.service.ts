import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AcademicYear } from '../entities/academic-year.entity';
import { Semester } from '../entities/semester.entity';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import type { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';
import type { CreateSemesterDto } from '../dto/create-semester.dto';
import type { CreateSemesterInAcademicYearDto } from '../dto/create-semester-in-academic-year.dto';
import type { UpdateSemesterDto } from '../dto/update-semester.dto';
import { AcademicYearsCurrentFlagsService } from './academic-years-current-flags.service';
import { AcademicYearsWriterDalService } from './academic-years-writer-dal.service';

type Scope = { schoolId?: string };

@Injectable()
export class AcademicYearsCommandsService {
    constructor(
        @InjectRepository(AcademicYear)
        private readonly yearsRepo: Repository<AcademicYear>,
        @InjectRepository(Semester)
        private readonly semestersRepo: Repository<Semester>,
        private readonly flags: AcademicYearsCurrentFlagsService,
        private readonly writerDal: AcademicYearsWriterDalService,
    ) {}

    async createYear(dto: CreateAcademicYearDto, caller: AuthCaller) {
        const scope = this.scopeForCreate(dto.schoolId, caller);
        this.assertYearRange(dto.startDate, dto.endDate);
        this.assertAllowedCreationYear(dto.startDate);
        return this.yearsRepo.manager.transaction(async (manager) => {
            await this.assertNoAcademicYearOverlap(
                manager,
                scope.schoolId!,
                dto.startDate,
                dto.endDate,
            );
            const year = await this.insertYear(manager, scope.schoolId!, dto);
            if (dto.semesters?.length) {
                await this.insertSemesters(manager, year.id, dto.semesters);
                await this.flags.repairCurrentByNow(manager, year.schoolId);
            }
            return year;
        });
    }

    async updateYear(id: string, dto: UpdateAcademicYearDto, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const year = await this.writerDal.findYearForWrite(
                manager,
                id,
                scope.schoolId!,
            );
            const next = this.applyYearPatch(year, dto);
            this.assertYearRange(next.startDate, next.endDate);
            await this.assertNoAcademicYearOverlap(
                manager,
                scope.schoolId!,
                next.startDate,
                next.endDate,
                id,
            );
            await this.writerDal.ensureSemestersFit(
                manager,
                year.id,
                next.startDate,
                next.endDate,
            );
            await manager.getRepository(AcademicYear).update({ id }, next);
            await this.flags.repairCurrentByNow(manager, year.schoolId);
            return this.writerDal.findYearForRead(
                manager,
                id,
                scope.schoolId!,
            );
        });
    }

    async removeYear(id: string, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const year = await this.writerDal.findYearForWrite(
                manager,
                id,
                scope.schoolId!,
            );
            await this.flags.unsetCurrentFlagsForSchool(manager, year.schoolId);
            await manager.getRepository(AcademicYear).softRemove(year);
            await this.flags.repairCurrentByNow(manager, year.schoolId);
        });
    }

    async setCurrentAcademicYear(id: string, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const year = await this.writerDal.findYearForWrite(
                manager,
                id,
                scope.schoolId!,
            );
            const now = new Date();
            const semester = await this.flags.findSemesterByDate(manager, year.id, now);
            if (!semester) throw new BadRequestException('No semester matches today');
            await this.flags.markCurrentByIds(
                manager,
                year.schoolId,
                year.id,
                semester.id,
            );
            return year;
        });
    }

    async createSemester(yearId: string, dto: CreateSemesterDto, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        this.assertSemesterRange(dto.startDate, dto.endDate);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const year = await this.writerDal.findYearForWrite(
                manager,
                yearId,
                scope.schoolId!,
            );
            this.assertSemesterWithinYear(year, dto.startDate, dto.endDate);
            await this.assertNoSemesterOverlap(manager, year.id, dto.startDate, dto.endDate);

            const saved = await manager.getRepository(Semester).save(
                manager.getRepository(Semester).create({
                    academicYearId: year.id,
                    name: dto.name,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    isCurrent: false,
                } as any),
            );
            const semester = (Array.isArray(saved) ? saved[0] : saved) as Semester;

            if (this.nowInRange(new Date(), dto.startDate, dto.endDate)) {
                await this.flags.markCurrentByIds(
                    manager,
                    year.schoolId,
                    year.id,
                    semester.id,
                );
            }

            return semester;
        });
    }

    async updateSemester(semesterId: string, dto: UpdateSemesterDto, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const semester = await this.writerDal.findSemesterForWrite(
                manager,
                semesterId,
                scope.schoolId!,
            );
            const next = this.applySemesterPatch(semester, dto);
            this.assertSemesterRange(next.startDate, next.endDate);

            const year = await this.writerDal.findYearForWrite(
                manager,
                next.academicYearId,
                scope.schoolId!,
            );
            this.assertSemesterWithinYear(year, next.startDate, next.endDate);
            await this.assertNoSemesterOverlap(
                manager,
                year.id,
                next.startDate,
                next.endDate,
                semesterId,
            );

            if (dto.isCurrent === true) {
                this.assertSemesterContainsNowForMarkCurrent(
                    next.startDate,
                    next.endDate,
                );
            }

            await manager.getRepository(Semester).update({ id: semesterId }, next);
            if (dto.isCurrent === true) {
                await this.flags.markCurrentByIds(
                    manager,
                    year.schoolId,
                    year.id,
                    semesterId,
                );
            } else {
                await this.flags.repairCurrentByNow(manager, year.schoolId);
            }
            return manager.getRepository(Semester).findOne({ where: { id: semesterId } });
        });
    }

    async removeSemester(semesterId: string, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const semester = await this.writerDal.findSemesterForWrite(
                manager,
                semesterId,
                scope.schoolId!,
            );
            const yearSchoolId = semester.academicYear?.schoolId ?? semester.academicYearId;
            await manager.getRepository(Semester).softRemove(semester);
            await this.flags.repairCurrentByNow(manager, yearSchoolId as any);
        });
    }

    async setCurrentSemester(semesterId: string, caller: AuthCaller) {
        const scope = this.scopeForNonSuperAdmin(caller);
        return this.yearsRepo.manager.transaction(async (manager) => {
            const semester = await this.writerDal.findSemesterForWrite(
                manager,
                semesterId,
                scope.schoolId!,
            );
            this.assertSemesterContainsNowForMarkCurrent(
                semester.startDate,
                semester.endDate,
            );
            const schoolId = semester.academicYear!.schoolId;
            await this.flags.markCurrentByIds(
                manager,
                schoolId,
                semester.academicYearId,
                semester.id,
            );
            return semester;
        });
    }

    private scopeForCreate(explicitSchoolId: string | undefined, caller: AuthCaller): Scope {
        if (caller.role === UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Super admin cannot create academic years/semesters');
        }
        if (!caller.schoolId) throw new BadRequestException('You must be assigned to a school');
        if (explicitSchoolId !== caller.schoolId) throw new ForbiddenException("You only can create academic years for your school")
        return { schoolId: caller.schoolId };
    }

    private scopeForNonSuperAdmin(caller: AuthCaller): Scope {
        if (caller.role === UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Super admin cannot modify academic years/semesters');
        }
        if (!caller.schoolId) {
            throw new BadRequestException('You must be assigned to a school');
        }
        return { schoolId: caller.schoolId };
    }

    private nowInRange(now: Date, start: Date, end: Date) {
        return start <= now && now <= end;
    }

    /** Today must fall inside the semester range (inclusive) to mark it current. */
    private assertSemesterContainsNowForMarkCurrent(startDate: Date, endDate: Date) {
        const now = new Date();
        if (now < startDate) {
            throw new BadRequestException(
                'Cannot mark this semester as current: the current date is before the semester start date.',
            );
        }
        if (now > endDate) {
            throw new BadRequestException(
                'Cannot mark this semester as current: the current date is after the semester end date.',
            );
        }
    }

    private assertYearRange(start: Date, end: Date) {
        if (start >= end) throw new BadRequestException('startDate must be before endDate');
    }

    private assertSemesterRange(start: Date, end: Date) {
        if (start >= end) throw new BadRequestException('startDate must be before endDate');
    }

    private getNowYear() {
        return new Date().getUTCFullYear();
    }

    private formatAcademicYear(startYear: number) {
        return `${startYear}/${startYear + 1}`;
    }

    private assertAllowedCreationYear(startDate: Date) {
        const nowYear = this.getNowYear();
        const startYear = startDate.getUTCFullYear();
        const allowedA = nowYear - 1;
        const allowedB = nowYear;
        if (startYear !== allowedA && startYear !== allowedB) {
            throw new BadRequestException(
                `Only ${this.formatAcademicYear(allowedA)} or ${this.formatAcademicYear(allowedB)} can be created`,
            );
        }
    }

    private assertSemesterWithinYear(year: AcademicYear, start: Date, end: Date) {
        if (start < year.startDate || end > year.endDate) {
            throw new BadRequestException('Semester dates must be within the academic year');
        }
    }

    private applyYearPatch(year: AcademicYear, dto: UpdateAcademicYearDto) {
        const next: any = {};
        next.name = dto.name ?? year.name;
        next.startDate = dto.startDate ?? year.startDate;
        next.endDate = dto.endDate ?? year.endDate;
        return next;
    }

    private applySemesterPatch(semester: Semester, dto: UpdateSemesterDto) {
        const next: any = {};
        next.name = dto.name ?? (semester as any).name;
        next.startDate = dto.startDate ?? semester.startDate;
        next.endDate = dto.endDate ?? semester.endDate;
        next.academicYearId = semester.academicYearId;
        return next;
    }

    private async insertYear(
        manager: any,
        schoolId: string,
        dto: CreateAcademicYearDto,
    ): Promise<AcademicYear> {
        return manager.getRepository(AcademicYear).save(
            manager.getRepository(AcademicYear).create({
                schoolId,
                name: dto.name,
                startDate: dto.startDate,
                endDate: dto.endDate,
                isCurrent: false,
            } as any),
        );
    }

    private async insertSemesters(
        manager: any,
        yearId: string,
        semesters: CreateSemesterInAcademicYearDto[],
    ) {
        this.assertNoOverlapInNewSemesters(semesters);
        semesters.forEach((s) => this.assertSemesterRange(s.startDate, s.endDate));
        await this.assertNewSemestersWithinYear(manager, yearId, semesters);
        const repo = manager.getRepository(Semester);
        const payload = semesters.map((s) => ({
            academicYearId: yearId,
            name: s.name,
            startDate: s.startDate,
            endDate: s.endDate,
            isCurrent: false,
        }));
        await repo.save(payload);
    }

    private async assertNewSemestersWithinYear(
        manager: any,
        yearId: string,
        semesters: CreateSemesterInAcademicYearDto[],
    ) {
        const year = await manager.getRepository(AcademicYear).findOne({ where: { id: yearId } as any });
        if (!year) throw new NotFoundException('Academic year not found');
        semesters.forEach((s) => this.assertSemesterWithinYear(year, s.startDate, s.endDate));
    }

    private assertNoOverlapInNewSemesters(semesters: { startDate: Date; endDate: Date }[]) {
        const sorted = [...semesters].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].startDate < sorted[i - 1].endDate) {
                throw new BadRequestException('Semesters within the same year must not overlap');
            }
        }
    }

    /**
     * Prevents overlapping academic years inside the same school (tenant).
     *
     * Overlap rule (inclusive):
     * - existing.start < newEnd AND existing.end > newStart
     */
    private async assertNoAcademicYearOverlap(
        manager: any,
        schoolId: string,
        startDate: Date,
        endDate: Date,
        ignoreYearId?: string,
    ) {
        const qb = manager
            .getRepository(AcademicYear)
            .createQueryBuilder('y')
            .where('y.schoolId = :schoolId', { schoolId })
            .andWhere('y.deletedAt IS NULL')
            .andWhere('y.startDate < :endDate', { endDate })
            .andWhere('y.endDate > :startDate', { startDate });

        if (ignoreYearId) {
            qb.andWhere('y.id != :ignoreYearId', { ignoreYearId });
        }

        const clash = await qb.getOne();
        if (clash) {
            throw new BadRequestException(
                'Academic year dates must not overlap with an existing academic year',
            );
        }
    }

    private async assertNoSemesterOverlap(
        manager: any,
        academicYearId: string,
        startDate: Date,
        endDate: Date,
        ignoreId?: string,
    ) {
        const qb = manager
            .getRepository(Semester)
            .createQueryBuilder('s')
            .where('s.academicYearId = :academicYearId', { academicYearId })
            .andWhere('s.startDate < :endDate', { endDate })
            .andWhere('s.endDate > :startDate', { startDate })
            .andWhere('s.deletedAt IS NULL');
        if (ignoreId) qb.andWhere('s.id != :ignoreId', { ignoreId });
        const clash = await qb.getOne();
        if (clash) throw new BadRequestException('Semesters must not overlap');
    }

}

