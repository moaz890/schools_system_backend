import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { GradeLevelSubjectsService } from './grade-level-subjects.service';
import { GradeLevelSubject } from './entities/grade-level-subject.entity';
import { GradeLevel } from './entities/grade-level.entity';
import { Subject } from '../subjects/entities/subject.entity';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';

describe('GradeLevelSubjectsService', () => {
    let service: GradeLevelSubjectsService;

    const mockQb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getOne: jest.fn(),
    };

    const linkRepo = {
        createQueryBuilder: jest.fn(() => mockQb),
        findOne: jest.fn(),
        create: jest.fn((x: Partial<GradeLevelSubject>) => ({ ...x, id: 'link-1' })),
        save: jest.fn(async (x: GradeLevelSubject) => x),
        softRemove: jest.fn(),
    };

    const gradeLevelRepo = {
        findOne: jest.fn(),
    };

    const subjectRepo = {
        findOne: jest.fn(),
    };

    const caller: AuthCaller = {
        id: 'user-1',
        role: UserRole.SCHOOL_ADMIN,
        schoolId: 'school-1',
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GradeLevelSubjectsService,
                { provide: getRepositoryToken(GradeLevelSubject), useValue: linkRepo },
                { provide: getRepositoryToken(GradeLevel), useValue: gradeLevelRepo },
                { provide: getRepositoryToken(Subject), useValue: subjectRepo },
            ],
        }).compile();

        service = module.get(GradeLevelSubjectsService);
    });

    it('linkSubject throws NotFoundException when subject is not in caller school', async () => {
        gradeLevelRepo.findOne.mockResolvedValue({
            id: 'g1',
            schoolId: 'school-1',
        });
        subjectRepo.findOne.mockResolvedValue(null);

        await expect(
            service.linkSubject('g1', 'sub-other', caller),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('linkSubject throws ConflictException when link already exists', async () => {
        gradeLevelRepo.findOne.mockResolvedValue({
            id: 'g1',
            schoolId: 'school-1',
        });
        subjectRepo.findOne.mockResolvedValue({
            id: 's1',
            schoolId: 'school-1',
        });
        mockQb.getOne.mockResolvedValue({ id: 'existing-link' });

        await expect(service.linkSubject('g1', 's1', caller)).rejects.toBeInstanceOf(
            ConflictException,
        );
    });

    it('linkSubject rejects when caller has no schoolId', async () => {
        await expect(
            service.linkSubject('g1', 's1', { ...caller, schoolId: null }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('listSubjectsForGrade throws NotFoundException when grade not in school', async () => {
        gradeLevelRepo.findOne.mockResolvedValue(null);

        await expect(
            service.listSubjectsForGrade('g-missing', caller),
        ).rejects.toBeInstanceOf(NotFoundException);
    });
});
