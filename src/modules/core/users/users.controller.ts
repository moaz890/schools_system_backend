import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseUUIDPipe,
    Query,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import fs from 'fs';
import { extname, join } from 'path';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { LinkParentStudentDto } from './dto/link-parent-student.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import type { AuthCaller } from './types/auth-caller.type';

const uploadBaseDir = join(
    process.cwd(),
    process.env.UPLOAD_DEST || './uploads',
);
const avatarUploadDir = join(uploadBaseDir, 'avatars');
fs.mkdirSync(avatarUploadDir, { recursive: true });

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // ─── Super Admin: create school admins only (other roles → future modules) ─

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({
        summary: 'Create a school admin (super admin only)',
        description:
            'Creates a user with role school_admin for the given school. Teachers, students, and parents are created elsewhere.',
    })
    create(@Body() dto: CreateUserDto, @CurrentUser() caller: AuthCaller) {
        return this.usersService.create(dto, caller);
    }

    @Post('bulk')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({
        summary: 'Bulk create school admins (super admin only)',
        description: 'Same rules as POST /users — each entry is a school_admin for its schoolId.',
    })
    bulkCreate(@Body() dto: BulkCreateUsersDto, @CurrentUser() caller: AuthCaller) {
        return this.usersService.bulkCreate(dto, caller);
    }

    // ─── Admin: List + Get ────────────────────────────────────────────────────

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'List users (filter by ?role= or ?status=)' })
    findAll(@Query() query: QueryUsersDto, @CurrentUser() user: any) {
        return this.usersService.findAll(query, user.schoolId, user.role);
    }

    // ─── Own Profile ──────────────────────────────────────────────────────────

    @Get('me')
    @ApiOperation({ summary: 'Get own profile' })
    getMe(@CurrentUser() user: any) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    @ApiOperation({ summary: 'Update own profile (name, phone)' })
    updateMe(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @Post('me/avatar')
    @ApiOperation({ summary: 'Upload own avatar photo' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: avatarUploadDir,
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `avatar-${unique}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
                if (!allowed.includes(extname(file.originalname).toLowerCase())) {
                    return cb(new BadRequestException('Only image files are allowed'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
        }),
    )
    uploadAvatar(
        @CurrentUser() user: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('Avatar file is required');
        return this.usersService.updateAvatar(user.id, `/uploads/avatars/${file.filename}`);
    }

    // ─── Admin: Get/Update/Delete specific user ───────────────────────────────

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthCaller) {
        return this.usersService.findOne(id, caller);
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update user (status, name, phone)' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateUserDto,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.usersService.update(id, dto, caller);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Soft delete a user' })
    remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() caller: AuthCaller) {
        return this.usersService.remove(id, caller);
    }

    // ─── Parent-Student linking ───────────────────────────────────────────────

    @Post(':parentId/children')
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Link a student to a parent' })
    linkChild(
        @Param('parentId', ParseUUIDPipe) parentId: string,
        @Body() dto: LinkParentStudentDto,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.usersService.linkParentToStudent(parentId, dto, caller);
    }

    @Get(':parentId/children')
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.PARENT)
    @ApiOperation({ summary: "Get parent's linked children" })
    getChildren(
        @Param('parentId', ParseUUIDPipe) parentId: string,
        @CurrentUser() user: AuthCaller,
    ) {
        if (user.role === UserRole.PARENT && parentId !== user.id) {
            throw new ForbiddenException('You can only view your own children');
        }
        return this.usersService.getParentChildren(parentId);
    }

    @Delete(':parentId/children/:studentId')
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Unlink a student from a parent' })
    unlinkChild(
        @Param('parentId', ParseUUIDPipe) parentId: string,
        @Param('studentId', ParseUUIDPipe) studentId: string,
        @CurrentUser() caller: AuthCaller,
    ) {
        return this.usersService.unlinkParentFromStudent(parentId, studentId, caller);
    }
}
