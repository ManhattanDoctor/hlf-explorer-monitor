import { LoggerWrapper, Logger, ITransportCommand, ITransportEvent } from '@ts-core/common';
import { LedgerApiClient, LedgerBlockEvent, LedgerBlockTransaction } from '@hlf-explorer/common';
import { ITransportSocketEventOptions } from '@ts-core/socket-common';
import * as _ from 'lodash';

export abstract class LedgerEventParser<T, U, V> extends LoggerWrapper {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected entities: Array<any>;

    protected events: Array<ITransportEvent<any>>;
    protected commands: Array<ITransportCommand<any>>;
    protected socketEvents: Array<ILedgerEventSocketEvent<any>>;

    protected event: LedgerBlockEvent<T>;
    protected transaction: LedgerBlockTransaction;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, protected api: LedgerApiClient) {
        super(logger);
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected abstract execute(): Promise<void>;

    // --------------------------------------------------------------------------
    //
    //  Help Methods
    //
    // --------------------------------------------------------------------------

    protected eventAdd<T>(item: ITransportEvent<T>): ITransportEvent<T> {
        this.events.push(item);
        return item;
    }

    protected entityAdd<E>(item: E): E {
        this.entities.push(item);
        return item;
    }

    protected commandAdd<C = any>(item: ITransportCommand<C>): ITransportCommand<C> {
        this.commands.push(item);
        return item;
    }

    protected socketEventAdd<T>(item: ILedgerEventSocketEvent<T>): ILedgerEventSocketEvent<T> {
        this.socketEvents.push(item);
        return item;
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async parse(event: LedgerBlockEvent): Promise<ILedgerEventParseResult> {
        this.event = event;

        this.events = new Array();
        this.commands = new Array();
        this.entities = new Array();
        this.socketEvents = new Array();

        this.transaction = await this.api.getTransaction(this.requestId);
        if (this.transaction.validationCode === 0) {
            await this.execute();
        }
        return this.result;
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();

        this.api = null;
        this.event = null;
        this.transaction = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Properties
    //
    // --------------------------------------------------------------------------

    protected get uid(): string {
        return this.event.uid;
    }

    protected get data(): T {
        return this.event.data;
    }

    protected get date(): Date {
        return this.event.date;
    }

    protected get userId(): string {
        return this.transaction.requestUserId;
    }

    protected get requestId(): string {
        return this.event.requestId;
    }

    protected get request(): U {
        return this.transaction.request.request as U;
    }

    protected get response(): V {
        return this.transaction.response.response as V;
    }

    protected get result(): ILedgerEventParseResult {
        return { entities: this.entities, commands: this.commands, events: this.events, socketEvents: this.socketEvents }
    }
}

export interface ILedgerEventParseResult {
    events: Array<ITransportEvent<any>>;
    entities: Array<any>;
    commands: Array<ITransportCommand<any>>;
    socketEvents: Array<ILedgerEventSocketEvent<any>>;
}

export interface ILedgerEventSocketEvent<T> {
    event: ITransportEvent<T>;
    options?: ITransportSocketEventOptions;
}
