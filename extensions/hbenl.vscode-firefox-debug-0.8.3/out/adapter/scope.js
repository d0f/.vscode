"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const index_1 = require("./index");
const vscode_debugadapter_1 = require("vscode-debugadapter");
class ScopeAdapter {
    constructor(name, threadAdapter) {
        this.isThreadLifetime = false;
        this.threadAdapter = threadAdapter;
        this.name = name;
        this.threadAdapter.registerScopeAdapter(this);
        this.threadAdapter.debugSession.registerVariablesProvider(this);
    }
    addThis(thisGrip) {
        this.thisVariable = index_1.VariableAdapter.fromGrip('this', thisGrip, false, this.threadAdapter);
    }
    addCompletionValue(completionValue) {
        if (completionValue) {
            if (completionValue.return) {
                this.completionVariable = index_1.VariableAdapter.fromGrip('<return>', completionValue.return, false, this.threadAdapter);
            }
            else if (completionValue.throw) {
                this.completionVariable = index_1.VariableAdapter.fromGrip('<exception>', completionValue.throw, false, this.threadAdapter);
            }
        }
    }
    getScope() {
        return new vscode_debugadapter_1.Scope(this.name, this.variablesProviderId);
    }
    getVariables() {
        return __awaiter(this, void 0, void 0, function* () {
            let variables = yield this.getVariablesInt();
            if (this.thisVariable) {
                variables.unshift(this.thisVariable);
            }
            if (this.completionVariable) {
                variables.unshift(this.completionVariable);
            }
            return variables;
        });
    }
    getObjectGripAdapters() {
        let objectGripadapters = this.getObjectGripAdaptersInt();
        if (this.thisVariable && this.thisVariable.objectGripAdapter) {
            objectGripadapters.push(this.thisVariable.objectGripAdapter);
        }
        if (this.completionVariable && this.completionVariable.objectGripAdapter) {
            objectGripadapters.push(this.completionVariable.objectGripAdapter);
        }
        return objectGripadapters;
    }
    dispose() {
        this.threadAdapter.debugSession.unregisterVariablesProvider(this);
    }
}
exports.ScopeAdapter = ScopeAdapter;
class ObjectScopeAdapter extends ScopeAdapter {
    constructor(name, object, threadAdapter) {
        super(name, threadAdapter);
        this.objectGripAdapter = threadAdapter.getOrCreateObjectGripAdapter(object, false);
    }
    getVariablesInt() {
        return this.objectGripAdapter.getVariables();
    }
    getObjectGripAdaptersInt() {
        return [this.objectGripAdapter];
    }
}
exports.ObjectScopeAdapter = ObjectScopeAdapter;
class LocalVariablesScopeAdapter extends ScopeAdapter {
    constructor(name, variableDescriptors, threadAdapter) {
        super(name, threadAdapter);
        this.variables = [];
        this.variableDescriptors = variableDescriptors;
        for (let varname in this.variableDescriptors) {
            this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.variableDescriptors[varname], false, this.threadAdapter));
        }
        index_1.VariableAdapter.sortVariables(this.variables);
    }
    getVariablesInt() {
        return Promise.resolve(this.variables);
    }
    getObjectGripAdaptersInt() {
        return this.variables
            .map((variableAdapter) => variableAdapter.objectGripAdapter)
            .filter((objectGripAdapter) => (objectGripAdapter !== undefined));
    }
}
exports.LocalVariablesScopeAdapter = LocalVariablesScopeAdapter;
class FunctionScopeAdapter extends ScopeAdapter {
    constructor(name, bindings, threadAdapter) {
        super(name, threadAdapter);
        this.variables = [];
        this.bindings = bindings;
        this.bindings.arguments.forEach((arg) => {
            for (let varname in arg) {
                this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, arg[varname], false, this.threadAdapter));
            }
        });
        for (let varname in this.bindings.variables) {
            this.variables.push(index_1.VariableAdapter.fromPropertyDescriptor(varname, this.bindings.variables[varname], false, this.threadAdapter));
        }
        index_1.VariableAdapter.sortVariables(this.variables);
    }
    getVariablesInt() {
        return Promise.resolve(this.variables);
    }
    getObjectGripAdaptersInt() {
        return this.variables
            .map((variableAdapter) => variableAdapter.objectGripAdapter)
            .filter((objectGripAdapter) => (objectGripAdapter !== undefined));
    }
}
exports.FunctionScopeAdapter = FunctionScopeAdapter;
//# sourceMappingURL=scope.js.map