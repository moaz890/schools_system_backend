import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthCaller } from '../../../core/users/types/auth-caller.type';
import { ClassSection } from '../entities/class.entity';
import type {
  PublicAcademicYearSnippet,
  PublicClassResponse,
  PublicGradeLevelSnippet,
  PublicHomeroomTeacherSnippet,
} from '../types/class-public.types';

@Injectable()
export class ClassesHelpersService {
  private readonly sectionLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  resolveCallerSchoolId(caller: AuthCaller): string {
    if (!caller.schoolId) {
      throw new BadRequestException('You must be assigned to a school');
    }
    return caller.schoolId;
  }

  assertValidClassCapacity(capacity: number): void {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new BadRequestException(
        'capacity must be an integer greater than 0',
      );
    }
  }

  sectionLetterForExistingClassCount(count: number): string {
    if (count < 0 || count >= this.sectionLetters.length) {
      throw new BadRequestException(
        `Too many classes for this grade/year (max ${this.sectionLetters.length} letters: A-${this.sectionLetters[this.sectionLetters.length - 1]})`,
      );
    }
    return this.sectionLetters[count];
  }

  localizedSectionName(
    gradeNameEn: string,
    gradeNameAr: string,
    letter: string,
  ): { en: string; ar: string } {
    return {
      en: `${gradeNameEn} ${letter}`,
      ar: `${gradeNameAr} ${letter}`,
    };
  }

  private toPublicGradeLevel(
    c: ClassSection,
  ): PublicGradeLevelSnippet | null {
    if (!c.gradeLevel) return null;
    const g = c.gradeLevel;
    return {
      id: g.id,
      name: g.name,
      order: g.order,
    };
  }

  private toPublicAcademicYear(
    c: ClassSection,
  ): PublicAcademicYearSnippet | null {
    if (!c.academicYear) return null;
    const y = c.academicYear;
    return {
      id: y.id,
      name: y.name,
      startDate: y.startDate,
      endDate: y.endDate,
      isCurrent: y.isCurrent,
    };
  }

  private toPublicHomeroomTeacher(
    c: ClassSection,
  ): PublicHomeroomTeacherSnippet | null {
    if (!c.homeroomTeacher) return null;
    const t = c.homeroomTeacher;
    return {
      id: t.id,
      email: t.email,
      name: t.name,
    };
  }

  /**
   * Maps a `ClassSection` loaded with `gradeLevel`, `academicYear`, and `homeroomTeacher`.
   */
  toPublicClassResponse(c: ClassSection): PublicClassResponse {
    const gradeLevel = this.toPublicGradeLevel(c);
    const academicYear = this.toPublicAcademicYear(c);
    const homeroomTeacher = this.toPublicHomeroomTeacher(c);

    if (!gradeLevel || !academicYear || !homeroomTeacher) {
      throw new Error(
        'toPublicClassResponse requires gradeLevel, academicYear, and homeroomTeacher relations',
      );
    }

    return {
      id: c.id,
      schoolId: c.schoolId,
      gradeLevelId: c.gradeLevelId,
      gradeLevel,
      academicYearId: c.academicYearId,
      academicYear,
      sectionLetter: c.sectionLetter,
      name: c.name,
      capacity: c.capacity,
      homeroomTeacher,
    };
  }
}
