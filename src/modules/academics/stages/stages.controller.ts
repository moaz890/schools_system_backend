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
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@ApiTags('Stages')
@ApiBearerAuth('access-token')
@Controller('stages')
export class StagesController {
    constructor(private readonly service: StagesService) { }

    // ─── Write endpoints (school_admin only) ──────────────────────────────────

    @Post()
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Create a new stage (school_admin only)' })
    create(@Body() dto: CreateStageDto, @CurrentUser() caller: AuthCaller) {
        return this.service.create(dto, caller);
    }

    @Patch(':id')
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update a stage (school_admin only)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateStageDto,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.service.update(id, dto, caller);
    }

    @Delete(':id')
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Soft delete a stage and its grades (school_admin only)' })
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.service.remove(id, caller);
    }

    // ─── Read endpoints (all authenticated roles) ─────────────────────────────

    @Get()
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'List stages for current school (school_admin only)' })
    list(@CurrentUser() caller: AuthCaller) {
        return this.service.list(caller);
    }

    @Get(':id')
    @Roles(UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get one stage with grade levels (school_admin only)' })
    get(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.service.get(id, caller);
    }
}
