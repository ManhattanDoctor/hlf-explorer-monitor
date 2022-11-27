import { LedgerBlockEntity, LedgerInfoEntity } from './database';
import { Connection, Repository, EntityManager, UpdateResult } from 'typeorm';
import { ILogger, LoggerWrapper } from '@ts-core/common';
import { TypeormUtil } from '@ts-core/backend';
import { ILedgerInfo } from './ILedgerInfo';
import * as _ from 'lodash';

export class LedgerDatabase extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, protected connection: Connection, protected ledgerName: string) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async infoGet(): Promise<ILedgerInfo> {
        let item = await this.info.findOneBy({ name: this.ledgerName });
        return !_.isNil(item) ? item.toObject() : null;
    }

    public async infoUpdate(item: Partial<ILedgerInfo>, manager?: EntityManager): Promise<UpdateResult> {
        let repository = !_.isNil(manager) ? manager.getRepository(LedgerInfoEntity) : this.info;
        let query = repository.createQueryBuilder().update(item).where('name = :name', { name: this.ledgerName });

        if (!_.isNil(item.blockHeightParsed)) {
            query.andWhere('blockHeightParsed < :blockHeightParsed', { blockHeightParsed: item.blockHeightParsed });
        }
        return query.execute();
    }

    public async blocksUnparsedGet(start: number, end: number): Promise<Array<number>> {
        let blocksToCheck = _.range(start, end + 1);
        let items = await Promise.all(
            _.chunk(blocksToCheck, TypeormUtil.POSTGRE_FORIN_MAX).map(chunk =>
                this.block.createQueryBuilder('block')
                    .select(['block.number'])
                    .where('block.number IN (:...blockNumbers)', { blockNumbers: chunk })
                    .getMany()
            ));
        let blocks: Array<number> = _.flatten(items).map(item => item.number);
        return blocksToCheck.filter(blockHeight => !blocks.includes(blockHeight));
    }

    // --------------------------------------------------------------------------
    //
    //  Public Properties
    //
    // --------------------------------------------------------------------------

    public getConnection(): Connection {
        return this.connection;
    }

    public get info(): Repository<LedgerInfoEntity> {
        return this.connection.getRepository(LedgerInfoEntity);
    }

    public get block(): Repository<LedgerBlockEntity> {
        return this.connection.getRepository(LedgerBlockEntity);
    }
}
