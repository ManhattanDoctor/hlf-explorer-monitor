import { TransportEvent } from '@ts-core/common';
import { LedgerBlock } from '@hlf-explorer/common';

export class LedgerBlockParsedEvent extends TransportEvent<LedgerBlock> {
    // --------------------------------------------------------------------------
    //
    //  Public Static Properties
    //
    // --------------------------------------------------------------------------

    public static readonly NAME = 'LedgerBlockParsedEvent';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(data: LedgerBlock) {
        super(LedgerBlockParsedEvent.NAME, data);
    }
}
