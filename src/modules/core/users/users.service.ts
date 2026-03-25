import {
    Injectable,
    ConflictException,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { LinkParentStudentDto } from './dto/link-parent-student.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { AuthCaller } from './types/auth-caller.type';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(ParentStudent)
        private parentStudentRepository: Repository<ParentStudent>,
        private readonly logger: AppLoggerService,
    ) { }

    // ─── Create User ──────────────────────────────────────────────────────────

    async create(
        dto: CreateUserDto,
        caller: AuthCaller,
    ): Promise<{ user: User; plainPassword: string }> {
        if (caller.role !== UserRole.SUPER_ADMIN) {
            this.logger.warn('UsersService', 'Forbidden create attempt', {
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

        const existingEmail = await this.usersRepository.findOne({
            where: { email: dto.email, schoolId: assignedSchoolId } as any,
        });
        if (existingEmail) {
            this.logger.warn('UsersService', 'Email conflict on user create', {
                loggerId: 'USER-CREATE-002',
                schoolId: assignedSchoolId,
                email: dto.email,
            });
            throw new ConflictException(
                `Email "${dto.email}" is already in use in this school`,
            );
        }

        const existingNatId = await this.usersRepository.findOne({
            where: { nationalId: dto.nationalId } as any,
        });
        if (existingNatId) {
            this.logger.warn('UsersService', 'National ID conflict on user create', {
                loggerId: 'USER-CREATE-003',
                nationalId: dto.nationalId,
            });
            throw new ConflictException(`National ID "${dto.nationalId}" is already registered`);
        }

        const plainPassword = this.generatePassword();
        const passwordHash = await bcrypt.hash(plainPassword, 10);

        const user = this.usersRepository.create({
            ...dto,
            schoolId: assignedSchoolId,
            role: UserRole.SCHOOL_ADMIN,
            passwordHash,
        } as any);
        const saved = await this.usersRepository.save(user);
        const savedUser = (Array.isArray(saved) ? saved[0] : saved) as User;
        this.logger.log('UsersService', 'School admin created', {
            loggerId: 'USER-CREATE-004',
            userId: savedUser.id,
            schoolId: savedUser.schoolId,
        });

        // TODO (Week 6 — Notifications): Send plainPassword via email/SMS
        // For students, send to parent's email/SMS
        // For now, password is returned once in the API response
        return { user: savedUser, plainPassword };
    }

    // ─── Bulk Create ──────────────────────────────────────────────────────────

    async bulkCreate(
        dto: BulkCreateUsersDto,
        caller: AuthCaller,
    ): Promise<{
        created: Array<{ user: User; plainPassword: string }>;
        failed: Array<{ index: number; email: string; reason: string }>;
    }> {
        const created: Array<{ user: User; plainPassword: string }> = [];
        const failed: Array<{ index: number; email: string; reason: string }> = [];

        for (let i = 0; i < dto.users.length; i++) {
            try {
                const result = await this.create(dto.users[i], caller);
                created.push(result);
            } catch (err) {
                failed.push({
                    index: i,
                    email: dto.users[i].email,
                    reason: err.message,
                });
            }
        }

        return { created, failed };
    }

    // ─── Find All ─────────────────────────────────────────────────────────────

    async findAll(
        query: QueryUsersDto,
        callerSchoolId: string | null,
        callerRole: UserRole,
    ) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const qb = this.usersRepository.createQueryBuilder('user');

        // Super Admin sees all users; School Admin sees only their school
        if (callerRole !== UserRole.SUPER_ADMIN) {
            qb.where('user.school_id = :schoolId', { schoolId: callerSchoolId });
        }

        if (query.role) qb.andWhere('user.role = :role', { role: query.role });
        if (query.status) qb.andWhere('user.status = :status', { status: query.status });

        qb.andWhere('user.deleted_at IS NULL');
        qb.select([
            'user.id', 'user.email', 'user.firstName', 'user.lastName',
            'user.role', 'user.status', 'user.phone', 'user.schoolId',
            'user.nationalId', 'user.nationalIdType', 'user.avatarUrl',
            'user.createdAt',
        ]);
        qb.orderBy('user.createdAt', 'DESC');
        qb.skip(query.skip).take(limit);

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    // ─── Find One ─────────────────────────────────────────────────────────────

    async findOne(id: string, caller?: AuthCaller): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { id } as any,
            select: [
                'id', 'email', 'firstName', 'lastName', 'role', 'status',
                'phone', 'schoolId', 'nationalId', 'nationalIdType',
                'avatarUrl', 'createdAt',
            ] as any,
        });
        if (!user) throw new NotFoundException(`User #${id} not found`);

        if (
            caller &&
            caller.role !== UserRole.SUPER_ADMIN &&
            user.schoolId !== caller.schoolId
        ) {
            throw new NotFoundException(`User #${id} not found`);
        }

        return user;
    }

    // ─── Update ───────────────────────────────────────────────────────────────

    async update(id: string, dto: UpdateUserDto, caller: AuthCaller): Promise<User> {
        const user = await this.findOne(id, caller);

        if (dto.email && dto.email !== user.email) {
            const clash = await this.usersRepository.findOne({
                where: { email: dto.email, schoolId: user.schoolId } as any,
            });
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

        await this.usersRepository.update({ id } as any, patch as any);
        return this.findOne(id, caller);
    }

    async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
        await this.findOne(id);
        await this.usersRepository.update({ id } as any, dto as any);
        return this.findOne(id);
    }

    async updateAvatar(id: string, avatarUrl: string): Promise<User> {
        await this.findOne(id);
        await this.usersRepository.update({ id } as any, { avatarUrl } as any);
        return this.findOne(id);
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    async remove(id: string, caller: AuthCaller): Promise<void> {
        const user = await this.findOne(id, caller);
        await this.usersRepository.softRemove(user);
        this.logger.log('UsersService', 'User soft deleted', {
            loggerId: 'USER-DELETE-001',
            userId: id,
            schoolId: user.schoolId,
            actorUserId: caller.id,
        });
    }

    // ─── Parent-Student ───────────────────────────────────────────────────────

    async linkParentToStudent(
        parentId: string,
        dto: LinkParentStudentDto,
        caller: AuthCaller,
    ) {
        const parent = await this.usersRepository.findOne({ where: { id: parentId } as any });
        if (!parent) throw new NotFoundException('Parent not found');
        if (parent.role !== UserRole.PARENT) {
            throw new BadRequestException('User is not a parent');
        }

        const student = await this.usersRepository.findOne({ where: { id: dto.studentId } as any });
        if (!student) throw new NotFoundException('Student not found');
        if (student.role !== UserRole.STUDENT) {
            throw new BadRequestException('Target user is not a student');
        }

        if (parent.schoolId !== student.schoolId) {
            throw new BadRequestException(
                'Parent and student must belong to the same school',
            );
        }

        if (caller.role !== UserRole.SUPER_ADMIN) {
            if (
                caller.schoolId === null ||
                parent.schoolId !== caller.schoolId ||
                student.schoolId !== caller.schoolId
            ) {
                throw new ForbiddenException(
                    'You can only link users within your school',
                );
            }
        }

        // Check if already linked
        const existing = await this.parentStudentRepository.findOne({
            where: { parentId, studentId: dto.studentId } as any,
        });
        if (existing) throw new ConflictException('Already linked');

        const link = this.parentStudentRepository.create({
            parentId,
            studentId: dto.studentId,
            relationship: dto.relationship,
        } as any);
        return this.parentStudentRepository.save(link);
    }

    async getParentChildren(parentId: string) {
        const links = await this.parentStudentRepository.find({
            where: { parentId } as any,
        });

        const studentIds = links.map((l) => l.studentId);
        if (studentIds.length === 0) return [];

        return this.usersRepository
            .createQueryBuilder('user')
            .where('user.id IN (:...ids)', { ids: studentIds })
            .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.status'])
            .getMany();
    }

    async unlinkParentFromStudent(
        parentId: string,
        studentId: string,
        caller: AuthCaller,
    ) {
        const parent = await this.usersRepository.findOne({ where: { id: parentId } as any });
        const student = await this.usersRepository.findOne({ where: { id: studentId } as any });
        if (!parent || !student) throw new NotFoundException('User not found');

        if (caller.role !== UserRole.SUPER_ADMIN) {
            if (
                caller.schoolId === null ||
                parent.schoolId !== caller.schoolId ||
                student.schoolId !== caller.schoolId
            ) {
                throw new ForbiddenException(
                    'You can only unlink users within your school',
                );
            }
        }

        const link = await this.parentStudentRepository.findOne({
            where: { parentId, studentId } as any,
        });
        if (!link) throw new NotFoundException('Link not found');
        await this.parentStudentRepository.remove(link);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private generatePassword(length = 10): string {
        const chars =
            'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        return Array.from({ length }, () =>
            chars[Math.floor(Math.random() * chars.length)],
        ).join('');
    }
}
