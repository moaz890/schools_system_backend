import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class EmailUniquePerSchool1730150400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
