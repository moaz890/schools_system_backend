import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { EnrollmentsService } from '../services/enrollments.service';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';

@ApiTags('Enrollments')
@ApiBearerAuth('access-token')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Enroll a student into a class (Phase 2 core)' })
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() caller: AuthCaller) {
    return this.service.create(dto, caller);
  }

  @Get('classes/:classId')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List active students in a class' })
  listActiveStudents(
    @Param('classId', ParseUUIDPipe) classId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.listActiveStudentsForClass(classId, caller);
  }

  @Get('students/:studentId')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List a student enrollment history' })
  listStudentEnrollments(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.listStudentEnrollments(studentId, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update enrollment status (school_admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.update(id, dto, caller);
  }
}
