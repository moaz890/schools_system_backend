import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SchoolStrategiesService } from './school-strategies.service';
import { UpdateSchoolStrategyDto } from './dto/update-school-strategy.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../users/types/auth-caller.type';

@ApiTags('School Strategy')
@ApiBearerAuth('access-token')
@Controller('school-strategies')
@Roles(UserRole.SCHOOL_ADMIN)
export class SchoolStrategiesController {
    constructor(private readonly service: SchoolStrategiesService) { }

    @Get()
    @ApiOperation({
        summary: "Get the caller's school strategy",
        description: 'Returns grading, exam, and promotion policies configured for this school.',
    })
    get(@CurrentUser() caller: AuthCaller) {
        return this.service.findForCaller(caller);
    }

    @Patch()
    @ApiOperation({
        summary: "Update the caller's school strategy",
        description: 'Patch any subset of strategy fields. All fields are optional.',
    })
    update(
        @Body() dto: UpdateSchoolStrategyDto,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.service.updateForCaller(dto, caller);
    }
}
