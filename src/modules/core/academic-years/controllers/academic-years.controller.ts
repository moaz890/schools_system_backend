import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { AcademicYearsService } from '../services/academic-years.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@ApiTags('Academic Years')
@ApiBearerAuth('access-token')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create academic year (and optionally semesters)' })
  create(
    @Body() dto: CreateAcademicYearDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.create(dto, caller);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List academic years for current scope' })
  list(@CurrentUser() caller: AuthCaller) {
    return this.service.list(caller);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get academic year by id' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.get(id, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update academic year' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicYearDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft delete academic year' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.remove(id, caller);
  }

  @Patch(':id/set-current')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Mark academic year as current (and current semester by date)',
  })
  setCurrent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.setCurrentYear(id, caller);
  }
}
