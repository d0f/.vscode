/* --------------------------------------------------------------------------------------------
 * Copyright (c) Cody Hoover. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const document_1 = require('./utils/document');
const vscode_languageserver_1 = require('vscode-languageserver');
let Path = require('path');
class GhcModProvider {
    constructor(ghcMod, workspaceRoot, logger) {
        this.ghcMod = ghcMod;
        this.workspaceRoot = workspaceRoot;
        this.logger = logger;
    }
    // GHC-MOD COMMANDS
    doCheck(text, uri, mapFile) {
        return this.ghcMod.runGhcModCommand({
            command: 'check',
            text: mapFile ? text : null,
            uri: this.getRelativePath(uri)
        }).then((lines) => {
            return this.parseCheckDiagnostics(lines);
        });
    }
    getType(text, uri, position, mapFile) {
        return this.ghcMod.runGhcModCommand({
            command: 'type',
            text: mapFile ? text : null,
            uri: this.getRelativePath(uri),
            args: [(position.line + 1).toString(), (position.character + 1).toString()]
        }).then((lines) => {
            // Returns results starting with most narrow range
            // Return the first valid type for this position
            // 1 9 1 10 "a"
            // 1 1 1 20 "a -> a"
            return lines.reduce((acc, line) => {
                if (acc) {
                    return acc;
                }
                return this.parseTypeInfo(line, position);
            }, '');
        });
    }
    getInfo(text, uri, position, mapFile) {
        return this.getInfoHelper(text, uri, position, mapFile).then((info) => {
            let tooltip = info.replace(/-- Defined at (.+?):(\d+):(\d+)/g, '');
            if (tooltip.indexOf('Cannot show info') === -1) {
                return tooltip;
            }
            else {
                return '';
            }
        });
    }
    shutdown() {
        this.ghcMod.killProcess();
    }
    getDefinitionLocation(text, uri, position, root) {
        return this.getInfoHelper(text, uri, position, false).then((info) => {
            return this.parseInfoForDefinition(info, root);
        });
    }
    // PRIVATE METHODS
    getInfoHelper(text, uri, position, mapFile) {
        let word = document_1.DocumentUtils.getWordAtPosition(text, position);
        // Fix for https://github.com/hoovercj/vscode-ghc-mod/issues/11
        if (word == '->') {
            word = '(->)';
        }
        // Comments make ghc-mod freakout
        if (!word || this.isBlacklisted(word)) {
            word = null;
        }
        if (word && word.trim()) {
            return this.ghcMod.runGhcModCommand({
                command: 'info',
                text: mapFile ? text : null,
                uri: this.getRelativePath(uri),
                args: [word]
            }).then((lines) => {
                return lines.join('\n');
            });
        }
        else {
            return Promise.resolve('');
        }
    }
    isBlacklisted(word) {
        // if a string contains the comment sequence: --
        if (/.*--.*/g.test(word)) {
            return true;
        }
        // if a string contains the comment sequences: {\- {- -} -\}
        // if (new RegExp("\{\\?-|-\\?\}", "g").test(word)) {
        if (new RegExp("{-|-}", "g").test(word)) {
            return true;
        }
        if (word.indexOf('-\\}') != -1 || word.indexOf('{\\-') != -1) {
            return true;
        }
        // Explore this regex from the haskell textmate bundle
        // (^[ \t]+)?(?=--+((?![\p{S}\p{P}])|[(),;\[\]`{}_"']))
        return false;
    }
    parseInfoForDefinition(text, root) {
        let regex = /-- Defined at (.+?):(\d+):(\d+)/g;
        let match;
        let locations = [];
        do {
            match = regex.exec(text);
            if (match) {
                let uri = this.filepathToUri(match[1]);
                let range = vscode_languageserver_1.Range.create(parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1, parseInt(match[2], 10) - 1, parseInt(match[3], 10) - 1);
                locations.push(vscode_languageserver_1.Location.create(uri, range));
            }
        } while (match);
        return locations;
    }
    filepathToUri(filepath) {
        if (!Path.isAbsolute(filepath)) {
            filepath = Path.join(this.workspaceRoot || '', filepath || '');
        }
        return `file:///${filepath.replace('\\', '/')}`;
    }
    getRelativePath(filepath) {
        return Path.relative(this.workspaceRoot || '', filepath || '');
    }
    parseTypeInfo(line, position) {
        // Example line: 4 1 4 17 "a -> a"
        let tokens = line.split('"');
        let type = tokens[1] || '';
        let pos = tokens[0].trim().split(' ').map((i) => {
            return parseInt(i, 10) - 1;
        });
        let typeRange;
        try {
            typeRange = vscode_languageserver_1.Range.create(pos[0], pos[1], pos[2], pos[3]);
        }
        catch (error) {
            return '';
        }
        if (document_1.DocumentUtils.isPositionInRange(position, typeRange)) {
            return type;
        }
        else {
            return '';
        }
    }
    parseCheckDiagnostics(lines) {
        let diagnostics = [];
        lines.forEach((line) => {
            let match = line.match(/^(.*?):([0-9]+):([0-9]+): *(?:(Warning|Error): *)?/);
            if (match) {
                diagnostics.push({
                    severity: match[4] === 'Warning' ? vscode_languageserver_1.DiagnosticSeverity.Warning : vscode_languageserver_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: parseInt(match[2], 10) - 1, character: parseInt(match[3], 10) - 1 },
                        end: { line: parseInt(match[2], 10) - 1, character: parseInt(match[3], 10) - 1 }
                    },
                    message: line.replace(match[0], '')
                });
            }
        });
        return diagnostics;
    }
}
exports.GhcModProvider = GhcModProvider;
//# sourceMappingURL=ghcModProvider.js.map