/**
 * How lessons are organized for a course.
 * - `null`: no units or lessons yet.
 * - `flat`: root lessons only (`course_lessons.unit_id` is null); no `course_units` rows.
 * - `nested`: lessons under units; every lesson has `unit_id` set.
 */
export enum CourseStructureKind {
  FLAT = 'flat',
  NESTED = 'nested',
}
