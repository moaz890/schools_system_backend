import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CourseContentUnitsService } from './course-content-units.service';
import { CourseContentSharedService } from './course-content-shared.service';
import { CourseContentDalService } from './course-content-dal.service';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CourseStructureKind } from '../enums/course-structure-kind.enum';

describe('CourseContentUnitsService', () => {
  let units: CourseContentUnitsService;

  const dal: jest.Mocked<Partial<CourseContentDalService>> = {
    findCourse: jest.fn(),
    countRootLessons: jest.fn(),
    countUnits: jest.fn(),
    nextUnitPosition: jest.fn(),
    saveUnit: jest.fn(),
    saveCourse: jest.fn(),
    listUnitsWithLessonsAndItems: jest.fn().mockResolvedValue([]),
    listRootLessonsWithItems: jest.fn().mockResolvedValue([]),
    findUnit: jest.fn(),
  };

  const teacherCaller = {
    id: 'teacher-1',
    role: UserRole.TEACHER,
    schoolId: 'school-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContentSharedService,
        CourseContentUnitsService,
        { provide: CourseContentDalService, useValue: dal },
      ],
    }).compile();
    units = module.get(CourseContentUnitsService);
    dal.listUnitsWithLessonsAndItems!.mockResolvedValue([]);
    dal.listRootLessonsWithItems!.mockResolvedValue([]);
  });

  it('rejects creating a unit when the course is published (Policy A)', async () => {
    dal.findCourse!.mockResolvedValue({
      id: 'course-1',
      schoolId: 'school-1',
      teacherId: 'teacher-1',
      isPublished: true,
      structureKind: null,
    } as any);
    dal.countRootLessons!.mockResolvedValue(0);

    await expect(
      units.createUnit(
        'course-1',
        { title: { en: 'U1', ar: 'و1' } },
        teacherCaller as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(dal.saveUnit).not.toHaveBeenCalled();
  });

  it('allows updating unit title while published (metadata only)', async () => {
    dal.findCourse!.mockResolvedValue({
      id: 'course-1',
      schoolId: 'school-1',
      teacherId: 'teacher-1',
      isPublished: true,
      structureKind: CourseStructureKind.NESTED,
    } as any);
    const updatedUnit = {
      id: 'unit-1',
      courseId: 'course-1',
      position: 0,
      title: { en: 'New', ar: 'جديد' },
      description: null,
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dal.listUnitsWithLessonsAndItems = jest
      .fn()
      .mockResolvedValue([updatedUnit]);
    dal.findUnit = jest.fn().mockResolvedValue({
      id: 'unit-1',
      courseId: 'course-1',
      position: 0,
      title: { en: 'Old', ar: 'قديم' },
      description: null,
    } as any);
    dal.saveUnit = jest.fn().mockImplementation(async (u: any) => {
      Object.assign(updatedUnit, u);
      return updatedUnit;
    });

    const out = await units.updateUnit(
      'course-1',
      'unit-1',
      { title: { en: 'New', ar: 'جديد' } },
      teacherCaller as any,
    );
    expect(dal.saveUnit).toHaveBeenCalled();
    expect(out.units[0]?.title.en).toBe('New');
  });
});
