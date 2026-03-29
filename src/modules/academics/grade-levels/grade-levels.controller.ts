import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { GradeLevelsService } from './grade-levels.service';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';

@ApiTags('Grade Levels')
@ApiBearerAuth('access-token')
@Controller('grade-levels')
export class GradeLevelsController {
  constructor(private readonly service: GradeLevelsService) {}

  // ─── Write endpoints (school_admin only) ──────────────────────────────────

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Create a grade level (school_admin only, auto-named for non-KG)',
  })
  create(@Body() dto: CreateGradeLevelDto, @CurrentUser() caller: AuthCaller) {
    return this.service.create(dto, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update a grade level (school_admin only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeLevelDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft delete a grade level (school_admin only)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.remove(id, caller);
  }

  // ─── Read endpoints (all authenticated roles) ─────────────────────────────

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary:
      'List grade levels, optionally filter by stage_id (school_admin only)',
  })
  @ApiQuery({ name: 'stage_id', required: false, type: String })
  list(@CurrentUser() caller: AuthCaller, @Query('stage_id') stageId?: string) {
    return this.service.list(caller, stageId);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get one grade level (school_admin only)' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.get(id, caller);
  }
}
