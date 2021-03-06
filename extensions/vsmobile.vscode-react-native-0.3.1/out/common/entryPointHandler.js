// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
const errorHelper_1 = require("../common/error/errorHelper");
const telemetryReporters_1 = require("../common/telemetryReporters");
const telemetryHelper_1 = require("../common/telemetryHelper");
const telemetry_1 = require("../common/telemetry");
const log_1 = require("../common/log/log");
(function (ProcessType) {
    ProcessType[ProcessType["Extension"] = 0] = "Extension";
    ProcessType[ProcessType["Debugee"] = 1] = "Debugee";
    ProcessType[ProcessType["Debugger"] = 2] = "Debugger";
})(exports.ProcessType || (exports.ProcessType = {}));
var ProcessType = exports.ProcessType;
/* This class should we used for each entry point of the code, so we handle telemetry and error reporting properly */
class EntryPointHandler {
    constructor(processType, logger) {
        if (logger) {
            log_1.Log.SetGlobalLogger(logger);
        }
        this.processType = processType;
    }
    /* This method should wrap any async entry points to the code, so we handle telemetry and error reporting properly */
    runFunction(taskName, error, codeToRun, errorsAreFatal = false) {
        return this.handleErrors(error, telemetryHelper_1.TelemetryHelper.generate(taskName, codeToRun), /*errorsAreFatal*/ errorsAreFatal);
    }
    // This method should wrap the entry point of the whole app, so we handle telemetry and error reporting properly
    runApp(appName, getAppVersion, error, projectRootPathOrReporterToUse, codeToRun) {
        try {
            const appVersion = getAppVersion();
            const reporterToUse = typeof projectRootPathOrReporterToUse !== "string" ? projectRootPathOrReporterToUse : null;
            const reporter = reporterToUse || (this.processType === ProcessType.Extension
                ? telemetry_1.Telemetry.defaultTelemetryReporter(appVersion)
                : new telemetryReporters_1.ExtensionTelemetryReporter(telemetry_1.Telemetry.appName, appVersion, telemetry_1.Telemetry.APPINSIGHTS_INSTRUMENTATIONKEY, projectRootPathOrReporterToUse));
            telemetry_1.Telemetry.init(appName, appVersion, reporter);
            return this.runFunction(appName, error, codeToRun, true);
        }
        catch (error) {
            log_1.Log.logError(error, false);
            throw error;
        }
    }
    handleErrors(error, resultOfCode, errorsAreFatal) {
        resultOfCode.done(() => { }, reason => {
            const isDebugeeProcess = this.processType === ProcessType.Debugee;
            const shouldLogStack = !errorsAreFatal || isDebugeeProcess;
            log_1.Log.logError(errorHelper_1.ErrorHelper.wrapError(error, reason), /*logStack*/ shouldLogStack);
            // For the debugee process we don't want to throw an exception because the debugger
            // will appear to the user if he turned on the VS Code uncaught exceptions feature.
            if (errorsAreFatal) {
                if (isDebugeeProcess) {
                    process.exit(1);
                }
                else {
                    throw reason;
                }
            }
        });
    }
}
exports.EntryPointHandler = EntryPointHandler;

//# sourceMappingURL=entryPointHandler.js.map
