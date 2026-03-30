import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Enrollment } from '../entities/enrollment.entity';
import { StudentGradeLevel } from '../entities/student-grade-level.entity';
import { ClassSection } from '../../classes/entities/class.entity';
import { User } from '../../../core/users/entities/user.entity';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { CreateEnrollmentDto } from '../dto/create-enrollment.dto';

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
  ) {}

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

    return this.enrollmentRepo.save(enrollment);
  }

  async listActiveStudentsForClass(classId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const cls = await this.classRepo.findOne({ where: { id: classId, schoolId } });
    if (!cls) throw new NotFoundException('Class not found');

    return this.enrollmentRepo.find({
      where: {
        schoolId,
        classId,
        status: EnrollmentStatus.ACTIVE,
      } as any,
      relations: ['student'],
      order: { enrollmentDate: 'ASC' } as any,
    });
  }

  async listStudentEnrollments(studentId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const student = await this.usersRepo.findOne({
      where: { id: studentId, schoolId, role: UserRole.STUDENT },
    } as any);
    if (!student) throw new NotFoundException('Student not found');

    return this.enrollmentRepo.find({
      where: { schoolId, studentId } as any,
      relations: ['class', 'class.gradeLevel', 'class.academicYear'],
      order: { enrollmentDate: 'DESC' } as any,
    });
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }
}

