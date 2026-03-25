import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { LinkParentStudentDto } from './dto/link-parent-student.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import type { AuthCaller } from './types/auth-caller.type';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(dto: CreateUserDto, caller: AuthCaller): Promise<{
        user: import("./entities/user.entity").User;
        plainPassword: string;
    }>;
    bulkCreate(dto: BulkCreateUsersDto, caller: AuthCaller): Promise<{
        created: Array<{
            user: import("./entities/user.entity").User;
            plainPassword: string;
        }>;
        failed: Array<{
            index: number;
            email: string;
            reason: string;
        }>;
    }>;
    findAll(query: QueryUsersDto, user: any): Promise<{
        data: import("./entities/user.entity").User[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getMe(user: any): Promise<import("./entities/user.entity").User>;
    updateMe(user: any, dto: UpdateProfileDto): Promise<import("./entities/user.entity").User>;
    uploadAvatar(user: any, file: Express.Multer.File): Promise<import("./entities/user.entity").User>;
    findOne(id: string, caller: AuthCaller): Promise<import("./entities/user.entity").User>;
    update(id: string, dto: UpdateUserDto, caller: AuthCaller): Promise<import("./entities/user.entity").User>;
    remove(id: string, caller: AuthCaller): Promise<void>;
    linkChild(parentId: string, dto: LinkParentStudentDto, caller: AuthCaller): Promise<import("./entities/parent-student.entity").ParentStudent[]>;
    getChildren(parentId: string, user: AuthCaller): Promise<import("./entities/user.entity").User[]>;
    unlinkChild(parentId: string, studentId: string, caller: AuthCaller): Promise<void>;
}
