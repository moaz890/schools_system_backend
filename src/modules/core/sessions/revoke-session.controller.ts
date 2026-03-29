import { Controller, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../users/types/auth-caller.type';

/**
 * Revoke a single refresh-token session (e.g. lost device).
 * @see map/1.2-user-management-system.md
 */
@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
export class RevokeSessionController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Delete(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'Revoke a session',
    description:
      'Owner can revoke own session; super admin any; school admin sessions in their school.',
  })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.sessionsService.revokeSession(id, caller);
  }
}
