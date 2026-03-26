import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersDalService } from './users-dal.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { AuthCaller } from '../types/auth-caller.type';
import { User } from '../entities/user.entity';
import { AppLoggerService } from '../../logger/logger.service';

@Injectable()
export class UsersCreateService {
    constructor(
        private readonly dal: UsersDalService,
        private readonly logger: AppLoggerService,
    ) {}

    async createSchoolAdmin(
        dto: CreateUserDto,
        caller: AuthCaller,
    ): Promise<{ user: User; plainPassword: string }> {
        if (caller.role !== UserRole.SUPER_ADMIN) {
            this.logger.warn('UsersCreateService', 'Forbidden create attempt', {
                loggerId: 'USER-CREATE-001',
                userId: caller.id,
                schoolId: caller.schoolId,
                role: caller.role,
            });
            throw new ForbiddenException(
                'Only super admins can create users here; other roles are created in their own modules',
            );
        }

        const assignedSchoolId = dto.schoolId;

        const existingEmail = await this.dal.findEmailAndSchool(dto.email, assignedSchoolId);
        if (existingEmail) {
            this.logger.warn('UsersCreateService', 'Email conflict on user create', {
                loggerId: 'USER-CREATE-002',
                schoolId: assignedSchoolId,
                email: dto.email,
            });
            throw new ConflictException(
                `Email "${dto.email}" is already in use in this school`,
            );
        }

        const existingNatId = await this.dal.findByNationalId(dto.nationalId);
        if (existingNatId) {
            this.logger.warn('UsersCreateService', 'National ID conflict on user create', {
                loggerId: 'USER-CREATE-003',
                nationalId: dto.nationalId,
            });
            throw new ConflictException(
                `National ID "${dto.nationalId}" is already registered`,
            );
        }

        const isSchoolHasAdmin = await this.dal.findActiveSchoolAdmin(assignedSchoolId);
        if (isSchoolHasAdmin) {
            throw new ConflictException('School already has a school admin');
        }

        const plainPassword = this.generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const user = new User();
        Object.assign(user, dto, {
            schoolId: assignedSchoolId,
            role: UserRole.SCHOOL_ADMIN,
            passwordHash,
        });

        let saved: User;
        try {
            saved = await this.dal.save(user);
        } catch (err: unknown) {
            if (err instanceof QueryFailedError) {
                const driverErr: any = (err as any).driverError ?? err;
                const code: string | undefined = driverErr?.code;
                const detail: string | undefined = driverErr?.detail;

                // 23505 = unique_violation
                if (code === '23505') {
                    const d = (detail ?? '').toLowerCase();
                    if (d.includes('email')) {
                        throw new ConflictException(
                            `Email "${dto.email}" is already in use in this school`,
                        );
                    }
                    if (d.includes('national_id')) {
                        throw new ConflictException(
                            `National ID "${dto.nationalId}" is already registered`,
                        );
                    }
                    throw new ConflictException('This user already exists');
                }

                // 23503 = foreign_key_violation
                if (code === '23503') {
                    throw new BadRequestException(
                        'Invalid `schoolId`. Please select a valid school.',
                    );
                }
            }
            throw err;
        }

        this.logger.log('UsersCreateService', 'School admin created', {
            loggerId: 'USER-CREATE-004',
            userId: saved.id,
            schoolId: saved.schoolId,
        });

        // TODO (Week 6 — Notifications): Send plainPassword via email/SMS
        return { user: saved, plainPassword };
    }

    async bulkCreate(
        dto: { users: CreateUserDto[] },
        caller: AuthCaller,
    ): Promise<{
        created: Array<{ user: User; plainPassword: string }>;
        failed: Array<{ index: number; email: string; reason: string }>;
    }> {
        // NOTE: BulkCreateUsersDto wraps `users`, but we accept the narrow shape for reuse.
        const created: Array<{ user: User; plainPassword: string }> = [];
        const failed: Array<{ index: number; email: string; reason: string }> = [];

        for (let i = 0; i < dto.users.length; i++) {
            try {
                const result = await this.createSchoolAdmin(dto.users[i], caller);
                created.push(result);
            } catch (err: any) {
                failed.push({
                    index: i,
                    email: dto.users[i].email,
                    reason: err?.message ?? 'Unknown error',
                });
            }
        }

        return { created, failed };
    }

    private generatePassword(length = 10): string {
        const chars =
            'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        return Array.from({ length }, () =>
            chars[Math.floor(Math.random() * chars.length)],
        ).join('');
    }
}

