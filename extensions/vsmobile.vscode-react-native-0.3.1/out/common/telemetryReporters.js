// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
"use strict";
const remoteExtension_1 = require("../common/remoteExtension");
class ExtensionTelemetryReporter {
    constructor(extensionId, extensionVersion, key, projectRootPath) {
        this.extensionId = extensionId;
        this.extensionVersion = extensionVersion;
        this.appInsightsKey = key;
        this.remoteExtension = remoteExtension_1.RemoteExtension.atProjectRootPath(projectRootPath);
    }
    sendTelemetryEvent(eventName, properties, measures) {
        this.remoteExtension.sendTelemetry(this.extensionId, this.extensionVersion, this.appInsightsKey, eventName, properties, measures)
            .catch(function () { });
    }
}
exports.ExtensionTelemetryReporter = ExtensionTelemetryReporter;
class NullTelemetryReporter {
    sendTelemetryEvent(eventName, properties, measures) {
        // Don't do anything
    }
}
exports.NullTelemetryReporter = NullTelemetryReporter;
class ReassignableTelemetryReporter {
    constructor(initialReporter) {
        this.reporter = initialReporter;
    }
    reassignTo(reporter) {
        this.reporter = reporter;
    }
    sendTelemetryEvent(eventName, properties, measures) {
        this.reporter.sendTelemetryEvent(eventName, properties, measures);
    }
}
exports.ReassignableTelemetryReporter = ReassignableTelemetryReporter;

//# sourceMappingURL=telemetryReporters.js.map
