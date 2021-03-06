"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../util/log");
const pendingRequests_1 = require("./pendingRequests");
let log = log_1.Log.create('BreakpointActorProxy');
class BreakpointActorProxy {
    constructor(_name, connection) {
        this._name = _name;
        this.connection = connection;
        this.pendingDeleteRequests = new pendingRequests_1.PendingRequests();
        this.connection.register(this);
    }
    get name() {
        return this._name;
    }
    delete() {
        log.debug(`Deleting breakpoint ${this.name}`);
        return new Promise((resolve, reject) => {
            this.pendingDeleteRequests.enqueue({ resolve, reject });
            this.connection.sendRequest({ to: this.name, type: 'delete' });
        });
    }
    receiveResponse(response) {
        log.debug(`Breakpoint ${this.name} deleted`);
        this.pendingDeleteRequests.resolveAll(undefined);
        this.connection.unregister(this);
    }
}
exports.BreakpointActorProxy = BreakpointActorProxy;
//# sourceMappingURL=breakpoint.js.map