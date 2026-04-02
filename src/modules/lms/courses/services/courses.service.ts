import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { CoursesDalService } from './dal.service';
import type { CreateCourseDto } from '../dto/create-course.dto';
import type { UpdateCourseDto } from '../dto/update-course.dto';
import { Course } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(private readonly dal: CoursesDalService) {}

  private assertTeacherCreatesForSelf(dto: CreateCourseDto, caller: AuthCaller) {
    if (caller.role === UserRole.TEACHER && dto.teacherId !== caller.id) {
      throw new BadRequestException('Teacher can only create for themselves');
    }
  }

  private assertTeacherOwnsCourse(caller: AuthCaller, course: Course) {
    if (caller.role === UserRole.TEACHER && course.teacherId !== caller.id) {
      throw new BadRequestException('Teacher can only access their own courses');
    }
  }

  private assertTeacherCanUpdateTeacherId(
    dto: UpdateCourseDto,
    caller: AuthCaller,
  ) {
    if (
      caller.role === UserRole.TEACHER &&
      dto.teacherId !== undefined &&
      dto.teacherId !== caller.id
    ) {
      throw new BadRequestException(
        'Teacher can only reassign teacher to themselves',
      );
    }
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private assertDatesInOrder(startDate: Date, endDate: Date) {
    if (endDate < startDate) {
      throw new BadRequestException(
        'endDate must be greater than or equal to startDate',
      );
    }
  }

  private assertDatesWithinAcademicYear(params: {
    startDate: Date;
    endDate: Date;
    academicYearStart: Date;
    academicYearEnd: Date;
    context: string;
  }) {
    const { startDate, endDate, academicYearStart, academicYearEnd, context } =
      params;
    if (startDate < academicYearStart || endDate > academicYearEnd) {
      throw new BadRequestException(
        `${context}: course dates must fall within the class academic year`,
      );
    }
  }

  async create(dto: CreateCourseDto, caller: AuthCaller): Promise<Course> {
    const schoolId = this.resolveSchoolId(caller);
    this.assertTeacherCreatesForSelf(dto, caller);

    const cls = await this.dal.findClass(dto.classId, schoolId);
    const subject = await this.dal.findSubject(dto.subjectId, schoolId);
    const teacher = await this.dal.findTeacher(dto.teacherId, schoolId);

    // Redundant safety check in case role enforcement changes elsewhere.
    if (teacher.role !== UserRole.TEACHER) {
      throw new ConflictException('Assigned teacher is not a teacher');
    }

    this.assertDatesInOrder(dto.startDate, dto.endDate);

    // Optional validation: since requirements say academic year is derived from class,
    // keep course access window inside that academic year.
    this.assertDatesWithinAcademicYear({
      startDate: dto.startDate,
      endDate: dto.endDate,
      academicYearStart: cls.academicYear.startDate,
      academicYearEnd: cls.academicYear.endDate,
      context: 'Invalid course dates',
    });

    await this.dal.assertCanCreateCourse(schoolId, dto.classId, dto.subjectId);

    const course = new Course();
    course.schoolId = schoolId;
    course.classId = dto.classId;
    course.classSection = cls;
    course.subjectId = subject.id;
    course.subject = subject;
    course.teacherId = dto.teacherId;
    course.teacher = teacher;

    course.description = dto.description ?? null;
    course.objectives = dto.objectives ?? null;
    course.durationLabel = dto.durationLabel ?? null;
    course.startDate = dto.startDate;
    course.endDate = dto.endDate;
    course.sequentialLearningEnabled = dto.sequentialLearningEnabled ?? false;
    course.isPublished = dto.isPublished ?? false;

    return this.dal.saveCourse(course);
  }

  async update(courseId: string, dto: UpdateCourseDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');

    this.assertTeacherCanUpdateTeacherId(dto, caller);
    this.assertTeacherOwnsCourse(caller, course);

    // If classId changes, recompute the academic year boundaries for validation.
    const nextClassId = dto.classId ?? course.classId;
    const nextSubjectId = dto.subjectId ?? course.subjectId;
    const nextTeacherId = dto.teacherId ?? course.teacherId;

    const shouldValidateUniqueness =
      dto.classId !== undefined || dto.subjectId !== undefined;
    if (shouldValidateUniqueness) {
      const existing = await this.dal.findActiveCourseByClassSubject(
        schoolId,
        nextClassId,
        nextSubjectId,
      );
      if (existing && existing.id !== course.id) {
        throw new ConflictException(
          'Course already exists for this class and subject',
        );
      }
    }

    const cls =
      dto.classId !== undefined
        ? await this.dal.findClass(nextClassId, schoolId)
        : undefined;
    if (cls) {
      // Validate updated dates against new class academic year.
      const nextStartDate = dto.startDate ?? course.startDate;
      const nextEndDate = dto.endDate ?? course.endDate;
      this.assertDatesInOrder(nextStartDate, nextEndDate);
      this.assertDatesWithinAcademicYear({
        startDate: nextStartDate,
        endDate: nextEndDate,
        academicYearStart: cls.academicYear.startDate,
        academicYearEnd: cls.academicYear.endDate,
        context: 'Invalid course dates',
      });
      course.classSection = cls;
    }

    // Teacher validation (if provided).
    if (dto.teacherId !== undefined) {
      const teacher = await this.dal.findTeacher(nextTeacherId, schoolId);
      course.teacherId = teacher.id;
      course.teacher = teacher;
    }

    if (dto.classId !== undefined) course.classId = dto.classId;
    if (dto.subjectId !== undefined) {
      const subject = await this.dal.findSubject(nextSubjectId, schoolId);
      course.subjectId = subject.id;
      course.subject = subject;
    }

    if (dto.description !== undefined)
      course.description = dto.description ?? null;
    if (dto.objectives !== undefined)
      course.objectives = dto.objectives ?? null;
    if (dto.durationLabel !== undefined)
      course.durationLabel = dto.durationLabel ?? null;
    if (dto.sequentialLearningEnabled !== undefined)
      course.sequentialLearningEnabled = dto.sequentialLearningEnabled;
    if (dto.isPublished !== undefined) course.isPublished = dto.isPublished;

    // Dates validation (if updated).
    if (dto.startDate !== undefined || dto.endDate !== undefined) {
      const nextStartDate = dto.startDate ?? course.startDate;
      const nextEndDate = dto.endDate ?? course.endDate;
      this.assertDatesInOrder(nextStartDate, nextEndDate);
    }

    // Persist changes.
    return this.dal.saveCourse(course);
  }

  async delete(courseId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');
    this.assertTeacherOwnsCourse(caller, course);
    await this.dal.softDeleteCourse(course);
  }

  async get(courseId: string, caller: AuthCaller): Promise<Course> {
    const schoolId = this.resolveSchoolId(caller);
    const course = await this.dal.findCourseById(courseId, schoolId);
    if (!course) throw new NotFoundException('Course not found');
    this.assertTeacherOwnsCourse(caller, course);
    return course;
  }

  /**
   * Courses for a subject in the school. Teachers only see their own courses.
   */
  async listBySubject(
    subjectId: string,
    caller: AuthCaller,
  ): Promise<Course[]> {
    const schoolId = this.resolveSchoolId(caller);
    await this.dal.findSubject(subjectId, schoolId);

    const teacherId =
      caller.role === UserRole.TEACHER ? caller.id : undefined;
    return this.dal.findCoursesBySubject(schoolId, subjectId, {
      teacherId,
    });
  }
}
