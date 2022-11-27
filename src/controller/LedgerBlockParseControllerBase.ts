import { Logger } from '@ts-core/common';
import { Transport, TransportCommandHandler } from '@ts-core/common';
import { ILedgerBlockParseDto, LedgerBlockParseCommand } from '../transport/LedgerBlockParseCommand';
import { LedgerDatabase } from '../LedgerDatabase';
import { LedgerApiClient, LedgerBlock } from '@hlf-explorer/common';
import { LedgerBlockEntity } from '../database/LedgerBlockEntity';
import { ILedgerInfo } from '../ILedgerInfo';
import { EntityManager } from 'typeorm';
import { LedgerMonitorInvalidParsingBlockError } from '../LedgerMonitorError';

export abstract class LedgerBlockParseHandlerBase extends TransportCommandHandler<ILedgerBlockParseDto, LedgerBlockParseCommand> {
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

    protected abstract parse(manager: EntityManager, item: LedgerBlock, info: ILedgerInfo): Promise<void>;

    protected async execute(params: ILedgerBlockParseDto): Promise<void> {
        this.debug(`Parsing block #${params.number}...`);

        let block = await this.api.getBlock(params.number);
        let info = await this.database.infoGet();

        try {
            await this.database.getConnection().transaction(async manager => {
                await manager.save(new LedgerBlockEntity(block));
                await this.database.infoUpdate({ blockHeightParsed: block.number }, manager);
                await this.parse(manager, block, info);
            });
        } catch (error) {
            throw new LedgerMonitorInvalidParsingBlockError(`Error parsing "${block.number}" block: ${error.message}`);
        }
    }
}
