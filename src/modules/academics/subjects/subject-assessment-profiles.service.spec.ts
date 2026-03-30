import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { SubjectAssessmentProfilesService } from './subject-assessment-profiles.service';
import { SubjectAssessmentProfile } from './entities/subject-assessment-profile.entity';
import { Subject } from './entities/subject.entity';
import { AssessmentComponentType } from './enums/assessment-component-type.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';

describe('SubjectAssessmentProfilesService', () => {
    let service: SubjectAssessmentProfilesService;

    const profileRepo = {
        findOne: jest.fn(),
        create: jest.fn((x: Partial<SubjectAssessmentProfile>) => ({ ...x, id: 'p1' })),
        save: jest.fn(async (x: SubjectAssessmentProfile) => x),
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
                SubjectAssessmentProfilesService,
                {
                    provide: getRepositoryToken(SubjectAssessmentProfile),
                    useValue: profileRepo,
                },
                { provide: getRepositoryToken(Subject), useValue: subjectRepo },
            ],
        }).compile();

        service = module.get(SubjectAssessmentProfilesService);
    });

    it('getDefaultProfile throws NotFound when no profile', async () => {
        subjectRepo.findOne.mockResolvedValue({ id: 's1', schoolId: 'school-1' });
        profileRepo.findOne.mockResolvedValue(null);

        await expect(
            service.getDefaultProfile('s1', caller),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('upsertDefaultProfile throws BadRequest when weights do not sum to 100', async () => {
        subjectRepo.findOne.mockResolvedValue({ id: 's1', schoolId: 'school-1' });

        await expect(
            service.upsertDefaultProfile(
                's1',
                {
                    components: [
                        {
                            name: 'A',
                            weight: 30,
                            type: AssessmentComponentType.EXAM,
                        },
                        {
                            name: 'B',
                            weight: 50,
                            type: AssessmentComponentType.ASSIGNMENT,
                        },
                    ],
                },
                caller,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('upsertDefaultProfile creates when none exists', async () => {
        subjectRepo.findOne.mockResolvedValue({ id: 's1', schoolId: 'school-1' });
        profileRepo.findOne.mockResolvedValue(null);
        profileRepo.save.mockResolvedValue({
            id: 'p1',
            subjectId: 's1',
            components: [],
        } as unknown as SubjectAssessmentProfile);

        await service.upsertDefaultProfile(
            's1',
            {
                components: [
                    {
                        name: 'Midterm',
                        weight: 40,
                        type: AssessmentComponentType.EXAM,
                    },
                    {
                        name: 'Final',
                        weight: 60,
                        type: AssessmentComponentType.EXAM,
                    },
                ],
            },
            caller,
        );

        expect(profileRepo.create).toHaveBeenCalled();
        expect(profileRepo.save).toHaveBeenCalled();
    });
});
