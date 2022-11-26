import { TransportCommand } from '@ts-core/common';
import { ITraceable } from '@ts-core/common';

export class LedgerBlockParseCommand extends TransportCommand<ILedgerBlockParseDto> {
    // --------------------------------------------------------------------------
    //
    //  Public Static Properties
    //
    // --------------------------------------------------------------------------

    public static readonly NAME = 'LedgerBlockParseCommand';

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(request: ILedgerBlockParseDto) {
        super(LedgerBlockParseCommand.NAME, request);
    }
}

export interface ILedgerBlockParseDto extends ITraceable {
    number: number;
}
