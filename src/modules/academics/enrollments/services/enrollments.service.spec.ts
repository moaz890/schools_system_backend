import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from '../entities/enrollment.entity';
import { StudentGradeLevel } from '../entities/student-grade-level.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

describe('EnrollmentsService (Phase 2 core)', () => {
  let service: EnrollmentsService;

  const enrollmentRepo = {
    count: jest.fn(),
    create: jest.fn((x: any) => x),
    save: jest.fn(async (x: any) => ({ ...x, id: x.id ?? 'enrollment-new-id' })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const eventEmitter = { emit: jest.fn() };

  const studentGradeLevelRepo = {
    findOne: jest.fn(),
    create: jest.fn((x: any) => x),
    save: jest.fn(async (x: any) => x),
  };

  const classRepo = {
    findOne: jest.fn(),
  };

  const usersRepo = {
    findOne: jest.fn(),
  };

  const caller: any = {
    id: 'admin-1',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 'school-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: getRepositoryToken(Enrollment), useValue: enrollmentRepo },
        {
          provide: getRepositoryToken(StudentGradeLevel),
          useValue: studentGradeLevelRepo,
        },
        { provide: getRepositoryToken(ClassSection), useValue: classRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(EnrollmentsService);
  });

  it('creates a missing student_grade_levels placement and enrolls', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'stu-1', role: UserRole.STUDENT });

    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      schoolId: 'school-1',
      academicYearId: 'year-1',
      gradeLevelId: 'grade-1',
      capacity: 30,
    });

    studentGradeLevelRepo.findOne.mockResolvedValue(null);

    enrollmentRepo.count.mockImplementation(({ where }: any) => {
      // two calls: activeEnrollmentCount then activeInClass
      if (where?.studentId) return 0;
      if (where?.classId) return 0;
      return 0;
    });

    const res = await service.create(
      { classId: 'class-1', studentId: 'stu-1', enrollmentDate: new Date('2025-09-01') },
      caller,
    );

    expect(studentGradeLevelRepo.save).toHaveBeenCalled();
    expect(res.status).toBe(EnrollmentStatus.ACTIVE);
    expect(eventEmitter.emit).toHaveBeenCalled();
  });

  it('rejects when existing placement grade_level_id does not match class grade', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'stu-1', role: UserRole.STUDENT });
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      schoolId: 'school-1',
      academicYearId: 'year-1',
      gradeLevelId: 'grade-A',
      capacity: 30,
    });

    studentGradeLevelRepo.findOne.mockResolvedValue({
      id: 'placement-1',
      gradeLevelId: 'grade-B',
    });

    await expect(
      service.create(
        { classId: 'class-1', studentId: 'stu-1', enrollmentDate: new Date() },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when student already has active enrollment in same academic year', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'stu-1', role: UserRole.STUDENT });
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      schoolId: 'school-1',
      academicYearId: 'year-1',
      gradeLevelId: 'grade-A',
      capacity: 30,
    });

    studentGradeLevelRepo.findOne.mockResolvedValue({
      id: 'placement-1',
      gradeLevelId: 'grade-A',
    });

    enrollmentRepo.count.mockImplementation(({ where }: any) => {
      if (where?.studentId && where?.academicYearId) return 1; // active enrollment exists
      return 0;
    });

    await expect(
      service.create(
        { classId: 'class-1', studentId: 'stu-1', enrollmentDate: new Date() },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when class is full', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'stu-1', role: UserRole.STUDENT });
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      schoolId: 'school-1',
      academicYearId: 'year-1',
      gradeLevelId: 'grade-A',
      capacity: 2,
    });

    studentGradeLevelRepo.findOne.mockResolvedValue({
      id: 'placement-1',
      gradeLevelId: 'grade-A',
    });

    enrollmentRepo.count.mockImplementation(({ where }: any) => {
      if (where?.studentId) return 0; // active enrollment in year = 0
      if (where?.classId) return 2; // class full
      return 0;
    });

    await expect(
      service.create(
        { classId: 'class-1', studentId: 'stu-1', enrollmentDate: new Date() },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when student is missing or not role=student', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(
        { classId: 'class-1', studentId: 'stu-1', enrollmentDate: new Date() },
        caller,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

