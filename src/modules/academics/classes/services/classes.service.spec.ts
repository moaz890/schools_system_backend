import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesDalService } from './classes-dal.service';
import { ClassesHelpersService } from './classes-helpers.service';
import { ClassSection } from '../entities/class.entity';
import { GradeLevel } from '../../grade-levels/entities/grade-level.entity';
import { AcademicYear } from '../../../core/academic-years/entities/academic-year.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';

describe('ClassesService (Phase 1)', () => {
  let service: ClassesService;

  const classRepo = {
    count: jest.fn(),
    create: jest.fn((x: any) => x),
    save: jest.fn(async (x: any) => x),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const gradeRepo = {
    findOne: jest.fn(),
  };

  const yearRepo = {
    findOne: jest.fn(),
  };

  const userRepo = {
    findOne: jest.fn(),
  };

  const caller: any = {
    id: 'u1',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 'school-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesDalService,
        ClassesHelpersService,
        ClassesService,
        { provide: getRepositoryToken(ClassSection), useValue: classRepo },
        { provide: getRepositoryToken(GradeLevel), useValue: gradeRepo },
        { provide: getRepositoryToken(AcademicYear), useValue: yearRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get(ClassesService);
  });

  it('generates A letter and name from grade level + count=0', async () => {
    gradeRepo.findOne.mockResolvedValue({
      id: 'g1',
      schoolId: 'school-1',
      name: { en: 'Grade 5', ar: 'الصف 5' },
      order: 5,
    });

    yearRepo.findOne.mockResolvedValue({
      id: 'y1',
      schoolId: 'school-1',
      name: { en: '2025-2026', ar: '٢٠٢٥–٢٠٢٦' },
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    });

    userRepo.findOne.mockResolvedValue({ id: 't1', role: UserRole.TEACHER });

    // First count = teacher homeroom count (0), second count = gradeClassesCount (0)
    classRepo.count.mockImplementation((opts: any) => {
      const where = opts?.where ?? {};
      if (where.homeroomTeacherId) return 0;
      if (where.gradeLevelId) return 0;
      return 0;
    });

    classRepo.findOne.mockResolvedValue({
      id: 'class-new',
      schoolId: 'school-1',
      gradeLevelId: 'g1',
      academicYearId: 'y1',
      sectionLetter: 'A',
      name: { en: 'Grade 5 A', ar: 'الصف 5 A' },
      capacity: 30,
      homeroomTeacherId: 't1',
      gradeLevel: {
        id: 'g1',
        name: { en: 'Grade 5', ar: 'الصف 5' },
        order: 5,
      },
      academicYear: {
        id: 'y1',
        name: { en: '2025-2026', ar: '٢٠٢٥–٢٠٢٦' },
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
      },
      homeroomTeacher: {
        id: 't1',
        email: 'teacher@test',
        name: { en: 'Teacher', ar: 'معلم' },
      },
    });

    classRepo.save.mockResolvedValue({ id: 'class-new' } as any);

    const result = await service.create(
      {
        gradeLevelId: 'g1',
        academicYearId: 'y1',
        capacity: 30,
        homeroomTeacherId: 't1',
      },
      caller,
    );

    expect(result.sectionLetter).toBe('A');
    expect(result.name.en).toBe('Grade 5 A');
    expect(result.name.ar).toBe('الصف 5 A');
  });

  it('rejects when homeroom teacher is not role=teacher', async () => {
    gradeRepo.findOne.mockResolvedValue({
      id: 'g1',
      schoolId: 'school-1',
      name: { en: 'Grade 5', ar: 'الصف 5' },
    });
    yearRepo.findOne.mockResolvedValue({ id: 'y1', schoolId: 'school-1' });
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          gradeLevelId: 'g1',
          academicYearId: 'y1',
          capacity: 30,
          homeroomTeacherId: 't1',
        },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects if teacher already has homeroom in same academic year', async () => {
    gradeRepo.findOne.mockResolvedValue({
      id: 'g1',
      schoolId: 'school-1',
      name: { en: 'Grade 5', ar: 'الصف 5' },
      order: 5,
    });
    yearRepo.findOne.mockResolvedValue({
      id: 'y1',
      schoolId: 'school-1',
      name: { en: '2025-2026', ar: '٢٠٢٥–٢٠٢٦' },
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    });
    userRepo.findOne.mockResolvedValue({ id: 't1', role: UserRole.TEACHER });

    classRepo.count.mockImplementation((opts: any) => {
      const where = opts?.where ?? {};
      if (where.homeroomTeacherId) return 1; // teacher already used
      return 0;
    });

    await expect(
      service.create(
        {
          gradeLevelId: 'g1',
          academicYearId: 'y1',
          capacity: 30,
          homeroomTeacherId: 't1',
        },
        caller,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects when grade level does not exist in school', async () => {
    gradeRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        {
          gradeLevelId: 'missing',
          academicYearId: 'y1',
          capacity: 30,
          homeroomTeacherId: 't1',
        },
        caller,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

