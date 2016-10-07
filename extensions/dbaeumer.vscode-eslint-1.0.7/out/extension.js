/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
var path = require('path');
var fs = require('fs');
var vscode_1 = require('vscode');
var vscode_languageclient_1 = require('vscode-languageclient');
var eslintrc = [
    '{',
    '    "env": {',
    '        "browser": true,',
    '        "commonjs": true,',
    '        "es6": true,',
    '        "node": true',
    '    },',
    '    "parserOptions": {',
    '        "ecmaFeatures": {',
    '            "jsx": true',
    '        },',
    '        "sourceType": "module"',
    '    },',
    '    "rules": {',
    '        "no-const-assign": "warn",',
    '        "no-this-before-super": "warn",',
    '        "no-undef": "warn",',
    '        "no-unreachable": "warn",',
    '        "no-unused-vars": "warn",',
    '        "constructor-super": "warn",',
    '        "valid-typeof": "warn"',
    '    }',
    '}'
].join(process.platform === 'win32' ? '\r\n' : '\n');
var AllFixesRequest;
(function (AllFixesRequest) {
    AllFixesRequest.type = { get method() { return 'textDocument/eslint/allFixes'; } };
})(AllFixesRequest || (AllFixesRequest = {}));
var noConfigShown = false;
var NoConfigRequest;
(function (NoConfigRequest) {
    NoConfigRequest.type = { get method() { return 'eslint/noConfig'; } };
})(NoConfigRequest || (NoConfigRequest = {}));
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = { get method() { return 'eslint/noConfig'; } };
})(StatusNotification || (StatusNotification = {}));
var exitCalled = { method: 'eslint/exitCalled' };
function activate(context) {
    var statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
    var eslintStatus = Status.ok;
    var serverRunning = false;
    statusBarItem.text = 'ESLint';
    statusBarItem.command = 'eslint.showOutputChannel';
    function showStatusBarItem(show) {
        if (show) {
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
    function updateStatus(status) {
        switch (status) {
            case Status.ok:
                statusBarItem.color = undefined;
                break;
            case Status.warn:
                statusBarItem.color = 'yellow';
                break;
            case Status.error:
                statusBarItem.color = 'darkred';
                break;
        }
        eslintStatus = status;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    }
    function udpateStatusBarVisibility(editor) {
        statusBarItem.text = eslintStatus === Status.ok ? 'ESLint' : 'ESLint!';
        showStatusBarItem(serverRunning &&
            (eslintStatus !== Status.ok ||
                (editor && (editor.document.languageId === 'javascript' || editor.document.languageId === 'javascriptreact'))));
    }
    vscode_1.window.onDidChangeActiveTextEditor(udpateStatusBarVisibility);
    udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    // serverModule
    var serverModule = path.join(__dirname, '..', 'server', 'server.js');
    var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
    var serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    var defaultErrorHandler;
    var serverCalledProcessExit = false;
    var clientOptions = {
        documentSelector: ['javascript', 'javascriptreact'],
        synchronize: {
            configurationSection: 'eslint',
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/.eslintr{c.js,c.yaml,c.yml,c,c.json}'),
                vscode_1.workspace.createFileSystemWatcher('**/package.json')
            ],
            textDocumentFilter: function (textDocument) {
                var fsPath = textDocument.fileName;
                if (fsPath) {
                    var basename = path.basename(fsPath);
                    return /^\.eslintrc\./.test(basename) || /^package.json$/.test(basename);
                }
            }
        },
        initializationOptions: function () {
            var configuration = vscode_1.workspace.getConfiguration('eslint');
            return {
                legacyModuleResolve: configuration ? configuration.get('_legacyModuleResolve', false) : false,
                nodePath: configuration ? configuration.get('nodePath', undefined) : undefined
            };
        },
        initializationFailedHandler: function (error) {
            if (error instanceof vscode_languageclient_1.ResponseError) {
                var responseError = error;
                if (responseError.code === 100) {
                    var key = 'noESLintMessageShown';
                    var state = context.globalState.get(key, {});
                    if (vscode_1.workspace.rootPath) {
                        client.info([
                            'Failed to load the ESLint library.',
                            'To use ESLint in this workspace please install eslint using \'npm install eslint\' or globally using \'npm install -g eslint\'.',
                            'You need to reopen the workspace after installing eslint.',
                        ].join('\n'));
                        if (!state.workspaces) {
                            state.workspaces = Object.create(null);
                        }
                        if (!state.workspaces[vscode_1.workspace.rootPath]) {
                            state.workspaces[vscode_1.workspace.rootPath] = true;
                            client.outputChannel.show();
                            context.globalState.update(key, state);
                        }
                    }
                    else {
                        client.info([
                            'Failed to load the ESLint library.',
                            'To use ESLint for single JavaScript files install eslint globally using \'npm install -g eslint\'.',
                            'You need to reopen VS Code after installing eslint.',
                        ].join('\n'));
                        if (!state.global) {
                            state.global = true;
                            client.outputChannel.show();
                            context.globalState.update(key, state);
                        }
                    }
                }
                else {
                    client.error('Server initialization failed.', error);
                    client.outputChannel.show();
                }
            }
            else {
                client.error('Server initialization failed.', error);
                client.outputChannel.show();
            }
            return false;
        },
        errorHandler: {
            error: function (error, message, count) {
                return defaultErrorHandler.error(error, message, count);
            },
            closed: function () {
                if (serverCalledProcessExit) {
                    return vscode_languageclient_1.CloseAction.DoNotRestart;
                }
                return defaultErrorHandler.closed();
            }
        }
    };
    var client = new vscode_languageclient_1.LanguageClient('ESLint', serverOptions, clientOptions);
    var running = 'ESLint server is running.';
    var stopped = 'ESLint server stopped.';
    client.onDidChangeState(function (event) {
        if (event.newState === vscode_languageclient_1.State.Running) {
            client.info(running);
            statusBarItem.tooltip = running;
            serverRunning = true;
        }
        else {
            client.info(stopped);
            statusBarItem.tooltip = stopped;
            serverRunning = false;
        }
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    });
    client.onNotification(StatusNotification.type, function (params) {
        updateStatus(params.state);
    });
    defaultErrorHandler = client.createDefaultErrorHandler();
    client.onNotification(exitCalled, function (params) {
        serverCalledProcessExit = true;
        client.error("Server process exited with code " + params[0] + ". This usually indicates a misconfigured ESLint setup.", params[1]);
        vscode_1.window.showErrorMessage("ESLint server shut down itself. See 'ESLint' output channel for details.");
    });
    client.onRequest(NoConfigRequest.type, function (params) {
        var document = vscode_1.Uri.parse(params.document.uri);
        var location = document.fsPath;
        if (vscode_1.workspace.rootPath && document.fsPath.indexOf(vscode_1.workspace.rootPath) === 0) {
            location = document.fsPath.substr(vscode_1.workspace.rootPath.length + 1);
        }
        client.warn([
            ("No ESLint configuration (e.g .eslintrc) found for file: " + location),
            "File will not be validated. Consider running the 'Create .eslintrc.json file' command."
        ].join('\n'));
        eslintStatus = Status.warn;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
        return {};
    });
    function applyTextEdits(uri, documentVersion, edits) {
        var textEditor = vscode_1.window.activeTextEditor;
        if (textEditor && textEditor.document.uri.toString() === uri) {
            if (textEditor.document.version !== documentVersion) {
                vscode_1.window.showInformationMessage("ESLint fixes are outdated and can't be applied to the document.");
            }
            textEditor.edit(function (mutator) {
                for (var _i = 0, edits_1 = edits; _i < edits_1.length; _i++) {
                    var edit = edits_1[_i];
                    mutator.replace(vscode_languageclient_1.Protocol2Code.asRange(edit.range), edit.newText);
                }
            }).then(function (success) {
                if (!success) {
                    vscode_1.window.showErrorMessage('Failed to apply ESLint fixes to the document. Please consider opening an issue with steps to reproduce.');
                }
            });
        }
    }
    function runAutoFix() {
        var textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        var uri = textEditor.document.uri.toString();
        client.sendRequest(AllFixesRequest.type, { textDocument: { uri: uri } }).then(function (result) {
            if (result) {
                applyTextEdits(uri, result.documentVersion, result.edits);
            }
        }, function (error) {
            vscode_1.window.showErrorMessage('Failed to apply ESLint fixes to the document. Please consider opening an issue with steps to reproduce.');
        });
    }
    function createDefaultConfiguration() {
        if (!vscode_1.workspace.rootPath) {
            vscode_1.window.showErrorMessage('An ESLint configuration can only be generated if VS Code is opened on a folder.');
        }
        var eslintConfigFile = path.join(vscode_1.workspace.rootPath, '.eslintrc.json');
        if (!fs.existsSync(eslintConfigFile)) {
            fs.writeFileSync(eslintConfigFile, eslintrc, { encoding: 'utf8' });
        }
    }
    context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, 'eslint.enable').start(), vscode_1.commands.registerCommand('eslint.applySingleFix', applyTextEdits), vscode_1.commands.registerCommand('eslint.applySameFixes', applyTextEdits), vscode_1.commands.registerCommand('eslint.applyAllFixes', applyTextEdits), vscode_1.commands.registerCommand('eslint.executeAutofix', runAutoFix), vscode_1.commands.registerCommand('eslint.createConfig', createDefaultConfiguration), vscode_1.commands.registerCommand('eslint.showOutputChannel', function () { client.outputChannel.show(); }), statusBarItem);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map