import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../courses/entities/course.entity';
import { CourseEnrollment } from '../entities/course-enrollment.entity';
import { Enrollment } from '../../../academics/enrollments/entities/enrollment.entity';
import { EnrollmentStatus } from '../../../academics/enrollments/enums/enrollment-status.enum';
import { CourseCatalogEnrollmentType } from '../../enums/course-catalog-enrollment-type.enum';
import { CourseEnrollmentStatus } from '../enums/course-enrollment-status.enum';

/**
 * Data access for course enrollments and related reads (class roster, mandatory courses).
 * Keeps SQL/TypeORM out of domain automation and listeners (SRP).
 */
@Injectable()
export class CourseEnrollmentPersistenceService {
  constructor(
    @InjectRepository(CourseEnrollment)
    private readonly courseEnrollmentRepo: Repository<CourseEnrollment>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly classEnrollmentRepo: Repository<Enrollment>,
  ) {}

  async findCourseById(courseId: string, schoolId: string): Promise<Course | null> {
    return this.courseRepo.findOne({
      where: { id: courseId, schoolId },
    });
  }

  async findActiveEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<CourseEnrollment | null> {
    return this.courseEnrollmentRepo.findOne({
      where: {
        studentId,
        courseId,
        status: CourseEnrollmentStatus.ACTIVE,
      },
    });
  }

  /**
   * All non–soft-deleted mandatory catalog courses for the class (same school).
   */
  async listMandatoryCoursesForClass(
    classId: string,
    schoolId: string,
  ): Promise<Course[]> {
    return this.courseRepo.find({
      where: {
        classId,
        schoolId,
        enrollmentType: CourseCatalogEnrollmentType.MANDATORY,
      },
      select: ['id', 'schoolId', 'classId', 'enrollmentType'],
    });
  }

  async listActiveStudentIdsInClass(
    classId: string,
    schoolId: string,
  ): Promise<string[]> {
    const rows = await this.classEnrollmentRepo.find({
      where: {
        classId,
        schoolId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: ['studentId'],
    });
    return rows.map((r) => r.studentId);
  }

  /**
   * Creates an ACTIVE row if none exists for (student, course) with status active.
   * Returns false if already enrolled or on unique race (idempotent).
   */
  async tryCreateActiveEnrollment(params: {
    schoolId: string;
    studentId: string;
    courseId: string;
    enrollmentType: CourseCatalogEnrollmentType;
  }): Promise<boolean> {
    const dup = await this.courseEnrollmentRepo.findOne({
      where: {
        studentId: params.studentId,
        courseId: params.courseId,
        status: CourseEnrollmentStatus.ACTIVE,
      },
    });
    if (dup) return false;

    const row = this.courseEnrollmentRepo.create({
      schoolId: params.schoolId,
      studentId: params.studentId,
      courseId: params.courseId,
      enrollmentType: params.enrollmentType,
      status: CourseEnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    });

    try {
      await this.courseEnrollmentRepo.save(row);
      return true;
    } catch (e: any) {
      if (e?.code === '23505') return false;
      throw e;
    }
  }
}
