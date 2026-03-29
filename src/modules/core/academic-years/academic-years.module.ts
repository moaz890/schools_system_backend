import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicYear } from './entities/academic-year.entity';
import { Semester } from './entities/semester.entity';
import { AcademicYearsService } from './services/academic-years.service';
import { AcademicCalendarService } from './services/academic-calendar.service';
import { AcademicYearsCommandsService } from './services/academic-years-commands.service';
import { AcademicYearsQueriesService } from './services/academic-years-queries.service';
import { AcademicYearsController } from './controllers/academic-years.controller';
import { AcademicYearSemestersController } from './controllers/academic-year-semesters.controller';
import { SemestersController } from './controllers/semesters.controller';
import { AcademicYearsCurrentFlagsService } from './services/academic-years-current-flags.service';
import { AcademicYearsWriterDalService } from './services/academic-years-writer-dal.service';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicYear, Semester])],
  controllers: [
    AcademicYearsController,
    AcademicYearSemestersController,
    SemestersController,
  ],
  providers: [
    AcademicYearsService,
    AcademicYearsCommandsService,
    AcademicYearsQueriesService,
    AcademicCalendarService,
    AcademicYearsCurrentFlagsService,
    AcademicYearsWriterDalService,
  ],
  exports: [AcademicYearsService, AcademicCalendarService],
})
export class AcademicYearsModule {}
