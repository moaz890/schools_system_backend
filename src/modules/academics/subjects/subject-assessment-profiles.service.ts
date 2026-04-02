import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { SubjectAssessmentProfile } from './entities/subject-assessment-profile.entity';
import { Subject } from './entities/subject.entity';
import { UpsertAssessmentProfileDto } from './dto/upsert-assessment-profile.dto';
import type { AssessmentComponentJson } from './types/assessment-component-json.type';
import type { AuthCaller } from '../../core/users/types/auth-caller.type';

const WEIGHT_SUM_TOLERANCE = 0.01;

@Injectable()
export class SubjectAssessmentProfilesService {
  constructor(
    @InjectRepository(SubjectAssessmentProfile)
    private readonly profileRepo: Repository<SubjectAssessmentProfile>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async getDefaultProfile(subjectId: string, caller: AuthCaller) {
    const schoolId = this.resolveSchoolId(caller);
    await this.assertSubjectInSchool(subjectId, schoolId);

    const profile = await this.profileRepo.findOne({
      where: {
        subjectId,
        gradeLevelId: IsNull(),
        academicYearId: IsNull(),
      },
    });

    if (!profile) {
      throw new NotFoundException(
        'No assessment profile for this subject yet; use PUT to create one',
      );
    }

    return profile;
  }

  async upsertDefaultProfile(
    subjectId: string,
    dto: UpsertAssessmentProfileDto,
    caller: AuthCaller,
  ) {
    const schoolId = this.resolveSchoolId(caller);
    await this.assertSubjectInSchool(subjectId, schoolId);

    this.assertWeightsSumTo100(dto.components);

    const components: AssessmentComponentJson[] = dto.components.map((c) => ({
      name: c.name.trim(),
      weight: c.weight,
      type: c.type,
      ...(c.best_of_x !== undefined ? { best_of_x: c.best_of_x } : {}),
    }));

    let profile = await this.profileRepo.findOne({
      where: {
        subjectId,
        gradeLevelId: IsNull(),
        academicYearId: IsNull(),
      },
    });

    if (!profile) {
      profile = this.profileRepo.create({
        subjectId,
        gradeLevelId: null,
        academicYearId: null,
        components,
      });
    } else {
      profile.components = components;
    }

    return this.profileRepo.save(profile);
  }

  private assertWeightsSumTo100(components: { weight: number }[]): void {
    const sum = components.reduce((acc, c) => acc + c.weight, 0);
    if (Math.abs(sum - 100) > WEIGHT_SUM_TOLERANCE) {
      throw new BadRequestException(
        `Component weights must sum to 100 (currently ${sum.toFixed(2)})`,
      );
    }
  }

  private resolveSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  private async assertSubjectInSchool(
    subjectId: string,
    schoolId: string,
  ): Promise<void> {
    const subject = await this.subjectRepo.findOne({
      where: { id: subjectId, schoolId },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
  }
}
