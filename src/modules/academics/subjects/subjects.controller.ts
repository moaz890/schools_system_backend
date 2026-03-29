import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { SubjectsService } from './subjects.service';
import { SubjectAssessmentProfilesService } from './subject-assessment-profiles.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectsDto } from './dto/query-subjects.dto';
import { UpsertAssessmentProfileDto } from './dto/upsert-assessment-profile.dto';

@ApiTags('Subjects')
@ApiBearerAuth('access-token')
@Controller('subjects')
export class SubjectsController {
  constructor(
    private readonly service: SubjectsService,
    private readonly assessmentProfiles: SubjectAssessmentProfilesService,
  ) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a subject (school_admin only)' })
  create(@Body() dto: CreateSubjectDto, @CurrentUser() caller: AuthCaller) {
    return this.service.create(dto, caller);
  }

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'List subjects (paginated; optional category, search)',
  })
  list(@Query() query: QuerySubjectsDto, @CurrentUser() caller: AuthCaller) {
    return this.service.list(caller, query);
  }

  @Get(':id/assessment-profile')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'Get default assessment profile (components JSON). 404 until created via PUT.',
  })
  getAssessmentProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.assessmentProfiles.getDefaultProfile(id, caller);
  }

  @Put(':id/assessment-profile')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Create or replace default assessment profile (weights must sum to 100)',
  })
  upsertAssessmentProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertAssessmentProfileDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.assessmentProfiles.upsertDefaultProfile(id, dto, caller);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get one subject' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.get(id, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a subject' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft delete a subject' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.remove(id, caller);
  }
}
