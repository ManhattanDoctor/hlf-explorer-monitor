import { MigrationInterface, QueryRunner } from 'typeorm';

export class LedgerBlockAdd1627121250010 implements MigrationInterface {
    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async up(queryRunner: QueryRunner): Promise<any> {
        const sql = `
            create table if not exists "ledger_block"
            (                
                "id" serial not null
                    constraint "ledger_block_id_pkey" primary key,
                "number" integer not null,
                "created_date" timestamp default now() not null
            );

            create unique index "ledger_block_ukey_number" on "ledger_block" (number);
        `;
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const sql = `
            drop table if exists "ledger_block" cascade;
            drop index if exists "ledger_block_ukey_number";
        `;
        await queryRunner.query(sql);
    }
}
