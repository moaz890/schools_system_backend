import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { AcademicYearsService } from '../services/academic-years.service';
import { CreateSemesterDto } from '../dto/create-semester.dto';

@ApiTags('Academic Year Semesters')
@ApiBearerAuth('access-token')
@Controller('academic-years')
export class AcademicYearSemestersController {
    constructor(private readonly service: AcademicYearsService) {}

    @Post(':yearId/semesters')
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create a semester inside an academic year' })
    create(
        @Param('yearId', ParseUUIDPipe) yearId: string,
        @Body() dto: CreateSemesterDto,
        @CurrentUser() caller: AuthCaller,
    ) {
        if (dto.academicYearId !== yearId) {
            throw new BadRequestException(
                'academicYearId in body must match yearId in route',
            );
        }
        return this.service.createSemester(yearId, dto, caller);
    }

    @Get(':yearId/semesters')
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'List semesters for an academic year' })
    list(
        @Param('yearId', ParseUUIDPipe) yearId: string,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.service.listSemesters(yearId, caller);
    }
}

