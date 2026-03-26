import {
    ConflictException,
    Injectable,
} from '@nestjs/common';
import { UsersDalService } from './users-dal.service';
import { UsersQueryService } from './users-query.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { AuthCaller } from '../types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { AppLoggerService } from '../../logger/logger.service';

@Injectable()
export class UsersProfileService {
    constructor(
        private readonly dal: UsersDalService,
        private readonly query: UsersQueryService,
        private readonly logger: AppLoggerService,
    ) {}

    async update(id: string, dto: UpdateUserDto, caller: AuthCaller) {
        const user = await this.query.findOne(id, caller);

        if (dto.email && dto.email !== user.email) {
            // Unique email constraint is scoped to school, so we check within the same school.
            const clash = await this.dal.findEmailAndSchool(dto.email, user.schoolId as any);
            if (clash && clash.id !== id) {
                throw new ConflictException(
                    `Email "${dto.email}" is already in use in this school`,
                );
            }
        }

        const patch: Record<string, unknown> = { ...dto };
        if (caller.role === UserRole.SCHOOL_ADMIN) {
            delete patch.role;
        }

        await this.dal.updateById(id, patch);
        return this.query.findOne(id, caller);
    }

    async updateProfile(id: string, dto: UpdateProfileDto) {
        await this.query.findOne(id);
        await this.dal.updateById(id, dto as any);
        return this.query.findOne(id);
    }

    async updateAvatar(id: string, avatarUrl: string) {
        await this.query.findOne(id);
        await this.dal.updateById(id, { avatarUrl } as any);
        return this.query.findOne(id);
    }

    async remove(id: string, caller: AuthCaller): Promise<void> {
        const user = await this.query.findOne(id, caller);
        await this.dal.softRemove(user);
        this.logger.log('UsersService', 'User soft deleted', {
            loggerId: 'USER-DELETE-001',
            userId: id,
            schoolId: user.schoolId,
            actorUserId: caller.id,
        });
    }
}

