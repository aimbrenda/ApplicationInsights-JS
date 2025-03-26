import { _testHookMaxUnloadHooksCb } from "@microsoft/1ds-core-js";
import { Assert } from "@microsoft/ai-test-framework";
import { dumpObj } from "@nevware21/ts-utils";

export class GlobalTestHooks {

    public registerTests() {
        // Set a global maximum
        _testHookMaxUnloadHooksCb(20, (state: string, hooks: Array<any>) => {
            Assert.ok(false, "Max unload hooks exceeded [" + hooks.length + "] - " + state + " - " + dumpObj(hooks));
        });
    }
}
