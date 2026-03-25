import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class UuidPrimaryKeysSchoolEmailCascade1742600000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(_queryRunner: QueryRunner): Promise<void>;
    private tableExists;
    private dropForeignKeys;
    private dropPrimaryKeys;
    private dropSchoolEmailUniqueIfSingleColumn;
}
