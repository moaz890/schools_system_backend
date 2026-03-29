import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersDalService } from './users-dal.service';
import { QueryUsersDto } from '../dto/query-users.dto';
import { User } from '../entities/user.entity';
import { AuthCaller } from '../types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';

@Injectable()
export class UsersQueryService {
  constructor(private readonly dal: UsersDalService) {}

  async findAll(
    query: QueryUsersDto,
    callerSchoolId: string | null,
    callerRole: UserRole,
  ): Promise<{ data: User[]; meta: any }> {
    return this.dal.list(query, callerSchoolId, callerRole);
  }

  async findOne(id: string, caller?: AuthCaller): Promise<User> {
    const user = await this.dal.findUserSelectableById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (caller) {
      if (
        caller.role !== UserRole.SUPER_ADMIN &&
        user.schoolId !== caller.schoolId
      ) {
        throw new NotFoundException(`User #${id} not found`);
      }
    }

    return user;
  }
}
