import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { Subject } from './entities/subject.entity';
import { SubjectCategory } from './enums/subject-category.enum';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';
import { UserRole } from '../../../common/enums/user-role.enum';

describe('SubjectsService', () => {
  let service: SubjectsService;

  const mockQb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  };

  const repo = {
    createQueryBuilder: jest.fn(() => mockQb),
    findOne: jest.fn(),
    create: jest.fn((x: Partial<Subject>) => ({ ...x })),
    save: jest.fn(async (x: Subject) => x),
    softRemove: jest.fn(),
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
        SubjectsService,
        { provide: getRepositoryToken(Subject), useValue: repo },
      ],
    }).compile();

    service = module.get(SubjectsService);
  });

  it('create throws ConflictException when code already exists for school', async () => {
    mockQb.getOne.mockResolvedValue({ id: 'existing-subject' });

    await expect(
      service.create(
        {
          name: { en: 'Math', ar: 'رياضيات' },
          code: 'MATH',
          category: SubjectCategory.CORE,
        },
        caller,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create normalizes code to uppercase and saves when unique', async () => {
    mockQb.getOne.mockResolvedValue(null);
    repo.save.mockImplementation(async (s: Subject) => ({
    //   id: 'new-id',
      ...s,
    }));

    const result = await service.create(
      {
        name: { en: 'Math', ar: 'رياضيات' },
        code: 'math',
        category: SubjectCategory.CORE,
      },
      caller,
    );

    expect(result.code).toBe('MATH');
    expect(repo.save).toHaveBeenCalled();
  });

  it('create throws BadRequestException when caller has no schoolId', async () => {
    await expect(
      service.create(
        {
          name: { en: 'M', ar: 'م' },
          code: 'X',
          category: SubjectCategory.CORE,
        },
        { ...caller, schoolId: null },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('list scopes by caller schoolId', async () => {
    mockQb.getManyAndCount.mockResolvedValue([[], 0]);

    await service.list(caller, { page: 1, limit: 10 } as any);

    expect(repo.createQueryBuilder).toHaveBeenCalledWith('s');
    expect(mockQb.where).toHaveBeenCalledWith('s.schoolId = :schoolId', {
      schoolId: 'school-1',
    });
    expect(mockQb.andWhere).toHaveBeenCalledWith('s.deletedAt IS NULL');
  });
});
