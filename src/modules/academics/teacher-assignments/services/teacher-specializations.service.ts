import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { TeacherSubjectSpecialization } from '../entities/teacher-subject-specialization.entity';
import { User } from '../../../core/users/entities/user.entity';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { Subject } from '../../subjects/entities/subject.entity';
import { Stage } from '../../stages/entities/stage.entity';
import type { UpsertTeacherSpecializationDto } from '../dto/upsert-teacher-specialization.dto';

@Injectable()
export class TeacherSpecializationsService {
  constructor(
    @InjectRepository(TeacherSubjectSpecialization)
    private readonly repo: Repository<TeacherSubjectSpecialization>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Subject)
    private readonly subjectsRepo: Repository<Subject>,
    @InjectRepository(Stage)
    private readonly stagesRepo: Repository<Stage>,
  ) {}

  async upsert(
    
    dto: UpsertTeacherSpecializationDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.resolveSchoolId(caller);

    const teacher = await this.usersRepo.findOne({
      where: { id: dto.teacherId, schoolId, role: UserRole.TEACHER },
    } as any);
    if (!teacher) throw new NotFoundException('Teacher not found in your school');

    const subject = await this.subjectsRepo.findOne({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found in your school');

    const allowedStageIds =
      dto.allowedStageIds == null || dto.allowedStageIds.length === 0
        ? null
        : [...new Set(dto.allowedStageIds)];

    if (allowedStageIds) {
      const count = await this.stagesRepo.count({
        where: { schoolId, id: In(allowedStageIds) },
      });
      if (count !== allowedStageIds.length) {
        throw new BadRequestException(
          'One or more stageIds are invalid for this school',
        );
      }
    }

    const existing = await this.repo.findOne({
      where: { schoolId, teacherId: dto.teacherId, subjectId: dto.subjectId } as any,
    });

    if (existing && existing.deletedAt == null) {
      existing.allowedStageIds = allowedStageIds;
      const saved = await this.repo.save(existing);
      return {
        id: saved.id,
        teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
        subject: { id: subject.id, code: subject.code, name: subject.name },
        allowedStageIds: saved.allowedStageIds,
      };
    }

    // If there is a soft-deleted row, reuse it by clearing deletedAt.
    let row =
      existing ??
      this.repo.create({
        schoolId,
        teacherId: dto.teacherId,
        subjectId: dto.subjectId,
        allowedStageIds,
      });

    row.schoolId = schoolId;
    row.teacherId = dto.teacherId || "";
    row.subjectId = dto.subjectId || "";
    row.allowedStageIds = allowedStageIds;
    row.deletedAt = null;

    row = await this.repo.save(row);

    return {
      id: row.id,
      teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
      subject: { id: subject.id, code: subject.code, name: subject.name },
      allowedStageIds: row.allowedStageIds,
    };
  }

  async listEligibleTeachersForSubject(
    subjectId: string,
    stageId: string | undefined,
    caller: AuthCaller,
  ) {
    const schoolId = this.resolveSchoolId(caller);

    const subject = await this.subjectsRepo.findOne({
      where: { id: subjectId, schoolId },
    });
    if (!subject) throw new NotFoundException('Subject not found in your school');

    if (stageId) {
      const stage = await this.stagesRepo.findOne({
        where: { id: stageId, schoolId },
      });
      if (!stage) throw new NotFoundException('Stage not found in your school');
    }

    // eligible if specialization exists and either allowedStageIds is null OR contains stageId.
    const qb = this.repo
      .createQueryBuilder('sp')
      .innerJoinAndSelect('sp.teacher', 't')
      .where('sp.schoolId = :schoolId', { schoolId })
      .andWhere('sp.subjectId = :subjectId', { subjectId })
      .andWhere('sp.deletedAt IS NULL')
      .andWhere('t.deletedAt IS NULL')
      .andWhere('t.role = :role', { role: UserRole.TEACHER });

    if (stageId) {
      qb.andWhere(
        new Brackets((q) => {
          q.where('sp.allowedStageIds IS NULL').orWhere(
            ':stageId = ANY(sp.allowedStageIds)',
            { stageId },
          );
        }),
      );
    }

    const rows = await qb.orderBy('t.email', 'ASC').getMany();

    return rows.map((r) => ({
      id: r.teacher.id,
      email: r.teacher.email,
      name: r.teacher.name,
    }));
  }

  async listSubjectsForTeacher(teacherId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);

    const teacher = await this.usersRepo.findOne({
      where: { id: teacherId, schoolId, role: UserRole.TEACHER },
    } as any);
    if (!teacher) throw new NotFoundException('Teacher not found in your school');

    const rows = await this.repo
      .createQueryBuilder('sp')
      .innerJoinAndSelect('sp.subject', 'sub')
      .where('sp.schoolId = :schoolId', { schoolId })
      .andWhere('sp.teacherId = :teacherId', { teacherId })
      .andWhere('sp.deletedAt IS NULL')
      .andWhere('sub.deletedAt IS NULL')
      .orderBy('sub.code', 'ASC')
      .getMany();

    return {
      teacher: { id: teacher.id, email: teacher.email, name: teacher.name },
      subjects: rows.map((r) => ({
        id: r.subject.id,
        code: r.subject.code,
        name: r.subject.name,
        allowedStageIds: r.allowedStageIds,
      })),
    };
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }
}

