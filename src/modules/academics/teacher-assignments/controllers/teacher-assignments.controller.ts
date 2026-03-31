import {
  Body,
  Controller,
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
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { CreateTeacherAssignmentDto } from '../dto/create-teacher-assignment.dto';
import { EndTeacherAssignmentDto } from '../dto/end-teacher-assignment.dto';
import { TeacherAssignmentsService } from '../services/teacher-assignments.service';

@ApiTags('Teacher Assignments')
@ApiBearerAuth('access-token')
@Controller('teacher-assignments')
export class TeacherAssignmentsController {
  constructor(private readonly service: TeacherAssignmentsService) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'Assign a teacher to teach a subject in a class (curriculum + specialization required)',
  })
  create(
    @Body() dto: CreateTeacherAssignmentDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.create(dto, caller);
  }

  @Patch(':id/end')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'End an active teacher assignment (keeps history)' })
  end(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndTeacherAssignmentDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.end(id, dto, caller);
  }

  @Get('classes/:classId')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List teacher assignments for a class (all statuses)' })
  listForClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.listForClass(classId, caller);
  }
}
