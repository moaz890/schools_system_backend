import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UpsertTeacherSpecializationDto } from '../dto/upsert-teacher-specialization.dto';
import { TeacherSpecializationsService } from '../services/teacher-specializations.service';

@ApiTags('Teacher Specializations')
@ApiBearerAuth('access-token')
@Controller('teacher-specializations')
export class TeacherSpecializationsController {
  constructor(private readonly service: TeacherSpecializationsService) {}

  @Put(':teacherId/:subjectId')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'Upsert a teacher specialization for a subject (optionally stage-limited)',
  })
  upsert(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Body() dto: UpsertTeacherSpecializationDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    if (dto.teacherId && dto.teacherId !== teacherId) {
      throw new BadRequestException('Body teacherId must match URL teacherId');
    }
    if (dto.subjectId && dto.subjectId !== subjectId) {
      throw new BadRequestException('Body subjectId must match URL subjectId');
    }
    return this.service.upsert(dto, caller);
  }

  @Get('teachers/:teacherId/subjects')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'List subjects a teacher is specialized in (includes allowedStageIds)',
  })
  listTeacherSubjects(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.listSubjectsForTeacher(teacherId, caller);
  }

  @Get(':subjectId/teachers')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'List teachers eligible to teach a subject (optionally filter by stageId)',
  })
  listEligibleTeachers(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Query('stageId') stageId: string | undefined,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.listEligibleTeachersForSubject(
      subjectId,
      stageId,
      caller,
    );
  }
}
