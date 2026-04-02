/**
 * Academic read/write scoping (enrollment → class → grade curriculum).
 *
 * - A student’s subjects are **derived**: active enrollment → `classId` → class’s
 *   `gradeLevelId` → `grade_level_subjects` → subjects. Do **not** duplicate
 *   per-student subject membership rows unless product explicitly requires snapshots.
 *
 * - **Teacher assignments**, and future **exams / class assignments / grades**, should
 *   anchor on **`classId` + `subjectId`** (and `academicYearId` where applicable), not on
 *   `gradeLevelId` alone, so data lines up with the class the student is in.
 *
 * - When removing a subject from a grade level, block removal if any non-deleted
 *   `teacher_assignments` still reference that subject for classes in that grade; extend
 *   the same pattern for exam/grade tables when they exist.
 */

export {};
