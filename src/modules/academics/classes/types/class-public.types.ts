import type { LocalizedString } from '../../../../common/i18n/localized-string.type';

/** API-facing class payload: no audit columns; nested objects omit `schoolId` and timestamps. */
export type PublicGradeLevelSnippet = {
  id: string;
  name: LocalizedString;
  order: number;
};

export type PublicAcademicYearSnippet = {
  id: string;
  name: LocalizedString;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
};

export type PublicHomeroomTeacherSnippet = {
  id: string;
  email: string;
  name: LocalizedString;
};

export type PublicClassResponse = {
  id: string;
  schoolId: string;
  gradeLevelId: string;
  gradeLevel: PublicGradeLevelSnippet;
  academicYearId: string;
  academicYear: PublicAcademicYearSnippet;
  sectionLetter: string;
  name: LocalizedString;
  capacity: number;
  /** Teacher id lives here only (no duplicate `homeroomTeacherId` on the class root). */
  homeroomTeacher: PublicHomeroomTeacherSnippet;
};
