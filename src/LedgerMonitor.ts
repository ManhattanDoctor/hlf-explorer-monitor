import { DateUtil, ILogger, PromiseHandler, ITransportSender } from '@ts-core/common';
import { LedgerApiClient, LedgerInfo, LedgerApiSocket, LedgerSocketEvent, LedgerBlock } from '@hlf-explorer/common';
import { filter, takeUntil } from 'rxjs';
import { LedgerDatabase } from './LedgerDatabase';
import { ILedgerInfo } from './ILedgerInfo';
import { LedgerInfoEntity } from './database';
import { LedgerMonitorBlockLastError, LedgerMonitorLedgerNotFoundError } from './LedgerMonitorError';
import { LedgerBlockParseCommand } from './transport';
import * as _ from 'lodash';

export class LedgerMonitor extends LedgerApiSocket {
    //--------------------------------------------------------------------------
    //
    // 	Properties
    //
    //--------------------------------------------------------------------------

    protected api: LedgerApiClient;
    protected database: LedgerDatabase;
    protected transport: ITransportSender;
    protected isLastBlockError: boolean;

    protected checkTimer: any;
    protected infoPromise: PromiseHandler<LedgerInfo, string>;

    // --------------------------------------------------------------------------
    //
    //  Constructor
    //
    // --------------------------------------------------------------------------

    constructor(logger: ILogger, transport: ITransportSender, database: LedgerDatabase, api: LedgerApiClient) {
        super(logger);

        this.api = api;
        this.database = database;
        this.transport = transport;

        this.url = this.api.url;
        this.settings.ledgerNameDefault = this.api.settings.ledgerNameDefault;

        this.events
            .pipe(filter(event => event.type === LedgerSocketEvent.LEDGER_DEFAULT_FOUND), takeUntil(this.destroyed))
            .subscribe(() => this.infoPromise.resolve(this.ledgerDefault));

        this.events
            .pipe(filter(event => event.type === LedgerSocketEvent.LEDGER_DEFAULT_NOT_FOUND), takeUntil(this.destroyed))
            .subscribe(() => this.infoPromise.reject(`Unable to find "${this.ledgerName}" ledger`));
    }

    // --------------------------------------------------------------------------
    //
    //  Check Methods
    //
    // --------------------------------------------------------------------------

    protected async checkUnparsedBlocks(isNeedToParse?: boolean): Promise<void> {
        let items = await this.database.blocksUnparsedGet(0, await this.blockLastGet());
        if (_.isEmpty(items)) {
            return;
        }
        this.logger.warn(`Ledger blocks ${items.join(', ')} are not parsed`);
        if (isNeedToParse) {
            await this.blocksParse(items);
        }
    }

    protected checkStart(delay: number): void {
        this.checkStop();
        this.checkTimer = setInterval(this.checkHandlerProxy, delay);
    }

    protected checkStop(): void {
        clearInterval(this.checkTimer);
        this.checkTimer = null;
    }

    protected async checkHandler(): Promise<void> {
        let block = await this.blockLastGet();
        let ledger = await this.database.infoGet();
        if (_.isNil(ledger)) {
            throw new LedgerMonitorLedgerNotFoundError(this.ledgerName);
        }
        let blockHeight = ledger.blockHeight;
        if (_.isNil(block) || _.isNaN(block) || blockHeight >= block) {
            return;
        }

        this.logger.debug(`Check blocks: ${block - blockHeight} = ${block} - ${blockHeight}`);
        await this.database.infoUpdate({ blockHeight: block });

        await this.blocksParse(await this.database.blocksUnparsedGet(blockHeight + 1, block));
    }

    protected checkHandlerProxy = async (): Promise<void> => {
        try {
            await this.checkHandler();
        }
        catch (error) {
            this.logger.warn(`Connection to explorer failed: ${error.message}`);
        }
    }

    // --------------------------------------------------------------------------
    //
    //  Blocks Methods
    //
    // --------------------------------------------------------------------------

    protected async blockLastGet(): Promise<number> {
        try {
            let { number } = await this.api.getBlockLast(this.ledgerName);
            if (this.isLastBlockError) {
                this.logger.warn(`Connection to explorer restored`);
                this.isLastBlockError = false;
            }
            return number;
        }
        catch (error) {
            this.isLastBlockError = true;
            throw new LedgerMonitorBlockLastError(error.message);
        }
    }

    protected async blocksParse(items: Array<number>): Promise<void> {
        items.forEach(number => this.transport.send(new LedgerBlockParseCommand({ number })));
    }

    protected async infoCreate(ledger: LedgerInfo, blockFrequency: number): Promise<ILedgerInfo> {
        let item = new LedgerInfoEntity();
        item.name = ledger.name;
        item.ledgerId = ledger.id;
        item.blockHeight = 0;
        item.blockHeightParsed = 0;
        item.blockFrequency = blockFrequency;
        await this.database.info.save(item);
        return item.toObject();
    }

    // --------------------------------------------------------------------------
    //
    //  Public Methods
    //
    // --------------------------------------------------------------------------

    public async start(): Promise<LedgerBlock> {
        if (_.isNil(this.infoPromise)) {
            this.infoPromise = PromiseHandler.create();
        }

        await this.connect();

        let info = await this.info;
        let item = await this.database.infoGet();
        if (_.isNil(item)) {
            item = await this.infoCreate(info, DateUtil.MILLISECONDS_SECOND);
        }

        await this.checkUnparsedBlocks();
        this.checkStart(item.blockFrequency);
        return this.api.getBlockLast(item.name);
    }

    public stop(): void {
        if (!_.isNil(this.infoPromise)) {
            this.infoPromise.reject('Service stopped');
            this.infoPromise = null;
        }
        this.checkStop();
        this.disconnect();
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }
        super.destroy();
        this.stop();

        this.transport = null;
        this.database = null;
        this.api = null;
    }

    // --------------------------------------------------------------------------
    //
    //  Protected Properties
    //
    // --------------------------------------------------------------------------

    protected get info(): Promise<LedgerInfo> {
        return this.infoPromise.promise;
    }

    protected get ledgerName(): string {
        return this.settings.ledgerNameDefault;
    }
}

