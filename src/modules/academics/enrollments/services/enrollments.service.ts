import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { StudentGradeLevel } from '../entities/student-grade-level.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { User } from '../../../core/users/entities/user.entity';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { CreateEnrollmentDto } from '../dto/create-enrollment.dto';
import type { UpdateEnrollmentDto } from '../dto/update-enrollment.dto';
import { STUDENT_ENROLLED_EVENT } from '../../events/academics-events.constants';
import { StudentEnrolledEvent } from '../../events/student-enrolled.event';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(StudentGradeLevel)
    private readonly studentGradeLevelRepo: Repository<StudentGradeLevel>,
    @InjectRepository(ClassSection)
    private readonly classRepo: Repository<ClassSection>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private toSafeStudentPayload(student: User) {
    return {
      id: student.id,
      // LocalizedString { en, ar }
      name: student.name,
      email: student.email,
    };
  }

  private toSafeClassPayload(cls: ClassSection) {
    return {
      id: cls.id,
      sectionLetter: cls.sectionLetter,
      name: cls.name,
      gradeLevel: cls.gradeLevel
        ? { id: cls.gradeLevel.id, name: cls.gradeLevel.name }
        : undefined,
      academicYear: cls.academicYear
        ? { id: cls.academicYear.id, name: cls.academicYear.name }
        : undefined,
    };
  }

  private toSafeEnrollmentHistoryPayload(enrollment: Enrollment) {
    return {
      id: enrollment.id,
      status: enrollment.status,
      enrollmentDate: enrollment.enrollmentDate,
      class: enrollment.class
        ? this.toSafeClassPayload(enrollment.class)
        : undefined,
    };
  }

  async create(dto: CreateEnrollmentDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const student = await this.usersRepo.findOne({
      where: { id: dto.studentId, schoolId, role: UserRole.STUDENT },
    } as any);
    if (!student) {
      throw new NotFoundException('Student not found in your school');
    }

    const cls = await this.classRepo.findOne({
      where: { id: dto.classId, schoolId },
      relations: ['gradeLevel'],
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    const academicYearId = cls.academicYearId;
    const classGradeLevelId = cls.gradeLevelId;

    // 1) Placement must exist and must match the class grade for this academic year.
    const activePlacement = await this.studentGradeLevelRepo.findOne({
      where: {
        schoolId,
        studentId: dto.studentId,
        academicYearId,
        status: EnrollmentStatus.ACTIVE,
      } as any,
    });

    if (!activePlacement) {
      await this.studentGradeLevelRepo.save(
        this.studentGradeLevelRepo.create({
          schoolId,
          studentId: dto.studentId,
          academicYearId,
          gradeLevelId: classGradeLevelId,
          status: EnrollmentStatus.ACTIVE,
        }),
      );
    } else if (activePlacement.gradeLevelId !== classGradeLevelId) {
      throw new BadRequestException(
        'Student grade placement does not match the class grade level for this academic year',
      );
    }

    // 2) Active uniqueness: one active enrollment per student per academic year.
    const activeEnrollmentCount = await this.enrollmentRepo.count({
      where: {
        schoolId,
        studentId: dto.studentId,
        academicYearId,
        status: EnrollmentStatus.ACTIVE,
      } as any,
    });

    if (activeEnrollmentCount > 0) {
      throw new BadRequestException(
        'Student already has an active enrollment for this academic year',
      );
    }

    // 3) Capacity check based on active enrollments for this class.
    const activeInClass = await this.enrollmentRepo.count({
      where: {
        schoolId,
        classId: dto.classId,
        status: EnrollmentStatus.ACTIVE,
      } as any,
    });

    if (activeInClass >= cls.capacity) {
      throw new BadRequestException('Class is full');
    }

    const enrollmentDate = dto.enrollmentDate ?? new Date();

    const enrollment = this.enrollmentRepo.create({
      schoolId,
      studentId: dto.studentId,
      classId: dto.classId,
      academicYearId,
      enrollmentDate,
      status: EnrollmentStatus.ACTIVE,
    });

    const saved = await this.enrollmentRepo.save(enrollment);

    this.eventEmitter.emit(
      STUDENT_ENROLLED_EVENT,
      new StudentEnrolledEvent(
        schoolId,
        saved.id,
        dto.studentId,
        dto.classId,
        academicYearId,
        classGradeLevelId,
      ),
    );

    return saved;
  }

  async listActiveStudentsForClass(classId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const cls = await this.classRepo.findOne({
      where: { id: classId, schoolId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const enrollments = await this.enrollmentRepo.find({
      where: {
        schoolId,
        classId,
        status: EnrollmentStatus.ACTIVE,
      } as any,
      relations: ['student'],
      order: { enrollmentDate: 'ASC' } as any,
    });

    // Avoid leaking passwordHash/createdAt/etc from `User` relation.
    return enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      enrollmentDate: e.enrollmentDate,
      classId: e.classId,
      student: e.student ? this.toSafeStudentPayload(e.student) : undefined,
    }));
  }

  async listStudentEnrollments(studentId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const student = await this.usersRepo.findOne({
      where: { id: studentId, schoolId, role: UserRole.STUDENT },
    } as any);
    if (!student) throw new NotFoundException('Student not found');

    const enrollments = await this.enrollmentRepo.find({
      where: { schoolId, studentId } as any,
      relations: ['class', 'class.gradeLevel', 'class.academicYear'],
      order: { enrollmentDate: 'DESC' } as any,
    });

    // Avoid leaking internal `createdAt`/`updatedAt`/capacity/homeroomTeacher
    // by returning only what the UI needs.
    return enrollments.map((e) => this.toSafeEnrollmentHistoryPayload(e));
  }

  async update(
    enrollmentId: string,
    dto: UpdateEnrollmentDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.resolveSchoolId(caller);

    const enrollment = await this.enrollmentRepo.findOne({
      where: { id: enrollmentId, schoolId } as any,
      relations: ['class', 'class.gradeLevel', 'class.academicYear'],
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Validate allowed transitions only when activating.
    if (dto.status === EnrollmentStatus.ACTIVE) {
      // 1) Make sure student has no other active enrollment for this academic year.
      const otherActiveCount = await this.enrollmentRepo.count({
        where: {
          schoolId,
          studentId: enrollment.studentId,
          academicYearId: enrollment.academicYearId,
          status: EnrollmentStatus.ACTIVE,
          id: Not(enrollment.id),
        } as any,
      });

      if (otherActiveCount > 0) {
        throw new BadRequestException(
          'Student already has an active enrollment for this academic year',
        );
      }

      // 2) Placement must match the class grade level for this academic year.
      const activePlacement = await this.studentGradeLevelRepo.findOne({
        where: {
          schoolId,
          studentId: enrollment.studentId,
          academicYearId: enrollment.academicYearId,
          status: EnrollmentStatus.ACTIVE,
        } as any,
      });

      if (!activePlacement) {
        throw new BadRequestException(
          'Student grade placement is missing for this academic year',
        );
      }
      if (
        enrollment.class &&
        activePlacement.gradeLevelId !== enrollment.class.gradeLevelId
      ) {
        throw new BadRequestException(
          'Student grade placement does not match the class grade level for this academic year',
        );
      }

      // 3) Capacity check (active enrollments for this class).
      const classCapacity = enrollment.class?.capacity;
      if (classCapacity != null) {
        const activeInClass = await this.enrollmentRepo.count({
          where: {
            schoolId,
            classId: enrollment.classId,
            status: EnrollmentStatus.ACTIVE,
            id: Not(enrollment.id),
          } as any,
        });
        if (activeInClass >= classCapacity) {
          throw new BadRequestException('Class is full');
        }
      }
    }

    enrollment.status = dto.status;
    await this.enrollmentRepo.save(enrollment);

    if (dto.status === EnrollmentStatus.ACTIVE && enrollment.class) {
      this.eventEmitter.emit(
        STUDENT_ENROLLED_EVENT,
        new StudentEnrolledEvent(
          schoolId,
          enrollment.id,
          enrollment.studentId,
          enrollment.classId,
          enrollment.academicYearId,
          enrollment.class.gradeLevelId,
        ),
      );
    }

    // Return safe payload (same shape as history endpoint).
    // Note: we re-map from `enrollment` entity; it has class loaded from earlier.
    return this.toSafeEnrollmentHistoryPayload(enrollment);
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }
}
