"use strict";
var bulb_1 = require('./bulb');
var provider_1 = require('./provider');
var import_1 = require('./import');
var getset_1 = require('./getset');
var vscode = require('vscode');
var TYPESCRIPT = { language: 'typescript' };
function readyCheck() {
    if (vscode.window.activeTextEditor === undefined) {
        vscode.window.showWarningMessage('Need an active TypeScript document opened in the editor to function.');
        return false;
    }
    if (provider_1.DefinitionProvider.instance.cachedExports === null ||
        provider_1.DefinitionProvider.instance.cachedExports === undefined) {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the export cache has been build.', 'Refresh').then(function (r) {
            provider_1.DefinitionProvider.instance.refreshExports();
        });
        return false;
    }
    return true;
}
function activate(context) {
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(TYPESCRIPT, new bulb_1.CompleteActionProvider()));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.addImport', function (item) {
        if (readyCheck()) {
            if (!item) {
                vscode.window.showQuickPick(provider_1.DefinitionProvider.instance.toQuickPickItemList()).then(function (pickedItem) {
                    if (!pickedItem)
                        return;
                    import_1.addSingleImport(provider_1.DefinitionProvider.instance.cachedExports, pickedItem.label);
                });
            }
            else {
                import_1.addSingleImport(provider_1.DefinitionProvider.instance.cachedExports, item);
            }
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.sortImports', function () {
        if (readyCheck()) {
            import_1.optimizeImports(provider_1.DefinitionProvider.instance.cachedExports);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.scanImports', function () {
        if (readyCheck())
            provider_1.DefinitionProvider.instance.refreshExports();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.getter', function () {
        var classesList = getset_1.generateClassesList(getset_1.EType.GETTER);
        vscode.window.showQuickPick(getset_1.quickPickItemListFrom(classesList, getset_1.EType.GETTER)).then(function (pickedItem) {
            getset_1.generateCode(classesList, getset_1.EType.GETTER, pickedItem);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.setter', function () {
        var classesList = getset_1.generateClassesList(getset_1.EType.SETTER);
        vscode.window.showQuickPick(getset_1.quickPickItemListFrom(classesList, getset_1.EType.SETTER)).then(function (pickedItem) {
            getset_1.generateCode(classesList, getset_1.EType.SETTER, pickedItem);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.getterAndSetter', function () {
        var classesList = getset_1.generateClassesList(getset_1.EType.BOTH);
        vscode.window.showQuickPick(getset_1.quickPickItemListFrom(classesList, getset_1.EType.BOTH)).then(function (pickedItem) {
            getset_1.generateCode(classesList, getset_1.EType.BOTH, pickedItem);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.constructor', function () {
        var classesList = getset_1.generateClassesList(getset_1.EType.BOTH);
        getset_1.generateCode(classesList, getset_1.EType.CONSTRUCTOR);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('genGetSet.popup', function () {
        vscode.window.showQuickPick([
            {
                label: 'Add Import',
                description: 'add and search through available imports'
            },
            {
                label: 'Optimize Imports',
                description: 'sort and import missing libraries'
            },
            {
                label: 'Rescan Workspace',
                description: 'rescan all files in the workscape for exports'
            },
            {
                label: 'Constructor',
                description: 'generate a constructor based on privates'
            },
            {
                label: 'Getter and Setter',
                description: 'generate a getter and setter public function'
            },
            {
                label: 'Getter',
                description: 'generate a getter public function'
            },
            {
                label: 'Setter',
                description: 'generate a setter public function'
            }
        ]).then(function (result) {
            if (result && result.label.indexOf('Add Import') !== -1) {
                vscode.commands.executeCommand('genGetSet.addImport');
            }
            else if (result && result.label.indexOf('Optimize Imports') !== -1) {
                vscode.commands.executeCommand('genGetSet.sortImports');
            }
            else if (result && result.label.indexOf('Rescan Workspace') !== -1) {
                vscode.commands.executeCommand('genGetSet.scanImports');
            }
            else if (result && result.label.indexOf('Getter and Setter') !== -1) {
                vscode.commands.executeCommand('genGetSet.getterAndSetter');
            }
            else if (result && result.label.indexOf('Getter') !== -1) {
                vscode.commands.executeCommand('genGetSet.getter');
            }
            else if (result && result.label.indexOf('Setter') !== -1) {
                vscode.commands.executeCommand('genGetSet.setter');
            }
            else if (result) {
                vscode.commands.executeCommand('genGetSet.constructor');
            }
        });
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map