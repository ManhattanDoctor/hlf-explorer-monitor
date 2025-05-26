import { ExtendedError } from '@ts-core/common';
import * as _ from 'lodash';

// --------------------------------------------------------------------------
//
//  Other
//
// --------------------------------------------------------------------------

export enum LedgerMonitorErrorCode {
    BLOCK_LAST = 'BLOCK_LAST',
    BLOCK_PARSE = 'BLOCK_PARSE',
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

export class LedgerMonitorBlockLastError extends LedgerMonitorError<string> {
    constructor(message: string) {
        super(LedgerMonitorErrorCode.BLOCK_LAST, message, ExtendedError.DEFAULT_ERROR_CODE);
    }
}
export class LedgerMonitorBlockParseError extends LedgerMonitorError<string> {
    constructor(message: string) {
        super(LedgerMonitorErrorCode.BLOCK_PARSE, message, ExtendedError.DEFAULT_ERROR_CODE);
    }
}
