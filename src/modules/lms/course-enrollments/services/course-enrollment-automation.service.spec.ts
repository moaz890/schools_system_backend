import { Test, TestingModule } from '@nestjs/testing';
import { CourseEnrollmentAutomationService } from './course-enrollment-automation.service';
import { CourseEnrollmentPersistenceService } from './course-enrollment-persistence.service';
import { StudentEnrolledEvent } from '../../../academics/events/student-enrolled.event';
import { MandatoryCourseLinkedToClassEvent } from '../../events/mandatory-course-linked-to-class.event';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';

describe('CourseEnrollmentAutomationService', () => {
  let service: CourseEnrollmentAutomationService;

  const persistence = {
    listMandatoryCoursesForClass: jest.fn(),
    listActiveStudentIdsInClass: jest.fn(),
    tryCreateActiveEnrollment: jest.fn(),
    findCourseById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseEnrollmentAutomationService,
        {
          provide: CourseEnrollmentPersistenceService,
          useValue: persistence,
        },
      ],
    }).compile();

    service = module.get(CourseEnrollmentAutomationService);
  });

  it('enrollStudentInMandatoryCoursesForClass enrolls in each mandatory course', async () => {
    persistence.listMandatoryCoursesForClass.mockResolvedValue([
      {
        id: 'c1',
        enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
      },
      {
        id: 'c2',
        enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
      },
    ]);
    persistence.tryCreateActiveEnrollment.mockResolvedValue(true);

    const event = new StudentEnrolledEvent(
      'school-1',
      'enr-1',
      'stu-1',
      'class-1',
      'year-1',
      'grade-1',
    );
    await service.enrollStudentInMandatoryCoursesForClass(event);

    expect(persistence.listMandatoryCoursesForClass).toHaveBeenCalledWith(
      'class-1',
      'school-1',
    );
    expect(persistence.tryCreateActiveEnrollment).toHaveBeenCalledTimes(2);
    expect(persistence.tryCreateActiveEnrollment).toHaveBeenNthCalledWith(1, {
      schoolId: 'school-1',
      studentId: 'stu-1',
      courseId: 'c1',
      enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
    });
  });

  it('enrollClassStudentsInMandatoryCourse skips when course is elective', async () => {
    persistence.findCourseById.mockResolvedValue({
      id: 'c1',
      classId: 'class-1',
      enrollmentType: CourseCatalogEnrollmentType.ELECTIVE,
    });

    await service.enrollClassStudentsInMandatoryCourse(
      new MandatoryCourseLinkedToClassEvent('school-1', 'c1', 'class-1'),
    );

    expect(persistence.listActiveStudentIdsInClass).not.toHaveBeenCalled();
  });

  it('enrollClassStudentsInMandatoryCourse enrolls roster when course is mandatory', async () => {
    persistence.findCourseById.mockResolvedValue({
      id: 'c1',
      classId: 'class-1',
      enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
    });
    persistence.listActiveStudentIdsInClass.mockResolvedValue(['s1', 's2']);
    persistence.tryCreateActiveEnrollment.mockResolvedValue(true);

    await service.enrollClassStudentsInMandatoryCourse(
      new MandatoryCourseLinkedToClassEvent('school-1', 'c1', 'class-1'),
    );

    expect(persistence.tryCreateActiveEnrollment).toHaveBeenCalledTimes(2);
  });
});
