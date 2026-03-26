import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AuthCaller } from './types/auth-caller.type';
import { UsersCreateService } from './services/users-create.service';
import { UsersQueryService } from './services/users-query.service';
import { UsersProfileService } from './services/users-profile.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly createService: UsersCreateService,
        private readonly queryService: UsersQueryService,
        private readonly profileService: UsersProfileService,
    ) {}

    async create(
        dto: CreateUserDto,
        caller: AuthCaller,
    ): Promise<{ user: User; plainPassword: string }> {
        return this.createService.createSchoolAdmin(dto, caller);
    }

    async bulkCreate(
        dto: BulkCreateUsersDto,
        caller: AuthCaller,
    ): Promise<{
        created: Array<{ user: User; plainPassword: string }>;
        failed: Array<{ index: number; email: string; reason: string }>;
    }> {
        return this.createService.bulkCreate(dto, caller);
    }

    async findAll(
        query: QueryUsersDto,
        callerSchoolId: string | null,
        callerRole: UserRole,
    ) {
        return this.queryService.findAll(query, callerSchoolId, callerRole);
    }

    async findOne(id: string, caller?: AuthCaller): Promise<User> {
        return this.queryService.findOne(id, caller);
    }

    async update(id: string, dto: UpdateUserDto, caller: AuthCaller): Promise<User> {
        return this.profileService.update(id, dto, caller);
    }

    async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
        return this.profileService.updateProfile(id, dto);
    }

    async updateAvatar(id: string, avatarUrl: string): Promise<User> {
        return this.profileService.updateAvatar(id, avatarUrl);
    }

    async remove(id: string, caller: AuthCaller): Promise<void> {
        return this.profileService.remove(id, caller);
    }
}
