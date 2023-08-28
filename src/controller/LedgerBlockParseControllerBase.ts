import { Logger, Transport, TransportCommandHandler } from '@ts-core/common';
import { ILedgerBlockParseDto, LedgerBlockParseCommand } from '../transport/LedgerBlockParseCommand';
import { LedgerDatabase } from '../LedgerDatabase';
import { LedgerApiClient, LedgerBlock } from '@hlf-explorer/common';
import { LedgerBlockEntity } from '../database/LedgerBlockEntity';
import { ILedgerInfo } from '../ILedgerInfo';
import { EntityManager } from 'typeorm';
import { LedgerMonitorInvalidParsingBlockError } from '../LedgerMonitorError';
import * as _ from 'lodash';

export abstract class LedgerBlockParseHandlerBase<T = void> extends TransportCommandHandler<ILedgerBlockParseDto, LedgerBlockParseCommand> {
    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, transport: Transport, protected database: LedgerDatabase, protected api: LedgerApiClient) {
        super(logger, transport, LedgerBlockParseCommand.NAME);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected async effects(data: T): Promise<void> { };

    protected abstract parse(manager: EntityManager, item: LedgerBlock, info: ILedgerInfo): Promise<T>;

    protected async execute(params: ILedgerBlockParseDto): Promise<void> {
        this.debug(`Parsing block #${params.number}...`);

        let info = await this.database.infoGet();
        let block = await this.api.getBlock(params.number);

        let effects = null;
        this.database.getConnection().transaction(async manager => {
            try {
                effects = await this.parse(manager, block, info);
                await manager.save(new LedgerBlockEntity(block));
                await this.database.infoUpdate({ blockHeightParsed: block.number }, manager);
            } catch (error) {
                throw new LedgerMonitorInvalidParsingBlockError(`Error parsing "${block.number}" block: ${error.message}`);
            }
        });
        if (!_.isNil(effects)) {
            await this.effects(effects);
        }
    }
}
