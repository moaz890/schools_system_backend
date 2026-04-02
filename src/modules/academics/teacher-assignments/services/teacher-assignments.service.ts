import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { User } from '../../../core/users/entities/user.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import type { CreateTeacherAssignmentDto } from '../dto/create-teacher-assignment.dto';
import type { EndTeacherAssignmentDto } from '../dto/end-teacher-assignment.dto';
import { TeacherAssignmentsDalService } from './teacher-assignments-dal.service';
import { TeacherAssignmentsHelpersService } from './teacher-assignments-helpers.service';

/** Assignments are scoped by classId + subjectId (+ academic year). Curriculum must match class grade. */
@Injectable()
export class TeacherAssignmentsService {
  constructor(
    private readonly dal: TeacherAssignmentsDalService,
    private readonly helpers: TeacherAssignmentsHelpersService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Subject)
    private readonly subjectsRepo: Repository<Subject>,
  ) {}

  async create(dto: CreateTeacherAssignmentDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const teacher = await this.usersRepo.findOne({
      where: { id: dto.teacherId, schoolId, role: UserRole.TEACHER },
    } as any);
    if (!teacher) {
      throw new NotFoundException('Teacher not found in your school');
    }

    const subject = await this.subjectsRepo.findOne({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found in your school');
    }

    const cls = await this.dal.findClassWithGradeForSchool(
      dto.classId,
      schoolId,
    );
    if (!cls) throw new NotFoundException('Class not found');

    const link = await this.dal.findCurriculumLink(
      cls.gradeLevelId,
      dto.subjectId,
    );
    if (!link) {
      throw new BadRequestException(
        'Subject is not part of this grade curriculum',
      );
    }

    const spec = await this.dal.findActiveSpecialization(
      schoolId,
      dto.teacherId,
      dto.subjectId,
    );
    if (!spec) {
      throw new BadRequestException(
        'Teacher is not specialized for this subject',
      );
    }

    const stageId = cls.gradeLevel?.stageId;
    if (!stageId) {
      throw new BadRequestException('Class grade level is missing stage');
    }

    if (
      spec.allowedStageIds != null &&
      spec.allowedStageIds.length > 0 &&
      !spec.allowedStageIds.includes(stageId)
    ) {
      throw new BadRequestException(
        'Teacher specialization does not cover this stage for the subject',
      );
    }

    const dupCount = await this.dal.countActiveDuplicate({
      schoolId,
      teacherId: dto.teacherId,
      classId: dto.classId,
      subjectId: dto.subjectId,
    });
    if (dupCount > 0) {
      throw new ConflictException(
        'An active assignment already exists for this teacher, class, and subject',
      );
    }

    const row = this.dal.createAssignment({
      schoolId,
      classId: dto.classId,
      teacherId: dto.teacherId,
      subjectId: dto.subjectId,
      academicYearId: cls.academicYearId,
      startDate: dto.startDate ?? new Date(),
      endDate: null,
      isActive: true,
    });

    const saved = await this.dal.saveAssignment(row);
    const full = await this.dal.findAssignmentById(schoolId, saved.id);
    if (!full) throw new NotFoundException('Assignment not found after create');
    return this.helpers.toPublicAssignment(full);
  }

  async end(id: string, dto: EndTeacherAssignmentDto, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    const row = await this.dal.findAssignmentById(schoolId, id);
    if (!row) throw new NotFoundException('Assignment not found');

    if (!row.isActive) {
      return this.helpers.toPublicAssignment(row);
    }

    row.isActive = false;
    row.endDate = dto.endDate ?? new Date();
    await this.dal.saveAssignment(row);
    const full = await this.dal.findAssignmentById(schoolId, id);
    if (!full) throw new NotFoundException('Assignment not found');
    return this.helpers.toPublicAssignment(full);
  }

  async listForClass(classId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const cls = await this.dal.findClassWithGradeForSchool(classId, schoolId);
    if (!cls) throw new NotFoundException('Class not found');

    const rows = await this.dal.listAssignmentsForClass(schoolId, classId);
    return rows.map((r) => this.helpers.toPublicAssignment(r));
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }
}
