import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * LMS course enrollments (3.3 Phase 1) + courses.enrollment_type.
 */
export class CreateCourseEnrollments1742800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS enrollment_type varchar(24) NOT NULL DEFAULT 'mandatory'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        enrollment_type varchar(24) NOT NULL,
        status varchar(24) NOT NULL DEFAULT 'active',
        enrolled_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_course_enrollments_school_course
      ON course_enrollments (school_id, course_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_course_enrollments_school_student
      ON course_enrollments (school_id, student_id)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS UQ_course_enrollments_student_course_active
      ON course_enrollments (student_id, course_id)
      WHERE deleted_at IS NULL AND status = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS UQ_course_enrollments_student_course_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_course_enrollments_school_student`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_course_enrollments_school_course`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS course_enrollments`);
    await queryRunner.query(`
      ALTER TABLE courses DROP COLUMN IF EXISTS enrollment_type
    `);
  }
}
