import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourseEnrollmentPersistenceService } from './course-enrollment-persistence.service';
import { CourseEnrollment } from '../entities/course-enrollment.entity';
import { Course } from '../../courses/entities/course.entity';
import { Enrollment } from '../../../academics/enrollments/entities/enrollment.entity';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';
import { CourseEnrollmentStatus } from '../enums/course-enrollment-status.enum';

describe('CourseEnrollmentPersistenceService', () => {
  let service: CourseEnrollmentPersistenceService;

  const courseEnrollmentRepo = {
    findOne: jest.fn(),
    create: jest.fn((x: any) => x),
    save: jest.fn(),
  };

  const courseRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const classEnrollmentRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseEnrollmentPersistenceService,
        {
          provide: getRepositoryToken(CourseEnrollment),
          useValue: courseEnrollmentRepo,
        },
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: classEnrollmentRepo,
        },
      ],
    }).compile();

    service = module.get(CourseEnrollmentPersistenceService);
  });

  const params = {
    schoolId: 'school-1',
    studentId: 'stu-1',
    courseId: 'course-1',
    enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
  };

  it('tryCreateActiveEnrollment returns false when an active row already exists', async () => {
    courseEnrollmentRepo.findOne.mockResolvedValue({ id: 'e1' });

    const ok = await service.tryCreateActiveEnrollment(params);

    expect(ok).toBe(false);
    expect(courseEnrollmentRepo.save).not.toHaveBeenCalled();
  });

  it('tryCreateActiveEnrollment returns true after save', async () => {
    courseEnrollmentRepo.findOne.mockResolvedValue(null);
    courseEnrollmentRepo.save.mockResolvedValue({});

    const ok = await service.tryCreateActiveEnrollment(params);

    expect(ok).toBe(true);
    expect(courseEnrollmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...params,
        status: CourseEnrollmentStatus.ACTIVE,
        enrolledAt: expect.any(Date),
      }),
    );
  });

  it('tryCreateActiveEnrollment swallows unique violation (idempotent)', async () => {
    courseEnrollmentRepo.findOne.mockResolvedValue(null);
    const err: any = new Error('duplicate');
    err.code = '23505';
    courseEnrollmentRepo.save.mockRejectedValue(err);

    const ok = await service.tryCreateActiveEnrollment(params);

    expect(ok).toBe(false);
  });
});
