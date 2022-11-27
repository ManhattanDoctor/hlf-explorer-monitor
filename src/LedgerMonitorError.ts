import { ExtendedError } from '@ts-core/common';
import * as _ from 'lodash';

// --------------------------------------------------------------------------
//
//  Other
//
// --------------------------------------------------------------------------

export enum LedgerMonitorErrorCode {
    INVALID_LAST_BLOCK = 'INVALID_LAST_BLOCK',
    INVALID_PARSING_BLOCK = 'INVALID_PARSING_BLOCK',
}

export class LedgerMonitorError<T = void> extends ExtendedError<T, LedgerMonitorErrorCode> {
    constructor(code: LedgerMonitorErrorCode, details?: T, public status?: number) {
        super('', code, details);
        this.message = this.constructor.name;
    }
}


// --------------------------------------------------------------------------
//
//  User
//
// --------------------------------------------------------------------------

export class LedgerMonitorInvalidLastBlockError extends LedgerMonitorError<number> {
    constructor(number: number) {
        super(LedgerMonitorErrorCode.INVALID_LAST_BLOCK, number, ExtendedError.DEFAULT_ERROR_CODE);
    }
}
export class LedgerMonitorInvalidParsingBlockError extends LedgerMonitorError<string> {
    constructor(message: string) {
        super(LedgerMonitorErrorCode.INVALID_PARSING_BLOCK, message, ExtendedError.DEFAULT_ERROR_CODE);
    }
}
