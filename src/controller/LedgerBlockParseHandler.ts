import { Logger, ClassType, Transport, ITransportCommand, ITransportEvent } from '@ts-core/common';
import { LedgerApiClient, LedgerBlock } from '@hlf-explorer/common';
import { ILedgerEventSocketEvent, LedgerEventParser } from '../transport';
import { LedgerBlockParseHandlerBase } from './LedgerBlockParseHandlerBase';
import { LedgerDatabase } from '../LedgerDatabase';
import { ILedgerInfo } from '../ILedgerInfo';
import { EntityManager } from 'typeorm';
import * as _ from 'lodash';

export abstract class LedgerBlockParseHandler<T extends ILedgerBlockParserEffects = ILedgerBlockParserEffects> extends LedgerBlockParseHandlerBase<T> {
    // --------------------------------------------------------------------------
    //
    //  Properties
    //
    // --------------------------------------------------------------------------

    protected parsers: Map<string, LedgerEventParserClass>;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: Logger, transport: Transport, database: LedgerDatabase, api: LedgerApiClient) {
        super(logger, transport, database, api);
        this.parsers = new Map();
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Methods
    //
    // --------------------------------------------------------------------------

    protected parserAdd(name: string, type: LedgerEventParserClass): void {
        if (this.parsers.has(name)) {
            this.warn(`Unable to add parser for "${name}" event it's already exists`);
            return;
        }
        this.parsers.set(name, type);
    }

    protected abstract createParser(type: LedgerEventParserClass): LedgerEventParser<any, any, any>;

    protected async parse(manager: EntityManager, item: LedgerBlock, info: ILedgerInfo): Promise<T> {
        let events = new Array();
        let commands = new Array();
        let socketEvents = new Array<ILedgerEventSocketEvent<any>>();

        let entities = new Array();
        for (let event of item.events) {
            let Class = this.parsers.get(event.name);
            if (_.isNil(Class)) {
                this.warn(`Unable to find parser for "${event.name}" event`);
                continue;
            }
            this.log(`Parsing "${event.name}" event`);
            try {
                let parser = this.createParser(Class);
                let result = await parser.parse(event);

                events.push(...result.events);
                entities.push(...result.entities);
                commands.push(...result.commands);
                socketEvents.push(...result.socketEvents);
                parser.destroy();
            }
            catch (error) {
                this.error(error);
                throw error;
            }
        }
        try {
            await manager.save(entities);
        }
        catch (error) {
            this.error(error);
            throw error;
        }
        return { commands, events, socketEvents } as T;
    }

    protected async effects(data: T): Promise<void> {
        data.events.forEach(item => this.transport.dispatch(item));
        data.commands.forEach(item => this.transport.send(item));
    }
}


export type LedgerEventParserClass = ClassType<LedgerEventParser<any, any, any>>;

export interface ILedgerBlockParserEffects {
    events: Array<ITransportEvent<any>>;
    commands: Array<ITransportCommand<any>>;
    socketEvents: Array<ILedgerEventSocketEvent<any>>;
}
