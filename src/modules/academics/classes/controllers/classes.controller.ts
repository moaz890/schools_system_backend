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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { CreateClassDto } from '../dto/create-class.dto';
import { QueryClassesDto } from '../dto/query-classes.dto';
import { UpdateClassDto } from '../dto/update-class.dto';
import { ClassesService } from '../services/classes.service';

@ApiTags('Classes')
@ApiBearerAuth('access-token')
@Controller('classes')
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a class/section (school_admin only)' })
  create(@Body() dto: CreateClassDto, @CurrentUser() caller: AuthCaller) {
    return this.service.create(dto, caller);
  }

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'List classes (filter by grade_level_id/year)' })
  list(@Query() query: QueryClassesDto, @CurrentUser() caller: AuthCaller) {
    return this.service.list(caller, query);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get one class/section' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.get(id, caller);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update class capacity or homeroom teacher' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.update(id, dto, caller);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Soft delete class/section' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.service.remove(id, caller);
  }
}
