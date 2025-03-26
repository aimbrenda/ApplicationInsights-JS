import { createUnVersionedConfig } from "../../rollup.base.config";
import { updateDistEsmFiles } from "../../tools/updateDistEsm/updateDistEsm";

const version = require("./package.json").version;
const entryPointName = "applicationinsights-core-js";
const banner = [
  "/*!",
  ` * Application Insights JavaScript SDK - Core, ${version}`,
  " * Copyright (c) Microsoft and contributors. All rights reserved.",
  " */"
].join("\n");

const replaceValues = {
  "// Copyright (c) Microsoft Corporation. All rights reserved.": "",
  "// Licensed under the MIT License.": ""
};

updateDistEsmFiles(replaceValues, banner, true, true, "dist-es5");

export default createUnVersionedConfig(banner, 
  {
    namespace: "Microsoft.ApplicationInsights",
    version: version,
    node: {
      entryPoint: entryPointName, 
      outputName: entryPointName
    },
    browser: {
      entryPoint: entryPointName,
      outputName: entryPointName
    },
  },
  [ "applicationinsights-core-js" ],
  false
);