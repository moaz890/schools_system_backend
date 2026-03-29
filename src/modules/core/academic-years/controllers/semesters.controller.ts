import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../users/types/auth-caller.type';
import { AcademicYearsService } from '../services/academic-years.service';
import { UpdateSemesterDto } from '../dto/update-semester.dto';

@ApiTags('Semesters')
@ApiBearerAuth('access-token')
@Controller('semesters')
export class SemestersController {
  constructor(private readonly service: AcademicYearsService) {}

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update semester (dates/names)' })
  update(
    @Param('id', ParseUUIDPipe) semesterId: string,
    @Body() dto: UpdateSemesterDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.updateSemester(semesterId, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft delete a semester' })
  remove(
    @Param('id', ParseUUIDPipe) semesterId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.removeSemester(semesterId, caller);
  }

  @Patch(':id/set-current')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Manually mark a semester as current' })
  setCurrent(
    @Param('id', ParseUUIDPipe) semesterId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.setCurrentSemester(semesterId, caller);
  }
}
