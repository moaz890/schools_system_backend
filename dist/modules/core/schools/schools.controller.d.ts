import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class SchoolsController {
    private readonly schoolsService;
    constructor(schoolsService: SchoolsService);
    private assertSchoolScope;
    create(createSchoolDto: CreateSchoolDto, file?: Express.Multer.File): Promise<import("./entities/school.entity").School>;
    findAll(pagination: PaginationDto): Promise<{
        data: import("./entities/school.entity").School[];
        meta: any;
    }>;
    remove(id: string): Promise<void>;
    getAnalytics(): Promise<{
        totalSchools: number;
        activeSchools: number;
        inactiveSchools: number;
        totalStudents: null;
        totalTeachers: null;
        schools: {
            id: any;
            name: string;
            code: string;
            isActive: boolean;
            studentCount: null;
            teacherCount: null;
        }[];
    }>;
    getMySchool(user: any): Promise<import("./entities/school.entity").School>;
    findOne(id: string, user: {
        role: string;
        schoolId: string | null;
    }): Promise<import("./entities/school.entity").School>;
    update(id: string, updateSchoolDto: UpdateSchoolDto, user: {
        role: string;
        schoolId: string | null;
    }, file?: Express.Multer.File): Promise<import("./entities/school.entity").School>;
    updateSettings(id: string, settingsDto: UpdateSchoolSettingsDto, user: {
        role: string;
        schoolId: string | null;
    }): Promise<import("./entities/school.entity").School>;
    uploadLogo(id: string, file: Express.Multer.File, user: {
        role: string;
        schoolId: string | null;
    }): Promise<import("./entities/school.entity").School>;
}
