import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GradeLevelSubjectsService } from './grade-level-subjects.service';
import { GradeLevelSubject } from '../entities/grade-level-subject.entity';
import { GradeLevel } from '../entities/grade-level.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { TeacherAssignment } from '../../teacher-assignments/entities/teacher-assignment.entity';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { GRADE_LEVEL_SUBJECT_REMOVED_EVENT } from '../../events/academics-events.constants';

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

    const taQb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
    };

    const teacherAssignmentRepo = {
        createQueryBuilder: jest.fn(() => taQb),
    };

    const eventEmitter = { emit: jest.fn() };

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
                {
                    provide: getRepositoryToken(TeacherAssignment),
                    useValue: teacherAssignmentRepo,
                },
                { provide: EventEmitter2, useValue: eventEmitter },
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

    it('unlinkSubject throws ConflictException when teacher assignments exist', async () => {
        gradeLevelRepo.findOne.mockResolvedValue({ id: 'g1', schoolId: 'school-1' });
        linkRepo.findOne.mockResolvedValue({
            id: 'link-1',
            gradeLevelId: 'g1',
            subjectId: 's1',
        });
        taQb.getCount.mockResolvedValue(1);

        await expect(service.unlinkSubject('g1', 's1', caller)).rejects.toBeInstanceOf(
            ConflictException,
        );
        expect(linkRepo.softRemove).not.toHaveBeenCalled();
        expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('unlinkSubject soft-removes and emits when no assignments', async () => {
        gradeLevelRepo.findOne.mockResolvedValue({ id: 'g1', schoolId: 'school-1' });
        linkRepo.findOne.mockResolvedValue({
            id: 'link-1',
            gradeLevelId: 'g1',
            subjectId: 's1',
        });
        taQb.getCount.mockResolvedValue(0);

        await service.unlinkSubject('g1', 's1', caller);

        expect(linkRepo.softRemove).toHaveBeenCalled();
        expect(eventEmitter.emit).toHaveBeenCalledWith(
            GRADE_LEVEL_SUBJECT_REMOVED_EVENT,
            expect.objectContaining({
                schoolId: 'school-1',
                gradeLevelId: 'g1',
                subjectId: 's1',
                gradeLevelSubjectLinkId: 'link-1',
            }),
        );
    });
});
