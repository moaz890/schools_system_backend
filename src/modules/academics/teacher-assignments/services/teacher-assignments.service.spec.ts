import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { TeacherAssignmentsDalService } from './teacher-assignments-dal.service';
import { TeacherAssignmentsHelpersService } from './teacher-assignments-helpers.service';
import { User } from '../../../core/users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';

describe('TeacherAssignmentsService', () => {
  let service: TeacherAssignmentsService;

  const dal = {
    findClassWithGradeForSchool: jest.fn(),
    findCurriculumLink: jest.fn(),
    findActiveSpecialization: jest.fn(),
    countActiveDuplicate: jest.fn(),
    createAssignment: jest.fn((x: any) => x),
    saveAssignment: jest.fn(async (x: any) => x),
    findAssignmentById: jest.fn(),
    listAssignmentsForClass: jest.fn(),
  };

  const usersRepo = { findOne: jest.fn() };
  const subjectsRepo = { findOne: jest.fn() };

  const caller: any = {
    id: 'admin-1',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 'school-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherAssignmentsService,
        TeacherAssignmentsHelpersService,
        { provide: TeacherAssignmentsDalService, useValue: dal },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Subject), useValue: subjectsRepo },
      ],
    }).compile();

    service = module.get(TeacherAssignmentsService);
  });

  function baseMocks() {
    usersRepo.findOne.mockResolvedValue({
      id: 't1',
      schoolId: 'school-1',
      role: UserRole.TEACHER,
      email: 't@test',
      name: { en: 'T', ar: 'ت' },
    });
    subjectsRepo.findOne.mockResolvedValue({
      id: 's1',
      schoolId: 'school-1',
      code: 'MATH',
      name: { en: 'Math', ar: 'رياضيات' },
    });
    dal.findClassWithGradeForSchool.mockResolvedValue({
      id: 'c1',
      schoolId: 'school-1',
      gradeLevelId: 'g1',
      academicYearId: 'y1',
      gradeLevel: { id: 'g1', stageId: 'stage-primary' },
    });
    dal.findCurriculumLink.mockResolvedValue({ id: 'link-1' });
    dal.findActiveSpecialization.mockResolvedValue({
      allowedStageIds: null,
    });
    dal.countActiveDuplicate.mockResolvedValue(0);
    dal.saveAssignment.mockImplementation(async (x: any) => ({ ...x, id: 'asg-1' }));
    dal.findAssignmentById.mockResolvedValue({
      id: 'asg-1',
      classId: 'c1',
      academicYearId: 'y1',
      startDate: new Date('2025-09-01'),
      endDate: null,
      isActive: true,
      teacher: {
        id: 't1',
        email: 't@test',
        name: { en: 'T', ar: 'ت' },
      },
      subject: {
        id: 's1',
        code: 'MATH',
        name: { en: 'Math', ar: 'رياضيات' },
      },
    });
  }

  it('creates when curriculum + specialization + stage OK', async () => {
    baseMocks();
    const out = await service.create(
      { classId: 'c1', teacherId: 't1', subjectId: 's1' },
      caller,
    );
    expect(out.id).toBe('asg-1');
    expect(out.teacher.id).toBe('t1');
    expect(out.subject.code).toBe('MATH');
  });

  it('rejects when teacher not found / not teacher role', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create(
        { classId: 'c1', teacherId: 't1', subjectId: 's1' },
        caller,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when subject not in grade curriculum', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 't1', role: UserRole.TEACHER });
    subjectsRepo.findOne.mockResolvedValue({ id: 's1' });
    dal.findClassWithGradeForSchool.mockResolvedValue({
      id: 'c1',
      gradeLevelId: 'g1',
      academicYearId: 'y1',
      gradeLevel: { stageId: 'stage-primary' },
    });
    dal.findCurriculumLink.mockResolvedValue(null);
    await expect(
      service.create(
        { classId: 'c1', teacherId: 't1', subjectId: 's1' },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when specialization missing', async () => {
    baseMocks();
    dal.findActiveSpecialization.mockResolvedValue(null);
    await expect(
      service.create(
        { classId: 'c1', teacherId: 't1', subjectId: 's1' },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when specialization stage list excludes class stage', async () => {
    baseMocks();
    dal.findActiveSpecialization.mockResolvedValue({
      allowedStageIds: ['stage-other'],
    });
    await expect(
      service.create(
        { classId: 'c1', teacherId: 't1', subjectId: 's1' },
        caller,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate active assignment for same teacher+class+subject', async () => {
    baseMocks();
    dal.countActiveDuplicate.mockResolvedValue(1);
    await expect(
      service.create(
        { classId: 'c1', teacherId: 't1', subjectId: 's1' },
        caller,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows a second teacher for same class+subject (co-teaching)', async () => {
    baseMocks();
    await service.create(
      { classId: 'c1', teacherId: 't1', subjectId: 's1' },
      caller,
    );
    usersRepo.findOne.mockResolvedValue({
      id: 't2',
      schoolId: 'school-1',
      role: UserRole.TEACHER,
      email: 't2@test',
      name: { en: 'T2', ar: 'ت2' },
    });
    dal.countActiveDuplicate.mockResolvedValue(0);
    dal.findAssignmentById.mockResolvedValue({
      id: 'asg-2',
      classId: 'c1',
      academicYearId: 'y1',
      startDate: new Date('2025-09-01'),
      endDate: null,
      isActive: true,
      teacher: {
        id: 't2',
        email: 't2@test',
        name: { en: 'T2', ar: 'ت2' },
      },
      subject: {
        id: 's1',
        code: 'MATH',
        name: { en: 'Math', ar: 'رياضيات' },
      },
    });
    dal.saveAssignment.mockImplementation(async (x: any) => ({ ...x, id: 'asg-2' }));

    const out = await service.create(
      { classId: 'c1', teacherId: 't2', subjectId: 's1' },
      caller,
    );
    expect(out.teacher.id).toBe('t2');
  });

  it('ends assignment (is_active false, end_date set)', async () => {
    dal.findAssignmentById
      .mockResolvedValueOnce({
        id: 'asg-1',
        classId: 'c1',
        academicYearId: 'y1',
        startDate: new Date('2025-09-01'),
        endDate: null,
        isActive: true,
        teacher: { id: 't1', email: 't@test', name: { en: 'T', ar: 'ت' } },
        subject: {
          id: 's1',
          code: 'MATH',
          name: { en: 'Math', ar: 'رياضيات' },
        },
      })
      .mockResolvedValueOnce({
        id: 'asg-1',
        classId: 'c1',
        academicYearId: 'y1',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-01-01'),
        isActive: false,
        teacher: { id: 't1', email: 't@test', name: { en: 'T', ar: 'ت' } },
        subject: {
          id: 's1',
          code: 'MATH',
          name: { en: 'Math', ar: 'رياضيات' },
        },
      });

    const out = await service.end(
      'asg-1',
      { endDate: new Date('2026-01-01') },
      caller,
    );
    expect(out.isActive).toBe(false);
    expect(out.endDate).toEqual(new Date('2026-01-01'));
    expect(dal.saveAssignment).toHaveBeenCalled();
  });
});
