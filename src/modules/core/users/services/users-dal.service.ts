import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UserRole } from '../../../../common/enums/user-role.enum';

@Injectable()
export class UsersDalService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async findEmailAndSchool(email: string, schoolId: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email, schoolId } as any,
            relations: ['school'],
        });
    }

    async findByNationalId(nationalId: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { nationalId } as any,
        });
    }

    async findActiveSchoolAdmin(schoolId: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({
            where: { schoolId, role: UserRole.SCHOOL_ADMIN } as any,
            relations: ['school'],
        });
        if (!user) return null;
        return user.school?.isActive ? user : null;
    }

    async save(user: User): Promise<User> {
        return this.usersRepository.save(user) as Promise<User>;
    }

    async findUserSelectableById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id } as any,
            select: [
                'id',
                'email',
                'firstName',
                'lastName',
                'role',
                'status',
                'phone',
                'schoolId',
                'nationalId',
                'nationalIdType',
                'avatarUrl',
                'createdAt',
            ] as any,
        });
    }

    async updateById(id: string, patch: Record<string, unknown>): Promise<void> {
        await this.usersRepository.update({ id } as any, patch as any);
    }

    async softRemove(user: User): Promise<void> {
        await this.usersRepository.softRemove(user);
    }

    async list(
        query: QueryUsersDto,
        callerSchoolId: string | null,
        callerRole: UserRole,
    ): Promise<{ data: User[]; meta: any }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const qb = this.usersRepository.createQueryBuilder('user');

        if (callerRole !== UserRole.SUPER_ADMIN) {
            qb.where('user.school_id = :schoolId', { schoolId: callerSchoolId });
        }

        if (query.role) qb.andWhere('user.role = :role', { role: query.role });
        if (query.status) qb.andWhere('user.status = :status', { status: query.status });

        qb.andWhere('user.deleted_at IS NULL');
        qb.select([
            'user.id',
            'user.email',
            'user.firstName',
            'user.lastName',
            'user.role',
            'user.status',
            'user.phone',
            'user.schoolId',
            'user.nationalId',
            'user.nationalIdType',
            'user.avatarUrl',
            'user.createdAt',
        ]);
        qb.orderBy('user.createdAt', 'DESC');
        qb.skip(query.skip).take(limit);

        const [data, total] = await qb.getManyAndCount();
        return {
            data: data as User[],
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
}

