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
import { ConditionalFileInterceptor } from '../../../common/interceptors/conditional-file.interceptor';
import { getLogoMulterOptions, getPublicLogoUrl } from '../../../common/upload/logo-upload.helper';
import {
    ApiBearerAuth,
    ApiConsumes,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Schools')
@ApiBearerAuth('access-token')
@Controller('schools')
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) { }

    private assertSchoolScope(user: { role: string; schoolId: string | null }, schoolId: string) {
        if (user.role === UserRole.SCHOOL_ADMIN && user.schoolId !== schoolId) {
            throw new ForbiddenException('You can only manage your own school');
        }
    }

    // ─── Super Admin only ─────────────────────────────────────────────────────

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new school (Super Admin only)' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(ConditionalFileInterceptor('logo', getLogoMulterOptions()))
    create(
        @Body() createSchoolDto: CreateSchoolDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const logoUrl = file ? getPublicLogoUrl(file.filename) : undefined;
        return this.schoolsService.create(createSchoolDto, logoUrl);
    }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'List all schools (Super Admin only)' })
    findAll(@Query() pagination: PaginationDto) {
        return this.schoolsService.findAll(pagination);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Soft delete a school (Super Admin only)' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.schoolsService.remove(id);
    }

    // ─── Cross-school analytics (Super Admin only) ────────────────────────────

    @Get('analytics')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Cross-school analytics (Super Admin only, placeholder)' })
    getAnalytics() {
        return this.schoolsService.getAnalytics();
    }

    // ─── School Admin + Super Admin ───────────────────────────────────────────

    @Get('me')
    @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
    @ApiOperation({ summary: "Get current user's school (no need to know the ID)" })
    getMySchool(@CurrentUser() user: any) {
        return this.schoolsService.findOne(user.schoolId);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get one school by ID (Super Admin Only)' })
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: { role: string; schoolId: string | null },
    ) {
        this.assertSchoolScope(user, id);
        return this.schoolsService.findOne(id);
    }

    @Patch(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update school info used by ( Super Admin only )' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(ConditionalFileInterceptor('logo', getLogoMulterOptions()))
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateSchoolDto: UpdateSchoolDto,
        @CurrentUser() user: { role: string; schoolId: string | null },
        @UploadedFile() file?: Express.Multer.File,
    ) {
        this.assertSchoolScope(user, id);
        const logoUrl = file ? getPublicLogoUrl(file.filename) : undefined;
        return this.schoolsService.update(id, updateSchoolDto, logoUrl);
    }

    @Patch(':id/settings')
    @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
    @ApiOperation({ summary: 'Update school settings (JSON patch) (Super and School Admins)' })
    updateSettings(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() settingsDto: UpdateSchoolSettingsDto,
        @CurrentUser() user: { role: string; schoolId: string | null },
    ) {
        this.assertSchoolScope(user, id);
        return this.schoolsService.updateSettings(id, settingsDto);
    }

    @Post(':id/logo')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Upload school logo ( Super Admin )' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(ConditionalFileInterceptor('logo', getLogoMulterOptions()))
    uploadLogo(
        @Param('id', ParseUUIDPipe) id: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: { role: string; schoolId: string | null },
    ) {
        this.assertSchoolScope(user, id);
        if (!file) throw new BadRequestException('Logo file is required');
        const logoUrl = getPublicLogoUrl(file.filename);
        return this.schoolsService.updateLogo(id, logoUrl);
    }
}
