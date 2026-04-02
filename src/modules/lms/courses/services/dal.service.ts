import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../entities/course.entity';
import { ClassSection } from '../../../academics/classes/entities/class.entity';
import { Subject } from '../../../academics/subjects/entities/subject.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';

@Injectable()
export class CoursesDalService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepo: Repository<Course>,
    @InjectRepository(ClassSection)
    private readonly classesRepo: Repository<ClassSection>,
    @InjectRepository(Subject)
    private readonly subjectsRepo: Repository<Subject>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findCourseById(courseId: string, schoolId: string) {
    return this.coursesRepo.findOne({
      where: { id: courseId, schoolId },
      relations: [
        'teacher',
        'classSection',
        'classSection.academicYear',
        'subject',
      ],
    });
  }

  async findClass(classId: string, schoolId: string) {
    const cls = await this.classesRepo.findOne({
      where: { id: classId, schoolId },
      relations: ['academicYear'],
    });

    if (!cls) throw new NotFoundException('Class not found');
    return cls;
  }

  async findSubject(subjectId: string, schoolId: string) {
    const subject = await this.subjectsRepo.findOne({
      where: { id: subjectId, schoolId },
    });

    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async findTeacher(teacherId: string, schoolId: string) {
    const teacher = await this.usersRepo.findOne({
      where: { id: teacherId, schoolId, role: UserRole.TEACHER },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  async findActiveCourseByClassSubject(
    schoolId: string,
    classId: string,
    subjectId: string,
  ) {
    return this.coursesRepo.findOne({
      where: { schoolId, classId, subjectId },
      // Soft-deleted courses are excluded by default (deleted_at IS NULL).
    });
  }

  async saveCourse(course: Course) {
    return this.coursesRepo.save(course);
  }

  async softDeleteCourse(course: Course) {
    await this.coursesRepo.softRemove(course);
  }

  async assertCanCreateCourse(
    schoolId: string,
    classId: string,
    subjectId: string,
  ) {
    const existing = await this.findActiveCourseByClassSubject(
      schoolId,
      classId,
      subjectId,
    );
    if (existing) {
      throw new BadRequestException(
        'Course already exists for this class and subject',
      );
    }
  }

  /**
   * Lists courses for a subject in the school. When `teacherId` is set, only that teacher's courses.
   */
  async findCoursesBySubject(
    schoolId: string,
    subjectId: string,
    options?: { teacherId?: string },
  ): Promise<Course[]> {
    const where: {
      schoolId: string;
      subjectId: string;
      teacherId?: string;
    } = { schoolId, subjectId };
    if (options?.teacherId) {
      where.teacherId = options.teacherId;
    }
    return this.coursesRepo.find({
      where,
      relations: [
        'teacher',
        'classSection',
        'classSection.academicYear',
        'subject',
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
