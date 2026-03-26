import { Injectable } from '@nestjs/common';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';
import { CreateSemesterDto } from '../dto/create-semester.dto';
import { UpdateSemesterDto } from '../dto/update-semester.dto';
import { AcademicYearsCommandsService } from './academic-years-commands.service';
import { AcademicYearsQueriesService } from './academic-years-queries.service';
import { AcademicCalendarService } from './academic-calendar.service';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import type { AcademicYear } from '../entities/academic-year.entity';
import type { Semester } from '../entities/semester.entity';

@Injectable()
export class AcademicYearsService {
    constructor(
        private readonly commands: AcademicYearsCommandsService,
        private readonly queries: AcademicYearsQueriesService,
        private readonly calendar: AcademicCalendarService,
    ) {}

    create(dto: CreateAcademicYearDto, caller: AuthCaller) {
        return this.commands.createYear(dto, caller);
    }

    list(caller: AuthCaller) {
        return this.queries.listYears(caller);
    }

    get(id: string, caller: AuthCaller) {
        return this.queries.getYear(id, caller);
    }

    update(id: string, dto: UpdateAcademicYearDto, caller: AuthCaller) {
        return this.commands.updateYear(id, dto, caller);
    }

    remove(id: string, caller: AuthCaller) {
        return this.commands.removeYear(id, caller);
    }

    setCurrentYear(id: string, caller: AuthCaller) {
        return this.commands.setCurrentAcademicYear(id, caller);
    }

    createSemester(yearId: string, dto: CreateSemesterDto, caller: AuthCaller) {
        return this.commands.createSemester(yearId, dto, caller);
    }

    listSemesters(yearId: string, caller: AuthCaller) {
        return this.queries.listSemesters(yearId, caller);
    }

    updateSemester(semesterId: string, dto: UpdateSemesterDto, caller: AuthCaller) {
        return this.commands.updateSemester(semesterId, dto, caller);
    }

    removeSemester(semesterId: string, caller: AuthCaller) {
        return this.commands.removeSemester(semesterId, caller);
    }

    setCurrentSemester(semesterId: string, caller: AuthCaller) {
        return this.commands.setCurrentSemester(semesterId, caller);
    }

    getCurrentSemester(schoolId: string) {
        return this.calendar.getCurrentSemester(schoolId);
    }
}

