import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { GradeLevelsService } from '../grade-levels/grade-levels.service';

@ApiTags('Stages')
@ApiBearerAuth('access-token')
@Controller('stages')
export class StageGradeLevelsController {
  constructor(private readonly gradeLevelsService: GradeLevelsService) {}

  @Get(':id/grade-levels')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Get grade levels for a specific stage (school_admin only)',
  })
  getGradeLevels(
    @Param('id', ParseUUIDPipe) stageId: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.gradeLevelsService.listByStage(stageId, caller);
  }
}
