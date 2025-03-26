import { BreezeChannelIdentifier, DEFAULT_BREEZE_ENDPOINT, DEFAULT_BREEZE_PATH, IConfig } from "@microsoft/applicationinsights-common";
import { BaseTelemetryPlugin, IAppInsightsCore, IChannelControls, IConfiguration, IInternalOfflineSupport, IPayloadData, IPlugin, ITelemetryItem } from "@microsoft/applicationinsights-core-js";

export class TestChannel extends BaseTelemetryPlugin implements IChannelControls  {
    public identifier = BreezeChannelIdentifier;
    public priority: number = 1001;
    public endpoint: string = DEFAULT_BREEZE_ENDPOINT + DEFAULT_BREEZE_PATH;
    public isIdle: boolean = true;
    public isInitialized = () => {
        return true;
    }

    lastEventAdded: ITelemetryItem;
    eventsAdded: ITelemetryItem[] = [];
    flushCalled: boolean;
    uploadNowCallback: () => void;
    pauseCalled: boolean;
    resumeCalled: boolean;
    teardownCalled: boolean;


    initialize(config: IConfig & IConfiguration, core: IAppInsightsCore, extensions: IPlugin[]) {
        //No-op
    }

    processTelemetry(event: ITelemetryItem) {
        this.lastEventAdded = <any>event;
        this.eventsAdded.push(this.lastEventAdded);
    }

    pause() {
        this.pauseCalled = true;
    }

    resume() {
        this.resumeCalled = true;
    }

    teardown() {
        this.teardownCalled = true;
    }

    flush(async = true, callback?: () => void) {
        this.flushCalled = true;
    }

    setIsIdle(val) {
        this.isIdle = val;
    }
    isCompletelyIdle() {
        return this.isIdle;
    }

    getOfflineSupport() {
        return {
            serialize: (evt) => {
                return JSON.stringify(evt);
            },
            batch: (arr) => {
                if (!arr || !arr.length) {
                    return "";
                }
                return "[" + arr.join(",") + "]";
            },
            shouldProcess: (evt) => {
                return true;
            },
            getUrl: () => {
                return this.endpoint;
            },
            createPayload: (evt) => {
                return {
                    urlString: this.endpoint,
                    data: evt,
                    headers: {header1: "val1"}
                    
                } as IPayloadData
            }
            
        } as IInternalOfflineSupport;
    }
}

export function mockTelemetryItem(level?: number): ITelemetryItem {
    let evt = {
        ver: "testVer" + Math.random(),
        name:"testName",
        time: "testTime",
        iKey:"testKey",
        baseData: {pro1: "prop1", persistence: level},
        baseType: "testType"
    } as ITelemetryItem;
    return evt;
}



