import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * CUMULATIVE_AVERAGE is reserved for a future release. Existing rows are moved to CREDIT_HOURS.
 * The PostgreSQL enum type may still list CUMULATIVE_AVERAGE; the app only exposes CREDIT_HOURS and TOTAL_POINTS.
 *
 * Do not cast the RHS to `calculation_method_enum`: TypeORM often names the type
 * `school_strategies_calculation_method_enum`. An unquoted string literal is coerced to the column type.
 */
export class RetireCumulativeAverageStrategy1742710000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            UPDATE school_strategies
            SET calculation_method = 'CREDIT_HOURS',
                updated_at = NOW()
            WHERE calculation_method::text = 'CUMULATIVE_AVERAGE'
        `);
  }

  public async down(): Promise<void> {
    // Irreversible: previous CUMULATIVE_AVERAGE assignments are not tracked.
  }
}
