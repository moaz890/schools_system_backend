/**
 * Declared on {@link Course}: whether the class instance is auto-enrolled for all students
 * or chosen manually (elective). Kept under `lms/enums` so `Course` and `CourseEnrollment`
 * can share it without circular imports.
 */
export enum CourseCatalogEnrollmentType {
  MANDATORY = 'mandatory',
  ELECTIVE = 'elective',
}
