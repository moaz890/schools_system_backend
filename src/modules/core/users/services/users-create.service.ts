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
import { User } from '../entities/user.entity';
import { AppLoggerService } from '../../logger/logger.service';

/**
 * Internal input shape for programmatic user creation (no AuthCaller needed).
 * Used by other modules (teachers, students, parents) that create users on behalf of a school_admin.
 */
export interface CreateUserInternalDto {
    schoolId: string;
    role: Exclude<UserRole, UserRole.SUPER_ADMIN>;
    email: string;
    name: { en: string; ar: string };
    phone?: string;
    nationalId: string;
    nationalIdType?: string;
}

@Injectable()
export class UsersCreateService {
    constructor(
        private readonly dal: UsersDalService,
        private readonly logger: AppLoggerService,
    ) { }

    /**
     * Creates a school admin via the HTTP API (SUPER_ADMIN caller only).
     * Role is taken from dto.role and must not be SUPER_ADMIN.
     */
    async createViaApi(
        dto: CreateUserDto,
        callerId: string,
        callerRole: UserRole,
    ): Promise<{ user: User; plainPassword: string }> {
        if (callerRole !== UserRole.SUPER_ADMIN) {
            this.logger.warn('UsersCreateService', 'Forbidden create attempt', {
                loggerId: 'USER-CREATE-001',
                userId: callerId,
            });
            throw new ForbiddenException(
                'Only super admins can create users directly via this endpoint',
            );
        }
        if (dto.role === UserRole.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot create super_admin users via this endpoint');
        }
        return this.createUser({
            schoolId: dto.schoolId,
            role: dto.role as Exclude<UserRole, UserRole.SUPER_ADMIN>,
            email: dto.email,
            name: dto.name,
            phone: dto.phone,
            nationalId: dto.nationalId,
            nationalIdType: dto.nationalIdType,
        });
    }

    /**
     * Generic user creation — callable by any internal service (teacher, student, parent modules).
     * No AuthCaller check here: the calling module is responsible for access control.
     */
    async createUser(
        dto: CreateUserInternalDto,
    ): Promise<{ user: User; plainPassword: string }> {
        const { schoolId, role, email, nationalId } = dto;

        const existingEmail = await this.dal.findEmailAndSchool(email, schoolId);
        if (existingEmail) {
            this.logger.warn('UsersCreateService', 'Email conflict on user create', {
                loggerId: 'USER-CREATE-002',
                schoolId,
                email,
            });
            throw new ConflictException(
                `Email "${email}" is already in use in this school`,
            );
        }

        const existingNatId = await this.dal.findByNationalId(nationalId);
        if (existingNatId) {
            this.logger.warn('UsersCreateService', 'National ID conflict on user create', {
                loggerId: 'USER-CREATE-003',
                nationalId,
            });
            throw new ConflictException(
                `National ID "${nationalId}" is already registered`,
            );
        }

        // Only enforce one-admin-per-school constraint for SCHOOL_ADMIN role
        if (role === UserRole.SCHOOL_ADMIN) {
            const isSchoolHasAdmin = await this.dal.findActiveSchoolAdmin(schoolId);
            if (isSchoolHasAdmin) {
                throw new ConflictException('School already has a school admin');
            }
        }

        const plainPassword = this.generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const user = new User();
        Object.assign(user, {
            schoolId,
            role,
            email,
            name: dto.name,
            phone: dto.phone ?? null,
            nationalId,
            nationalIdType: dto.nationalIdType ?? 'national_id',
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

                if (code === '23505') {
                    const d = (detail ?? '').toLowerCase();
                    if (d.includes('email')) {
                        throw new ConflictException(`Email "${email}" is already in use in this school`);
                    }
                    if (d.includes('national_id')) {
                        throw new ConflictException(`National ID "${nationalId}" is already registered`);
                    }
                    throw new ConflictException('This user already exists');
                }
                if (code === '23503') {
                    throw new BadRequestException('Invalid `schoolId`. Please select a valid school.');
                }
            }
            throw err;
        }

        this.logger.log('UsersCreateService', 'User created', {
            loggerId: 'USER-CREATE-004',
            userId: saved.id,
            schoolId: saved.schoolId,
            role: saved.role,
        });

        // TODO (Notifications module): Send plainPassword via email/SMS
        return { user: saved, plainPassword };
    }

    async bulkCreate(
        users: CreateUserInternalDto[],
        callerRole?: UserRole,
        callerId?: string,
    ): Promise<{
        created: Array<{ user: User; plainPassword: string }>;
        failed: Array<{ index: number; email: string; reason: string }>;
    }> {
        const created: Array<{ user: User; plainPassword: string }> = [];
        const failed: Array<{ index: number; email: string; reason: string }> = [];

        for (let i = 0; i < users.length; i++) {
            try {
                const result = await this.createUser(users[i]);
                created.push(result);
            } catch (err: any) {
                failed.push({ index: i, email: users[i].email, reason: err?.message ?? 'Unknown error' });
            }
        }

        return { created, failed };
    }

    private generatePassword(length = 10): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        return Array.from({ length }, () =>
            chars[Math.floor(Math.random() * chars.length)],
        ).join('');
    }
}
