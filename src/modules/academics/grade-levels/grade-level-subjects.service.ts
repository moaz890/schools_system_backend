import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradeLevelSubject } from './entities/grade-level-subject.entity';
import { GradeLevel } from './entities/grade-level.entity';
import { Subject } from '../subjects/entities/subject.entity';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';

@Injectable()
export class GradeLevelSubjectsService {
    constructor(
        @InjectRepository(GradeLevelSubject)
        private readonly linkRepo: Repository<GradeLevelSubject>,
        @InjectRepository(GradeLevel)
        private readonly gradeLevelRepo: Repository<GradeLevel>,
        @InjectRepository(Subject)
        private readonly subjectRepo: Repository<Subject>,
    ) {}

    async listSubjectsForGrade(gradeLevelId: string, caller: AuthCaller) {
        const schoolId = this.resolveSchoolId(caller);
        await this.assertGradeInSchool(gradeLevelId, schoolId);

        const links = await this.linkRepo
            .createQueryBuilder('gls')
            .innerJoinAndSelect('gls.subject', 's')
            .where('gls.gradeLevelId = :gradeLevelId', { gradeLevelId })
            .andWhere('gls.deletedAt IS NULL')
            .andWhere('s.deletedAt IS NULL')
            .orderBy('s.code', 'ASC')
            .getMany();

        return links.map((l) => l.subject);
    }

    async linkSubject(
        gradeLevelId: string,
        subjectId: string,
        caller: AuthCaller,
    ) {
        const schoolId = this.resolveSchoolId(caller);
        await this.assertGradeInSchool(gradeLevelId, schoolId);
        const subject = await this.subjectRepo.findOne({
            where: { id: subjectId, schoolId },
        });
        if (!subject) {
            throw new NotFoundException('Subject not found in your school');
        }

        await this.assertLinkUnique(gradeLevelId, subjectId);

        const row = this.linkRepo.create({
            gradeLevelId,
            subjectId,
        });
        return this.linkRepo.save(row);
    }

    async unlinkSubject(
        gradeLevelId: string,
        subjectId: string,
        caller: AuthCaller,
    ) {
        const schoolId = this.resolveSchoolId(caller);
        await this.assertGradeInSchool(gradeLevelId, schoolId);

        const link = await this.linkRepo.findOne({
            where: { gradeLevelId, subjectId },
        });
        if (!link) {
            throw new NotFoundException('This subject is not linked to this grade level');
        }

        await this.linkRepo.softRemove(link);
    }

    private resolveSchoolId(caller: AuthCaller): string {
        if (!caller.schoolId) {
            throw new BadRequestException('You must be assigned to a school');
        }
        return caller.schoolId;
    }

    private async assertGradeInSchool(
        gradeLevelId: string,
        schoolId: string,
    ): Promise<GradeLevel> {
        const grade = await this.gradeLevelRepo.findOne({
            where: { id: gradeLevelId, schoolId },
        });
        if (!grade) {
            throw new NotFoundException('Grade level not found');
        }
        return grade;
    }

    private async assertLinkUnique(
        gradeLevelId: string,
        subjectId: string,
    ): Promise<void> {
        const existing = await this.linkRepo
            .createQueryBuilder('gls')
            .where('gls.gradeLevelId = :gradeLevelId', { gradeLevelId })
            .andWhere('gls.subjectId = :subjectId', { subjectId })
            .andWhere('gls.deletedAt IS NULL')
            .getOne();

        if (existing) {
            throw new ConflictException(
                'This subject is already linked to this grade level',
            );
        }
    }
}
