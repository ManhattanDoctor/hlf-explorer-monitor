import { Ledger } from '@hlf-explorer/common';
import { TransformUtil, ObjectUtil, ValidateUtil } from '@ts-core/common';
import { IsInt, IsNumber, IsOptional, IsString, } from 'class-validator';
import { Column, Entity, Index, PrimaryGeneratedColumn, BeforeUpdate, BeforeInsert } from 'typeorm';
import { ILedgerInfo } from '../ILedgerInfo';

@Entity('ledger_info')
@Index(['name'], { unique: true })
export class LedgerInfoEntity implements ILedgerInfo {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    @PrimaryGeneratedColumn()
    @IsOptional()
    @IsNumber()
    public id: number;

    @Column()
    @IsString()
    public name: string;

    @Column({ name: 'ledger_id' })
    @IsNumber()
    public ledgerId: number;

    @Column({ name: 'block_height' })
    @IsInt()
    public blockHeight: number;

    @Column({ name: 'block_frequency' })
    @IsInt()
    public blockFrequency: number;

    @Column({ name: 'block_height_parsed' })
    @IsInt()
    public blockHeightParsed: number;

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async update(data: Partial<Ledger>): Promise<void> {
        ObjectUtil.copyProperties(data, this);
    }

    public toObject(): ILedgerInfo {
        return TransformUtil.fromClass<ILedgerInfo>(this, { excludePrefixes: ['__'] });
    }
    @BeforeUpdate()
    @BeforeInsert()
    public validate(): void {
        ValidateUtil.validate(this);
    }
}
