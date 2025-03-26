import { AITestClass, Assert, PollingAssert } from "@microsoft/ai-test-framework";
import { IConfig } from "@microsoft/applicationinsights-common";
import { IConfiguration, isString, newId } from "@microsoft/applicationinsights-core-js";
import { ApplicationInsights, ISenderConfig } from "../../../src/index";
import { createAsyncResolvedPromise } from "@nevware21/ts-async";

export class ApplicationInsightsDynamicConfigTests extends AITestClass {
    private static readonly _instrumentationKey = "b7170927-2d1c-44f1-acec-59f4e1751c11";
    private static readonly _connectionString = `InstrumentationKey=${ApplicationInsightsDynamicConfigTests._instrumentationKey}`;
    private _ai: ApplicationInsights;
    private _sessionPrefix: string = newId();
    private _config: IConfiguration & IConfig;
    static registerTests: any;
    private _ctx: any;

    constructor(testName?: string) {
        super(testName || "AISKU Dynamic Config");
    }
    
    protected _getTestConfig(sessionPrefix: string) {
        return {
            connectionString: ApplicationInsightsDynamicConfigTests._connectionString,
            namePrefix: sessionPrefix
        };
    }

    public testInitialize() {
        try {
            this._config = this._getTestConfig(this._sessionPrefix);

            this._ai = new ApplicationInsights(this._config);
            this._ctx = {};
        } catch (e) {
            console.error("Failed to initialize", e);
        }
    }

    public testFinishedCleanup(): void {
        if (this._ai && this._ai.unload) {
            // force unload
            this._ai.unload(false);
        }
        this._ctx = null;

        console.log("* testCleanup(" + (AITestClass.currentTestInfo ? AITestClass.currentTestInfo.name : "<null>") + ")");
    }

    public registerTests() {
        this.addDynamicConfigTests();
        this.addApiTests();
    }

    private addDynamicConfigTests(): void {
        this.testCase({
            name: "DynamicConfigTests: ApplicationInsights dynamic config works correctly",
            useFakeTimers: true,
            test: () => {
                Assert.ok(this._ai);
                let config = this._ai.config;
                let expectedIkey = ApplicationInsightsDynamicConfigTests._instrumentationKey;
                let expectedConnectionString = ApplicationInsightsDynamicConfigTests._connectionString;
                let expectedEndpointUrl = "https://dc.services.visualstudio.com/v2/track";
                let expectedLoggingLevel = 10000;
                Assert.ok(config, "ApplicationInsights Light config exists");
                Assert.equal(expectedConnectionString, config.connectionString, "connection string is set");
                Assert.equal(expectedIkey, config.instrumentationKey, "ikey is set");
                Assert.equal(expectedLoggingLevel, config.diagnosticLogInterval, "diagnosticLogInterval is set to 1000 by default");
                Assert.equal(expectedEndpointUrl, config.endpointUrl, "endpoint url is set from connection string");

                let onChangeCalled = 0;
                let handler = this._ai.onCfgChange((details) => {
                    onChangeCalled ++;
                    Assert.ok(details.cfg);
                    Assert.equal(expectedIkey, details.cfg.instrumentationKey, "Expect the iKey to be set");
                    Assert.equal(expectedEndpointUrl, details.cfg.endpointUrl, "Expect the endpoint to be set");
                    Assert.equal(expectedLoggingLevel, details.cfg.diagnosticLogInterval, "Expect the diagnosticLogInterval to be set");
                });

                Assert.equal(1, onChangeCalled, "OnCfgChange was called once");

                expectedIkey = "newIkey";
                expectedConnectionString = `InstrumentationKey=${expectedIkey}`;
                config.connectionString = expectedConnectionString;
                Assert.equal(1, onChangeCalled, "OnCfgChange was called");
                this.clock.tick(1);
                Assert.equal(3, onChangeCalled, "OnCfgChange was called again");
                Assert.equal("newIkey", config.instrumentationKey);

                //Remove the handler
                handler.rm();
            }
        });
        

        this.testCaseAsync({
            name: "Init: init with cs promise",
            stepDelay: 100,
            useFakeTimers: true,
            steps: [() => {

                // unload previous one first
                let oriInst = this._ai;
                if (oriInst && oriInst.unload) {
                    // force unload
                    oriInst.unload(false);
                }
        
                this._config = this._getTestConfig(this._sessionPrefix);
                let csPromise = createAsyncResolvedPromise("InstrumentationKey=testIkey;ingestionendpoint=testUrl");
                this._config.connectionString = csPromise;
                this._config.initTimeOut= 80000;
                this._ctx.csPromise = csPromise;


                let init = new ApplicationInsights(this._config);
                this._ai = init;
                let config = this._ai.config;
                
                
            }].concat(PollingAssert.createPollingAssert(() => {
                let csPromise = this._ctx.csPromise;
                let config = this._ai.config;
                let ikey = config.instrumentationKey;
            
                if (csPromise.state === "resolved" && isString(ikey)) {
                    Assert.equal("testIkey", config.instrumentationKey, "ikey should be set");
                    Assert.equal("testUrl/v2/track", config.endpointUrl ,"endpoint shoule be set");
                    let sender = this._ai.getPlugin("AppInsightsChannelPlugin").plugin;
                    let senderConfig = sender["_senderConfig"] as ISenderConfig; 
                    let senderIkey = senderConfig.instrumentationKey;
                    Assert.equal("testIkey", senderIkey, "sender ikey is set from connection string");
                    let senderUrl = senderConfig.endpointUrl;
                    Assert.equal("testUrl/v2/track", senderUrl, "sender endpoint url is set from connection string");
                    
                    return true;
                }
                return false;
            }, "Wait for promise response" + new Date().toISOString(), 60, 1000) as any)
        });
    }

    public addApiTests(): void {
        this.testCase({
            name: "DynamicConfigTests: Public Members exist",
            test: () => {
                let trackMethod = "track";
                let flushMethod = "flush";
                Assert.ok(this._ai[trackMethod], `${trackMethod} method exists`);
                Assert.equal("function", typeof this._ai["track"], `${trackMethod} is a function`);
                Assert.ok(this._ai[flushMethod], `${flushMethod} method exists`);
                Assert.equal("function", typeof this._ai[flushMethod], `${flushMethod} is a function`);
            }
        });
    }

}