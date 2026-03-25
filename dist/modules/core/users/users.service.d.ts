import { Repository } from 'typeorm';
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
export declare class UsersService {
    private usersRepository;
    private parentStudentRepository;
    private readonly logger;
    constructor(usersRepository: Repository<User>, parentStudentRepository: Repository<ParentStudent>, logger: AppLoggerService);
    create(dto: CreateUserDto, caller: AuthCaller): Promise<{
        user: User;
        plainPassword: string;
    }>;
    bulkCreate(dto: BulkCreateUsersDto, caller: AuthCaller): Promise<{
        created: Array<{
            user: User;
            plainPassword: string;
        }>;
        failed: Array<{
            index: number;
            email: string;
            reason: string;
        }>;
    }>;
    findAll(query: QueryUsersDto, callerSchoolId: string | null, callerRole: UserRole): Promise<{
        data: User[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, caller?: AuthCaller): Promise<User>;
    update(id: string, dto: UpdateUserDto, caller: AuthCaller): Promise<User>;
    updateProfile(id: string, dto: UpdateProfileDto): Promise<User>;
    updateAvatar(id: string, avatarUrl: string): Promise<User>;
    remove(id: string, caller: AuthCaller): Promise<void>;
    linkParentToStudent(parentId: string, dto: LinkParentStudentDto, caller: AuthCaller): Promise<ParentStudent[]>;
    getParentChildren(parentId: string): Promise<User[]>;
    unlinkParentFromStudent(parentId: string, studentId: string, caller: AuthCaller): Promise<void>;
    private generatePassword;
}
