import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from '../users/types/auth-caller.type';

/**
 * Lists refresh-token sessions for a user (device / IP tracking).
 * @see map/1.2-user-management-system.md — multi-device session tracking
 */
@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('users')
export class UserSessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get(':id/sessions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @ApiOperation({
    summary: 'List sessions for a user',
    description:
      'Super admin: any user. School admin: users in their school only. Others: only their own user id.',
  })
  listForUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() caller: AuthCaller,
  ) {
    return this.sessionsService.listSessionsForUser(id, caller);
  }
}
