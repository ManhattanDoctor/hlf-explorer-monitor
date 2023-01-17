import { Exclude, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { Column, Index, Entity, PrimaryGeneratedColumn, BeforeUpdate, BeforeInsert } from 'typeorm';
import { LedgerBlock } from '@hlf-explorer/common';
import { ObjectUtil, ValidateUtil } from '@ts-core/common';
import * as _ from 'lodash';

@Entity('ledger_block')
export class LedgerBlockEntity {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    @Exclude()
    @PrimaryGeneratedColumn()
    @IsOptional()
    @IsNumber()
    public id: number;

    @Column()
    @IsNumber()
    public number: number;

    @Column()
    @IsDate()
    @Type(() => Date)
    public date: Date;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(item?: LedgerBlock) {
        if (!_.isNil(item)) {
            ObjectUtil.copyProperties(item, this, ['number', 'date']);
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    @BeforeUpdate()
    @BeforeInsert()
    public validate(): void {
        ValidateUtil.validate(this);
    }
}
