import { Repository } from 'typeorm';
import { School } from './entities/school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { AppLoggerService } from '../logger/logger.service';
export declare class SchoolsService {
    private readonly schoolsRepository;
    private readonly logger;
    constructor(schoolsRepository: Repository<School>, logger: AppLoggerService);
    create(createSchoolDto: CreateSchoolDto, logoUrl?: string): Promise<School>;
    findAll(pagination: PaginationDto): Promise<{
        data: School[];
        meta: any;
    }>;
    findOne(id: string): Promise<School>;
    update(id: string, updateSchoolDto: UpdateSchoolDto, logoUrl?: string): Promise<School>;
    remove(id: string): Promise<void>;
    updateSettings(id: string, settingsDto: UpdateSchoolSettingsDto): Promise<School>;
    updateLogo(id: string, logoUrl: string): Promise<School>;
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
}
