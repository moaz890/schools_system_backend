import { Injectable } from '@nestjs/common';
import type { LocalizedString } from '../../../../common/i18n/localized-string.type';
import { TeacherAssignment } from '../entities/teacher-assignment.entity';

export type PublicTeacherAssignmentResponse = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  teacher: { id: string; email: string; name: LocalizedString };
  subject: { id: string; code: string; name: LocalizedString };
  classId: string;
  academicYearId: string;
};

@Injectable()
export class TeacherAssignmentsHelpersService {
  toPublicAssignment(row: TeacherAssignment): PublicTeacherAssignmentResponse {
    return {
      id: row.id,
      startDate: row.startDate,
      endDate: row.endDate,
      isActive: row.isActive,
      classId: row.classId,
      academicYearId: row.academicYearId,
      teacher: {
        id: row.teacher.id,
        email: row.teacher.email,
        name: row.teacher.name,
      },
      subject: {
        id: row.subject.id,
        code: row.subject.code,
        name: row.subject.name,
      },
    };
  }
}
