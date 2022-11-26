import { MigrationInterface, QueryRunner } from 'typeorm';

export class LedgerInfoAdd1627121250000 implements MigrationInterface {
    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async up(queryRunner: QueryRunner): Promise<any> {
        const sql = `
            create table if not exists "ledger_info"
            (                
                "id" serial not null
                    constraint "ledger_info_id_pkey" primary key,
                "name" varchar not null,
                "ledger_id" integer not null,
                "block_height" integer not null,
                "block_frequency" integer not null,
                "block_height_parsed" integer not null
            );

            create index "ledger_info_ukey_name" on "ledger_info" (name);
        `;
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const sql = `
            drop table if exists "ledger_info" cascade;
            drop index if exists "ledger_info_ukey_name";
        `;
        await queryRunner.query(sql);
    }
}
