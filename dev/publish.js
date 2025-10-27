// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
    target = mod != null ? __create(__getProtoOf(mod)) : {};
    const to =
        isNodeMode || !mod || !mod.__esModule
            ? __defProp(target, "default", { value: mod, enumerable: true })
            : target;
    for (let key of __getOwnPropNames(mod))
        if (!__hasOwnProp.call(to, key))
            __defProp(to, key, {
                get: () => mod[key],
                enumerable: true,
            });
    return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
    for (var name in all)
        __defProp(target, name, {
            get: all[name],
            enumerable: true,
            configurable: true,
            set: (newValue) => (all[name] = () => newValue),
        });
};
var __require = import.meta.require;

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
    class CommanderError extends Error {
        constructor(exitCode, code, message) {
            super(message);
            Error.captureStackTrace(this, this.constructor);
            this.name = this.constructor.name;
            this.code = code;
            this.exitCode = exitCode;
            this.nestedError = undefined;
        }
    }

    class InvalidArgumentError extends CommanderError {
        constructor(message) {
            super(1, "commander.invalidArgument", message);
            Error.captureStackTrace(this, this.constructor);
            this.name = this.constructor.name;
        }
    }
    exports.CommanderError = CommanderError;
    exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
    var { InvalidArgumentError } = require_error();

    class Argument {
        constructor(name, description) {
            this.description = description || "";
            this.variadic = false;
            this.parseArg = undefined;
            this.defaultValue = undefined;
            this.defaultValueDescription = undefined;
            this.argChoices = undefined;
            switch (name[0]) {
                case "<":
                    this.required = true;
                    this._name = name.slice(1, -1);
                    break;
                case "[":
                    this.required = false;
                    this._name = name.slice(1, -1);
                    break;
                default:
                    this.required = true;
                    this._name = name;
                    break;
            }
            if (this._name.endsWith("...")) {
                this.variadic = true;
                this._name = this._name.slice(0, -3);
            }
        }
        name() {
            return this._name;
        }
        _collectValue(value, previous) {
            if (previous === this.defaultValue || !Array.isArray(previous)) {
                return [value];
            }
            previous.push(value);
            return previous;
        }
        default(value, description) {
            this.defaultValue = value;
            this.defaultValueDescription = description;
            return this;
        }
        argParser(fn) {
            this.parseArg = fn;
            return this;
        }
        choices(values) {
            this.argChoices = values.slice();
            this.parseArg = (arg, previous) => {
                if (!this.argChoices.includes(arg)) {
                    throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
                }
                if (this.variadic) {
                    return this._collectValue(arg, previous);
                }
                return arg;
            };
            return this;
        }
        argRequired() {
            this.required = true;
            return this;
        }
        argOptional() {
            this.required = false;
            return this;
        }
    }
    function humanReadableArgName(arg) {
        const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
        return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports.Argument = Argument;
    exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
    var { humanReadableArgName } = require_argument();

    class Help {
        constructor() {
            this.helpWidth = undefined;
            this.minWidthToWrap = 40;
            this.sortSubcommands = false;
            this.sortOptions = false;
            this.showGlobalOptions = false;
        }
        prepareContext(contextOptions) {
            this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
        }
        visibleCommands(cmd) {
            const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
            const helpCommand = cmd._getHelpCommand();
            if (helpCommand && !helpCommand._hidden) {
                visibleCommands.push(helpCommand);
            }
            if (this.sortSubcommands) {
                visibleCommands.sort((a, b) => {
                    return a.name().localeCompare(b.name());
                });
            }
            return visibleCommands;
        }
        compareOptions(a, b) {
            const getSortKey = (option) => {
                return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
            };
            return getSortKey(a).localeCompare(getSortKey(b));
        }
        visibleOptions(cmd) {
            const visibleOptions = cmd.options.filter((option) => !option.hidden);
            const helpOption = cmd._getHelpOption();
            if (helpOption && !helpOption.hidden) {
                const removeShort = helpOption.short && cmd._findOption(helpOption.short);
                const removeLong = helpOption.long && cmd._findOption(helpOption.long);
                if (!removeShort && !removeLong) {
                    visibleOptions.push(helpOption);
                } else if (helpOption.long && !removeLong) {
                    visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
                } else if (helpOption.short && !removeShort) {
                    visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
                }
            }
            if (this.sortOptions) {
                visibleOptions.sort(this.compareOptions);
            }
            return visibleOptions;
        }
        visibleGlobalOptions(cmd) {
            if (!this.showGlobalOptions) return [];
            const globalOptions = [];
            for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
                const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
                globalOptions.push(...visibleOptions);
            }
            if (this.sortOptions) {
                globalOptions.sort(this.compareOptions);
            }
            return globalOptions;
        }
        visibleArguments(cmd) {
            if (cmd._argsDescription) {
                cmd.registeredArguments.forEach((argument) => {
                    argument.description =
                        argument.description || cmd._argsDescription[argument.name()] || "";
                });
            }
            if (cmd.registeredArguments.find((argument) => argument.description)) {
                return cmd.registeredArguments;
            }
            return [];
        }
        subcommandTerm(cmd) {
            const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
            return (
                cmd._name +
                (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") +
                (cmd.options.length ? " [options]" : "") +
                (args ? " " + args : "")
            );
        }
        optionTerm(option) {
            return option.flags;
        }
        argumentTerm(argument) {
            return argument.name();
        }
        longestSubcommandTermLength(cmd, helper) {
            return helper.visibleCommands(cmd).reduce((max, command) => {
                return Math.max(
                    max,
                    this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command)))
                );
            }, 0);
        }
        longestOptionTermLength(cmd, helper) {
            return helper.visibleOptions(cmd).reduce((max, option) => {
                return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
            }, 0);
        }
        longestGlobalOptionTermLength(cmd, helper) {
            return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
                return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
            }, 0);
        }
        longestArgumentTermLength(cmd, helper) {
            return helper.visibleArguments(cmd).reduce((max, argument) => {
                return Math.max(
                    max,
                    this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument)))
                );
            }, 0);
        }
        commandUsage(cmd) {
            let cmdName = cmd._name;
            if (cmd._aliases[0]) {
                cmdName = cmdName + "|" + cmd._aliases[0];
            }
            let ancestorCmdNames = "";
            for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
                ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
            }
            return ancestorCmdNames + cmdName + " " + cmd.usage();
        }
        commandDescription(cmd) {
            return cmd.description();
        }
        subcommandDescription(cmd) {
            return cmd.summary() || cmd.description();
        }
        optionDescription(option) {
            const extraInfo = [];
            if (option.argChoices) {
                extraInfo.push(
                    `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
                );
            }
            if (option.defaultValue !== undefined) {
                const showDefault =
                    option.required ||
                    option.optional ||
                    (option.isBoolean() && typeof option.defaultValue === "boolean");
                if (showDefault) {
                    extraInfo.push(
                        `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
                    );
                }
            }
            if (option.presetArg !== undefined && option.optional) {
                extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
            }
            if (option.envVar !== undefined) {
                extraInfo.push(`env: ${option.envVar}`);
            }
            if (extraInfo.length > 0) {
                const extraDescription = `(${extraInfo.join(", ")})`;
                if (option.description) {
                    return `${option.description} ${extraDescription}`;
                }
                return extraDescription;
            }
            return option.description;
        }
        argumentDescription(argument) {
            const extraInfo = [];
            if (argument.argChoices) {
                extraInfo.push(
                    `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
                );
            }
            if (argument.defaultValue !== undefined) {
                extraInfo.push(
                    `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
                );
            }
            if (extraInfo.length > 0) {
                const extraDescription = `(${extraInfo.join(", ")})`;
                if (argument.description) {
                    return `${argument.description} ${extraDescription}`;
                }
                return extraDescription;
            }
            return argument.description;
        }
        formatItemList(heading, items, helper) {
            if (items.length === 0) return [];
            return [helper.styleTitle(heading), ...items, ""];
        }
        groupItems(unsortedItems, visibleItems, getGroup) {
            const result = new Map();
            unsortedItems.forEach((item) => {
                const group = getGroup(item);
                if (!result.has(group)) result.set(group, []);
            });
            visibleItems.forEach((item) => {
                const group = getGroup(item);
                if (!result.has(group)) {
                    result.set(group, []);
                }
                result.get(group).push(item);
            });
            return result;
        }
        formatHelp(cmd, helper) {
            const termWidth = helper.padWidth(cmd, helper);
            const helpWidth = helper.helpWidth ?? 80;
            function callFormatItem(term, description) {
                return helper.formatItem(term, termWidth, description, helper);
            }
            let output = [
                `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
                "",
            ];
            const commandDescription = helper.commandDescription(cmd);
            if (commandDescription.length > 0) {
                output = output.concat([
                    helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
                    "",
                ]);
            }
            const argumentList = helper.visibleArguments(cmd).map((argument) => {
                return callFormatItem(
                    helper.styleArgumentTerm(helper.argumentTerm(argument)),
                    helper.styleArgumentDescription(helper.argumentDescription(argument))
                );
            });
            output = output.concat(this.formatItemList("Arguments:", argumentList, helper));
            const optionGroups = this.groupItems(
                cmd.options,
                helper.visibleOptions(cmd),
                (option) => option.helpGroupHeading ?? "Options:"
            );
            optionGroups.forEach((options, group) => {
                const optionList = options.map((option) => {
                    return callFormatItem(
                        helper.styleOptionTerm(helper.optionTerm(option)),
                        helper.styleOptionDescription(helper.optionDescription(option))
                    );
                });
                output = output.concat(this.formatItemList(group, optionList, helper));
            });
            if (helper.showGlobalOptions) {
                const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
                    return callFormatItem(
                        helper.styleOptionTerm(helper.optionTerm(option)),
                        helper.styleOptionDescription(helper.optionDescription(option))
                    );
                });
                output = output.concat(this.formatItemList("Global Options:", globalOptionList, helper));
            }
            const commandGroups = this.groupItems(
                cmd.commands,
                helper.visibleCommands(cmd),
                (sub) => sub.helpGroup() || "Commands:"
            );
            commandGroups.forEach((commands, group) => {
                const commandList = commands.map((sub) => {
                    return callFormatItem(
                        helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
                        helper.styleSubcommandDescription(helper.subcommandDescription(sub))
                    );
                });
                output = output.concat(this.formatItemList(group, commandList, helper));
            });
            return output.join(`
`);
        }
        displayWidth(str) {
            return stripColor(str).length;
        }
        styleTitle(str) {
            return str;
        }
        styleUsage(str) {
            return str
                .split(" ")
                .map((word) => {
                    if (word === "[options]") return this.styleOptionText(word);
                    if (word === "[command]") return this.styleSubcommandText(word);
                    if (word[0] === "[" || word[0] === "<") return this.styleArgumentText(word);
                    return this.styleCommandText(word);
                })
                .join(" ");
        }
        styleCommandDescription(str) {
            return this.styleDescriptionText(str);
        }
        styleOptionDescription(str) {
            return this.styleDescriptionText(str);
        }
        styleSubcommandDescription(str) {
            return this.styleDescriptionText(str);
        }
        styleArgumentDescription(str) {
            return this.styleDescriptionText(str);
        }
        styleDescriptionText(str) {
            return str;
        }
        styleOptionTerm(str) {
            return this.styleOptionText(str);
        }
        styleSubcommandTerm(str) {
            return str
                .split(" ")
                .map((word) => {
                    if (word === "[options]") return this.styleOptionText(word);
                    if (word[0] === "[" || word[0] === "<") return this.styleArgumentText(word);
                    return this.styleSubcommandText(word);
                })
                .join(" ");
        }
        styleArgumentTerm(str) {
            return this.styleArgumentText(str);
        }
        styleOptionText(str) {
            return str;
        }
        styleArgumentText(str) {
            return str;
        }
        styleSubcommandText(str) {
            return str;
        }
        styleCommandText(str) {
            return str;
        }
        padWidth(cmd, helper) {
            return Math.max(
                helper.longestOptionTermLength(cmd, helper),
                helper.longestGlobalOptionTermLength(cmd, helper),
                helper.longestSubcommandTermLength(cmd, helper),
                helper.longestArgumentTermLength(cmd, helper)
            );
        }
        preformatted(str) {
            return /\n[^\S\r\n]/.test(str);
        }
        formatItem(term, termWidth, description, helper) {
            const itemIndent = 2;
            const itemIndentStr = " ".repeat(itemIndent);
            if (!description) return itemIndentStr + term;
            const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
            const spacerWidth = 2;
            const helpWidth = this.helpWidth ?? 80;
            const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
            let formattedDescription;
            if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
                formattedDescription = description;
            } else {
                const wrappedDescription = helper.boxWrap(description, remainingWidth);
                formattedDescription = wrappedDescription.replace(
                    /\n/g,
                    `
` + " ".repeat(termWidth + spacerWidth)
                );
            }
            return (
                itemIndentStr +
                paddedTerm +
                " ".repeat(spacerWidth) +
                formattedDescription.replace(
                    /\n/g,
                    `
${itemIndentStr}`
                )
            );
        }
        boxWrap(str, width) {
            if (width < this.minWidthToWrap) return str;
            const rawLines = str.split(/\r\n|\n/);
            const chunkPattern = /[\s]*[^\s]+/g;
            const wrappedLines = [];
            rawLines.forEach((line) => {
                const chunks = line.match(chunkPattern);
                if (chunks === null) {
                    wrappedLines.push("");
                    return;
                }
                let sumChunks = [chunks.shift()];
                let sumWidth = this.displayWidth(sumChunks[0]);
                chunks.forEach((chunk) => {
                    const visibleWidth = this.displayWidth(chunk);
                    if (sumWidth + visibleWidth <= width) {
                        sumChunks.push(chunk);
                        sumWidth += visibleWidth;
                        return;
                    }
                    wrappedLines.push(sumChunks.join(""));
                    const nextChunk = chunk.trimStart();
                    sumChunks = [nextChunk];
                    sumWidth = this.displayWidth(nextChunk);
                });
                wrappedLines.push(sumChunks.join(""));
            });
            return wrappedLines.join(`
`);
        }
    }
    function stripColor(str) {
        const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
        return str.replace(sgrPattern, "");
    }
    exports.Help = Help;
    exports.stripColor = stripColor;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
    var { InvalidArgumentError } = require_error();

    class Option {
        constructor(flags, description) {
            this.flags = flags;
            this.description = description || "";
            this.required = flags.includes("<");
            this.optional = flags.includes("[");
            this.variadic = /\w\.\.\.[>\]]$/.test(flags);
            this.mandatory = false;
            const optionFlags = splitOptionFlags(flags);
            this.short = optionFlags.shortFlag;
            this.long = optionFlags.longFlag;
            this.negate = false;
            if (this.long) {
                this.negate = this.long.startsWith("--no-");
            }
            this.defaultValue = undefined;
            this.defaultValueDescription = undefined;
            this.presetArg = undefined;
            this.envVar = undefined;
            this.parseArg = undefined;
            this.hidden = false;
            this.argChoices = undefined;
            this.conflictsWith = [];
            this.implied = undefined;
            this.helpGroupHeading = undefined;
        }
        default(value, description) {
            this.defaultValue = value;
            this.defaultValueDescription = description;
            return this;
        }
        preset(arg) {
            this.presetArg = arg;
            return this;
        }
        conflicts(names) {
            this.conflictsWith = this.conflictsWith.concat(names);
            return this;
        }
        implies(impliedOptionValues) {
            let newImplied = impliedOptionValues;
            if (typeof impliedOptionValues === "string") {
                newImplied = { [impliedOptionValues]: true };
            }
            this.implied = Object.assign(this.implied || {}, newImplied);
            return this;
        }
        env(name) {
            this.envVar = name;
            return this;
        }
        argParser(fn) {
            this.parseArg = fn;
            return this;
        }
        makeOptionMandatory(mandatory = true) {
            this.mandatory = !!mandatory;
            return this;
        }
        hideHelp(hide = true) {
            this.hidden = !!hide;
            return this;
        }
        _collectValue(value, previous) {
            if (previous === this.defaultValue || !Array.isArray(previous)) {
                return [value];
            }
            previous.push(value);
            return previous;
        }
        choices(values) {
            this.argChoices = values.slice();
            this.parseArg = (arg, previous) => {
                if (!this.argChoices.includes(arg)) {
                    throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
                }
                if (this.variadic) {
                    return this._collectValue(arg, previous);
                }
                return arg;
            };
            return this;
        }
        name() {
            if (this.long) {
                return this.long.replace(/^--/, "");
            }
            return this.short.replace(/^-/, "");
        }
        attributeName() {
            if (this.negate) {
                return camelcase(this.name().replace(/^no-/, ""));
            }
            return camelcase(this.name());
        }
        helpGroup(heading) {
            this.helpGroupHeading = heading;
            return this;
        }
        is(arg) {
            return this.short === arg || this.long === arg;
        }
        isBoolean() {
            return !this.required && !this.optional && !this.negate;
        }
    }

    class DualOptions {
        constructor(options) {
            this.positiveOptions = new Map();
            this.negativeOptions = new Map();
            this.dualOptions = new Set();
            options.forEach((option) => {
                if (option.negate) {
                    this.negativeOptions.set(option.attributeName(), option);
                } else {
                    this.positiveOptions.set(option.attributeName(), option);
                }
            });
            this.negativeOptions.forEach((value, key) => {
                if (this.positiveOptions.has(key)) {
                    this.dualOptions.add(key);
                }
            });
        }
        valueFromOption(value, option) {
            const optionKey = option.attributeName();
            if (!this.dualOptions.has(optionKey)) return true;
            const preset = this.negativeOptions.get(optionKey).presetArg;
            const negativeValue = preset !== undefined ? preset : false;
            return option.negate === (negativeValue === value);
        }
    }
    function camelcase(str) {
        return str.split("-").reduce((str2, word) => {
            return str2 + word[0].toUpperCase() + word.slice(1);
        });
    }
    function splitOptionFlags(flags) {
        let shortFlag;
        let longFlag;
        const shortFlagExp = /^-[^-]$/;
        const longFlagExp = /^--[^-]/;
        const flagParts = flags.split(/[ |,]+/).concat("guard");
        if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
        if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
        if (!shortFlag && shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
        if (!shortFlag && longFlagExp.test(flagParts[0])) {
            shortFlag = longFlag;
            longFlag = flagParts.shift();
        }
        if (flagParts[0].startsWith("-")) {
            const unsupportedFlag = flagParts[0];
            const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
            if (/^-[^-][^-]/.test(unsupportedFlag))
                throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
            if (shortFlagExp.test(unsupportedFlag))
                throw new Error(`${baseError}
- too many short flags`);
            if (longFlagExp.test(unsupportedFlag))
                throw new Error(`${baseError}
- too many long flags`);
            throw new Error(`${baseError}
- unrecognised flag format`);
        }
        if (shortFlag === undefined && longFlag === undefined)
            throw new Error(`option creation failed due to no flags found in '${flags}'.`);
        return { shortFlag, longFlag };
    }
    exports.Option = Option;
    exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
    var maxDistance = 3;
    function editDistance(a, b) {
        if (Math.abs(a.length - b.length) > maxDistance) return Math.max(a.length, b.length);
        const d = [];
        for (let i = 0; i <= a.length; i++) {
            d[i] = [i];
        }
        for (let j = 0; j <= b.length; j++) {
            d[0][j] = j;
        }
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                let cost = 1;
                if (a[i - 1] === b[j - 1]) {
                    cost = 0;
                } else {
                    cost = 1;
                }
                d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                    d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
                }
            }
        }
        return d[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
        if (!candidates || candidates.length === 0) return "";
        candidates = Array.from(new Set(candidates));
        const searchingOptions = word.startsWith("--");
        if (searchingOptions) {
            word = word.slice(2);
            candidates = candidates.map((candidate) => candidate.slice(2));
        }
        let similar = [];
        let bestDistance = maxDistance;
        const minSimilarity = 0.4;
        candidates.forEach((candidate) => {
            if (candidate.length <= 1) return;
            const distance = editDistance(word, candidate);
            const length = Math.max(word.length, candidate.length);
            const similarity = (length - distance) / length;
            if (similarity > minSimilarity) {
                if (distance < bestDistance) {
                    bestDistance = distance;
                    similar = [candidate];
                } else if (distance === bestDistance) {
                    similar.push(candidate);
                }
            }
        });
        similar.sort((a, b) => a.localeCompare(b));
        if (searchingOptions) {
            similar = similar.map((candidate) => `--${candidate}`);
        }
        if (similar.length > 1) {
            return `
(Did you mean one of ${similar.join(", ")}?)`;
        }
        if (similar.length === 1) {
            return `
(Did you mean ${similar[0]}?)`;
        }
        return "";
    }
    exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
    var EventEmitter = __require("events").EventEmitter;
    var childProcess = __require("child_process");
    var path = __require("path");
    var fs = __require("fs");
    var process9 = __require("process");
    var { Argument, humanReadableArgName } = require_argument();
    var { CommanderError } = require_error();
    var { Help, stripColor } = require_help();
    var { Option, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();

    class Command extends EventEmitter {
        constructor(name) {
            super();
            this.commands = [];
            this.options = [];
            this.parent = null;
            this._allowUnknownOption = false;
            this._allowExcessArguments = false;
            this.registeredArguments = [];
            this._args = this.registeredArguments;
            this.args = [];
            this.rawArgs = [];
            this.processedArgs = [];
            this._scriptPath = null;
            this._name = name || "";
            this._optionValues = {};
            this._optionValueSources = {};
            this._storeOptionsAsProperties = false;
            this._actionHandler = null;
            this._executableHandler = false;
            this._executableFile = null;
            this._executableDir = null;
            this._defaultCommandName = null;
            this._exitCallback = null;
            this._aliases = [];
            this._combineFlagAndOptionalValue = true;
            this._description = "";
            this._summary = "";
            this._argsDescription = undefined;
            this._enablePositionalOptions = false;
            this._passThroughOptions = false;
            this._lifeCycleHooks = {};
            this._showHelpAfterError = false;
            this._showSuggestionAfterError = true;
            this._savedState = null;
            this._outputConfiguration = {
                writeOut: (str) => process9.stdout.write(str),
                writeErr: (str) => process9.stderr.write(str),
                outputError: (str, write) => write(str),
                getOutHelpWidth: () => (process9.stdout.isTTY ? process9.stdout.columns : undefined),
                getErrHelpWidth: () => (process9.stderr.isTTY ? process9.stderr.columns : undefined),
                getOutHasColors: () => useColor() ?? (process9.stdout.isTTY && process9.stdout.hasColors?.()),
                getErrHasColors: () => useColor() ?? (process9.stderr.isTTY && process9.stderr.hasColors?.()),
                stripColor: (str) => stripColor(str),
            };
            this._hidden = false;
            this._helpOption = undefined;
            this._addImplicitHelpCommand = undefined;
            this._helpCommand = undefined;
            this._helpConfiguration = {};
            this._helpGroupHeading = undefined;
            this._defaultCommandGroup = undefined;
            this._defaultOptionGroup = undefined;
        }
        copyInheritedSettings(sourceCommand) {
            this._outputConfiguration = sourceCommand._outputConfiguration;
            this._helpOption = sourceCommand._helpOption;
            this._helpCommand = sourceCommand._helpCommand;
            this._helpConfiguration = sourceCommand._helpConfiguration;
            this._exitCallback = sourceCommand._exitCallback;
            this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
            this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
            this._allowExcessArguments = sourceCommand._allowExcessArguments;
            this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
            this._showHelpAfterError = sourceCommand._showHelpAfterError;
            this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
            return this;
        }
        _getCommandAndAncestors() {
            const result = [];
            for (let command = this; command; command = command.parent) {
                result.push(command);
            }
            return result;
        }
        command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
            let desc = actionOptsOrExecDesc;
            let opts = execOpts;
            if (typeof desc === "object" && desc !== null) {
                opts = desc;
                desc = null;
            }
            opts = opts || {};
            const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
            const cmd = this.createCommand(name);
            if (desc) {
                cmd.description(desc);
                cmd._executableHandler = true;
            }
            if (opts.isDefault) this._defaultCommandName = cmd._name;
            cmd._hidden = !!(opts.noHelp || opts.hidden);
            cmd._executableFile = opts.executableFile || null;
            if (args) cmd.arguments(args);
            this._registerCommand(cmd);
            cmd.parent = this;
            cmd.copyInheritedSettings(this);
            if (desc) return this;
            return cmd;
        }
        createCommand(name) {
            return new Command(name);
        }
        createHelp() {
            return Object.assign(new Help(), this.configureHelp());
        }
        configureHelp(configuration) {
            if (configuration === undefined) return this._helpConfiguration;
            this._helpConfiguration = configuration;
            return this;
        }
        configureOutput(configuration) {
            if (configuration === undefined) return this._outputConfiguration;
            this._outputConfiguration = {
                ...this._outputConfiguration,
                ...configuration,
            };
            return this;
        }
        showHelpAfterError(displayHelp = true) {
            if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
            this._showHelpAfterError = displayHelp;
            return this;
        }
        showSuggestionAfterError(displaySuggestion = true) {
            this._showSuggestionAfterError = !!displaySuggestion;
            return this;
        }
        addCommand(cmd, opts) {
            if (!cmd._name) {
                throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
            }
            opts = opts || {};
            if (opts.isDefault) this._defaultCommandName = cmd._name;
            if (opts.noHelp || opts.hidden) cmd._hidden = true;
            this._registerCommand(cmd);
            cmd.parent = this;
            cmd._checkForBrokenPassThrough();
            return this;
        }
        createArgument(name, description) {
            return new Argument(name, description);
        }
        argument(name, description, parseArg, defaultValue) {
            const argument = this.createArgument(name, description);
            if (typeof parseArg === "function") {
                argument.default(defaultValue).argParser(parseArg);
            } else {
                argument.default(parseArg);
            }
            this.addArgument(argument);
            return this;
        }
        arguments(names) {
            names
                .trim()
                .split(/ +/)
                .forEach((detail) => {
                    this.argument(detail);
                });
            return this;
        }
        addArgument(argument) {
            const previousArgument = this.registeredArguments.slice(-1)[0];
            if (previousArgument?.variadic) {
                throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
            }
            if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
                throw new Error(
                    `a default value for a required argument is never used: '${argument.name()}'`
                );
            }
            this.registeredArguments.push(argument);
            return this;
        }
        helpCommand(enableOrNameAndArgs, description) {
            if (typeof enableOrNameAndArgs === "boolean") {
                this._addImplicitHelpCommand = enableOrNameAndArgs;
                if (enableOrNameAndArgs && this._defaultCommandGroup) {
                    this._initCommandGroup(this._getHelpCommand());
                }
                return this;
            }
            const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
            const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
            const helpDescription = description ?? "display help for command";
            const helpCommand = this.createCommand(helpName);
            helpCommand.helpOption(false);
            if (helpArgs) helpCommand.arguments(helpArgs);
            if (helpDescription) helpCommand.description(helpDescription);
            this._addImplicitHelpCommand = true;
            this._helpCommand = helpCommand;
            if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
            return this;
        }
        addHelpCommand(helpCommand, deprecatedDescription) {
            if (typeof helpCommand !== "object") {
                this.helpCommand(helpCommand, deprecatedDescription);
                return this;
            }
            this._addImplicitHelpCommand = true;
            this._helpCommand = helpCommand;
            this._initCommandGroup(helpCommand);
            return this;
        }
        _getHelpCommand() {
            const hasImplicitHelpCommand =
                this._addImplicitHelpCommand ??
                (this.commands.length && !this._actionHandler && !this._findCommand("help"));
            if (hasImplicitHelpCommand) {
                if (this._helpCommand === undefined) {
                    this.helpCommand(undefined, undefined);
                }
                return this._helpCommand;
            }
            return null;
        }
        hook(event, listener) {
            const allowedValues = ["preSubcommand", "preAction", "postAction"];
            if (!allowedValues.includes(event)) {
                throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
            }
            if (this._lifeCycleHooks[event]) {
                this._lifeCycleHooks[event].push(listener);
            } else {
                this._lifeCycleHooks[event] = [listener];
            }
            return this;
        }
        exitOverride(fn) {
            if (fn) {
                this._exitCallback = fn;
            } else {
                this._exitCallback = (err) => {
                    if (err.code !== "commander.executeSubCommandAsync") {
                        throw err;
                    } else {
                    }
                };
            }
            return this;
        }
        _exit(exitCode, code, message) {
            if (this._exitCallback) {
                this._exitCallback(new CommanderError(exitCode, code, message));
            }
            process9.exit(exitCode);
        }
        action(fn) {
            const listener = (args) => {
                const expectedArgsCount = this.registeredArguments.length;
                const actionArgs = args.slice(0, expectedArgsCount);
                if (this._storeOptionsAsProperties) {
                    actionArgs[expectedArgsCount] = this;
                } else {
                    actionArgs[expectedArgsCount] = this.opts();
                }
                actionArgs.push(this);
                return fn.apply(this, actionArgs);
            };
            this._actionHandler = listener;
            return this;
        }
        createOption(flags, description) {
            return new Option(flags, description);
        }
        _callParseArg(target, value, previous, invalidArgumentMessage) {
            try {
                return target.parseArg(value, previous);
            } catch (err) {
                if (err.code === "commander.invalidArgument") {
                    const message = `${invalidArgumentMessage} ${err.message}`;
                    this.error(message, { exitCode: err.exitCode, code: err.code });
                }
                throw err;
            }
        }
        _registerOption(option) {
            const matchingOption =
                (option.short && this._findOption(option.short)) ||
                (option.long && this._findOption(option.long));
            if (matchingOption) {
                const matchingFlag =
                    option.long && this._findOption(option.long) ? option.long : option.short;
                throw new Error(`Cannot add option '${option.flags}'${
                    this._name && ` to command '${this._name}'`
                } due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
            }
            this._initOptionGroup(option);
            this.options.push(option);
        }
        _registerCommand(command) {
            const knownBy = (cmd) => {
                return [cmd.name()].concat(cmd.aliases());
            };
            const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
            if (alreadyUsed) {
                const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
                const newCmd = knownBy(command).join("|");
                throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
            }
            this._initCommandGroup(command);
            this.commands.push(command);
        }
        addOption(option) {
            this._registerOption(option);
            const oname = option.name();
            const name = option.attributeName();
            if (option.negate) {
                const positiveLongFlag = option.long.replace(/^--no-/, "--");
                if (!this._findOption(positiveLongFlag)) {
                    this.setOptionValueWithSource(
                        name,
                        option.defaultValue === undefined ? true : option.defaultValue,
                        "default"
                    );
                }
            } else if (option.defaultValue !== undefined) {
                this.setOptionValueWithSource(name, option.defaultValue, "default");
            }
            const handleOptionValue = (val, invalidValueMessage, valueSource) => {
                if (val == null && option.presetArg !== undefined) {
                    val = option.presetArg;
                }
                const oldValue = this.getOptionValue(name);
                if (val !== null && option.parseArg) {
                    val = this._callParseArg(option, val, oldValue, invalidValueMessage);
                } else if (val !== null && option.variadic) {
                    val = option._collectValue(val, oldValue);
                }
                if (val == null) {
                    if (option.negate) {
                        val = false;
                    } else if (option.isBoolean() || option.optional) {
                        val = true;
                    } else {
                        val = "";
                    }
                }
                this.setOptionValueWithSource(name, val, valueSource);
            };
            this.on("option:" + oname, (val) => {
                const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
                handleOptionValue(val, invalidValueMessage, "cli");
            });
            if (option.envVar) {
                this.on("optionEnv:" + oname, (val) => {
                    const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
                    handleOptionValue(val, invalidValueMessage, "env");
                });
            }
            return this;
        }
        _optionEx(config, flags, description, fn, defaultValue) {
            if (typeof flags === "object" && flags instanceof Option) {
                throw new Error(
                    "To add an Option object use addOption() instead of option() or requiredOption()"
                );
            }
            const option = this.createOption(flags, description);
            option.makeOptionMandatory(!!config.mandatory);
            if (typeof fn === "function") {
                option.default(defaultValue).argParser(fn);
            } else if (fn instanceof RegExp) {
                const regex2 = fn;
                fn = (val, def) => {
                    const m = regex2.exec(val);
                    return m ? m[0] : def;
                };
                option.default(defaultValue).argParser(fn);
            } else {
                option.default(fn);
            }
            return this.addOption(option);
        }
        option(flags, description, parseArg, defaultValue) {
            return this._optionEx({}, flags, description, parseArg, defaultValue);
        }
        requiredOption(flags, description, parseArg, defaultValue) {
            return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
        }
        combineFlagAndOptionalValue(combine = true) {
            this._combineFlagAndOptionalValue = !!combine;
            return this;
        }
        allowUnknownOption(allowUnknown = true) {
            this._allowUnknownOption = !!allowUnknown;
            return this;
        }
        allowExcessArguments(allowExcess = true) {
            this._allowExcessArguments = !!allowExcess;
            return this;
        }
        enablePositionalOptions(positional = true) {
            this._enablePositionalOptions = !!positional;
            return this;
        }
        passThroughOptions(passThrough = true) {
            this._passThroughOptions = !!passThrough;
            this._checkForBrokenPassThrough();
            return this;
        }
        _checkForBrokenPassThrough() {
            if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
                throw new Error(
                    `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
                );
            }
        }
        storeOptionsAsProperties(storeAsProperties = true) {
            if (this.options.length) {
                throw new Error("call .storeOptionsAsProperties() before adding options");
            }
            if (Object.keys(this._optionValues).length) {
                throw new Error("call .storeOptionsAsProperties() before setting option values");
            }
            this._storeOptionsAsProperties = !!storeAsProperties;
            return this;
        }
        getOptionValue(key) {
            if (this._storeOptionsAsProperties) {
                return this[key];
            }
            return this._optionValues[key];
        }
        setOptionValue(key, value) {
            return this.setOptionValueWithSource(key, value, undefined);
        }
        setOptionValueWithSource(key, value, source) {
            if (this._storeOptionsAsProperties) {
                this[key] = value;
            } else {
                this._optionValues[key] = value;
            }
            this._optionValueSources[key] = source;
            return this;
        }
        getOptionValueSource(key) {
            return this._optionValueSources[key];
        }
        getOptionValueSourceWithGlobals(key) {
            let source;
            this._getCommandAndAncestors().forEach((cmd) => {
                if (cmd.getOptionValueSource(key) !== undefined) {
                    source = cmd.getOptionValueSource(key);
                }
            });
            return source;
        }
        _prepareUserArgs(argv, parseOptions) {
            if (argv !== undefined && !Array.isArray(argv)) {
                throw new Error("first parameter to parse must be array or undefined");
            }
            parseOptions = parseOptions || {};
            if (argv === undefined && parseOptions.from === undefined) {
                if (process9.versions?.electron) {
                    parseOptions.from = "electron";
                }
                const execArgv = process9.execArgv ?? [];
                if (
                    execArgv.includes("-e") ||
                    execArgv.includes("--eval") ||
                    execArgv.includes("-p") ||
                    execArgv.includes("--print")
                ) {
                    parseOptions.from = "eval";
                }
            }
            if (argv === undefined) {
                argv = process9.argv;
            }
            this.rawArgs = argv.slice();
            let userArgs;
            switch (parseOptions.from) {
                case undefined:
                case "node":
                    this._scriptPath = argv[1];
                    userArgs = argv.slice(2);
                    break;
                case "electron":
                    if (process9.defaultApp) {
                        this._scriptPath = argv[1];
                        userArgs = argv.slice(2);
                    } else {
                        userArgs = argv.slice(1);
                    }
                    break;
                case "user":
                    userArgs = argv.slice(0);
                    break;
                case "eval":
                    userArgs = argv.slice(1);
                    break;
                default:
                    throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
            }
            if (!this._name && this._scriptPath) this.nameFromFilename(this._scriptPath);
            this._name = this._name || "program";
            return userArgs;
        }
        parse(argv, parseOptions) {
            this._prepareForParse();
            const userArgs = this._prepareUserArgs(argv, parseOptions);
            this._parseCommand([], userArgs);
            return this;
        }
        async parseAsync(argv, parseOptions) {
            this._prepareForParse();
            const userArgs = this._prepareUserArgs(argv, parseOptions);
            await this._parseCommand([], userArgs);
            return this;
        }
        _prepareForParse() {
            if (this._savedState === null) {
                this.saveStateBeforeParse();
            } else {
                this.restoreStateBeforeParse();
            }
        }
        saveStateBeforeParse() {
            this._savedState = {
                _name: this._name,
                _optionValues: { ...this._optionValues },
                _optionValueSources: { ...this._optionValueSources },
            };
        }
        restoreStateBeforeParse() {
            if (this._storeOptionsAsProperties)
                throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
            this._name = this._savedState._name;
            this._scriptPath = null;
            this.rawArgs = [];
            this._optionValues = { ...this._savedState._optionValues };
            this._optionValueSources = { ...this._savedState._optionValueSources };
            this.args = [];
            this.processedArgs = [];
        }
        _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
            if (fs.existsSync(executableFile)) return;
            const executableDirMessage = executableDir
                ? `searched for local subcommand relative to directory '${executableDir}'`
                : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
            const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
            throw new Error(executableMissing);
        }
        _executeSubCommand(subcommand, args) {
            args = args.slice();
            let launchWithNode = false;
            const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
            function findFile(baseDir, baseName) {
                const localBin = path.resolve(baseDir, baseName);
                if (fs.existsSync(localBin)) return localBin;
                if (sourceExt.includes(path.extname(baseName))) return;
                const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
                if (foundExt) return `${localBin}${foundExt}`;
                return;
            }
            this._checkForMissingMandatoryOptions();
            this._checkForConflictingOptions();
            let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
            let executableDir = this._executableDir || "";
            if (this._scriptPath) {
                let resolvedScriptPath;
                try {
                    resolvedScriptPath = fs.realpathSync(this._scriptPath);
                } catch {
                    resolvedScriptPath = this._scriptPath;
                }
                executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
            }
            if (executableDir) {
                let localFile = findFile(executableDir, executableFile);
                if (!localFile && !subcommand._executableFile && this._scriptPath) {
                    const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
                    if (legacyName !== this._name) {
                        localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
                    }
                }
                executableFile = localFile || executableFile;
            }
            launchWithNode = sourceExt.includes(path.extname(executableFile));
            let proc;
            if (process9.platform !== "win32") {
                if (launchWithNode) {
                    args.unshift(executableFile);
                    args = incrementNodeInspectorPort(process9.execArgv).concat(args);
                    proc = childProcess.spawn(process9.argv[0], args, { stdio: "inherit" });
                } else {
                    proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
                }
            } else {
                this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                args.unshift(executableFile);
                args = incrementNodeInspectorPort(process9.execArgv).concat(args);
                proc = childProcess.spawn(process9.execPath, args, { stdio: "inherit" });
            }
            if (!proc.killed) {
                const signals2 = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
                signals2.forEach((signal) => {
                    process9.on(signal, () => {
                        if (proc.killed === false && proc.exitCode === null) {
                            proc.kill(signal);
                        }
                    });
                });
            }
            const exitCallback = this._exitCallback;
            proc.on("close", (code) => {
                code = code ?? 1;
                if (!exitCallback) {
                    process9.exit(code);
                } else {
                    exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
                }
            });
            proc.on("error", (err) => {
                if (err.code === "ENOENT") {
                    this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
                } else if (err.code === "EACCES") {
                    throw new Error(`'${executableFile}' not executable`);
                }
                if (!exitCallback) {
                    process9.exit(1);
                } else {
                    const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
                    wrappedError.nestedError = err;
                    exitCallback(wrappedError);
                }
            });
            this.runningCommand = proc;
        }
        _dispatchSubcommand(commandName, operands, unknown) {
            const subCommand = this._findCommand(commandName);
            if (!subCommand) this.help({ error: true });
            subCommand._prepareForParse();
            let promiseChain;
            promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
            promiseChain = this._chainOrCall(promiseChain, () => {
                if (subCommand._executableHandler) {
                    this._executeSubCommand(subCommand, operands.concat(unknown));
                } else {
                    return subCommand._parseCommand(operands, unknown);
                }
            });
            return promiseChain;
        }
        _dispatchHelpCommand(subcommandName) {
            if (!subcommandName) {
                this.help();
            }
            const subCommand = this._findCommand(subcommandName);
            if (subCommand && !subCommand._executableHandler) {
                subCommand.help();
            }
            return this._dispatchSubcommand(
                subcommandName,
                [],
                [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
            );
        }
        _checkNumberOfArguments() {
            this.registeredArguments.forEach((arg, i) => {
                if (arg.required && this.args[i] == null) {
                    this.missingArgument(arg.name());
                }
            });
            if (
                this.registeredArguments.length > 0 &&
                this.registeredArguments[this.registeredArguments.length - 1].variadic
            ) {
                return;
            }
            if (this.args.length > this.registeredArguments.length) {
                this._excessArguments(this.args);
            }
        }
        _processArguments() {
            const myParseArg = (argument, value, previous) => {
                let parsedValue = value;
                if (value !== null && argument.parseArg) {
                    const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
                    parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
                }
                return parsedValue;
            };
            this._checkNumberOfArguments();
            const processedArgs = [];
            this.registeredArguments.forEach((declaredArg, index) => {
                let value = declaredArg.defaultValue;
                if (declaredArg.variadic) {
                    if (index < this.args.length) {
                        value = this.args.slice(index);
                        if (declaredArg.parseArg) {
                            value = value.reduce((processed, v) => {
                                return myParseArg(declaredArg, v, processed);
                            }, declaredArg.defaultValue);
                        }
                    } else if (value === undefined) {
                        value = [];
                    }
                } else if (index < this.args.length) {
                    value = this.args[index];
                    if (declaredArg.parseArg) {
                        value = myParseArg(declaredArg, value, declaredArg.defaultValue);
                    }
                }
                processedArgs[index] = value;
            });
            this.processedArgs = processedArgs;
        }
        _chainOrCall(promise, fn) {
            if (promise?.then && typeof promise.then === "function") {
                return promise.then(() => fn());
            }
            return fn();
        }
        _chainOrCallHooks(promise, event) {
            let result = promise;
            const hooks = [];
            this._getCommandAndAncestors()
                .reverse()
                .filter((cmd) => cmd._lifeCycleHooks[event] !== undefined)
                .forEach((hookedCommand) => {
                    hookedCommand._lifeCycleHooks[event].forEach((callback) => {
                        hooks.push({ hookedCommand, callback });
                    });
                });
            if (event === "postAction") {
                hooks.reverse();
            }
            hooks.forEach((hookDetail) => {
                result = this._chainOrCall(result, () => {
                    return hookDetail.callback(hookDetail.hookedCommand, this);
                });
            });
            return result;
        }
        _chainOrCallSubCommandHook(promise, subCommand, event) {
            let result = promise;
            if (this._lifeCycleHooks[event] !== undefined) {
                this._lifeCycleHooks[event].forEach((hook) => {
                    result = this._chainOrCall(result, () => {
                        return hook(this, subCommand);
                    });
                });
            }
            return result;
        }
        _parseCommand(operands, unknown) {
            const parsed = this.parseOptions(unknown);
            this._parseOptionsEnv();
            this._parseOptionsImplied();
            operands = operands.concat(parsed.operands);
            unknown = parsed.unknown;
            this.args = operands.concat(unknown);
            if (operands && this._findCommand(operands[0])) {
                return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
            }
            if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
                return this._dispatchHelpCommand(operands[1]);
            }
            if (this._defaultCommandName) {
                this._outputHelpIfRequested(unknown);
                return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
            }
            if (
                this.commands.length &&
                this.args.length === 0 &&
                !this._actionHandler &&
                !this._defaultCommandName
            ) {
                this.help({ error: true });
            }
            this._outputHelpIfRequested(parsed.unknown);
            this._checkForMissingMandatoryOptions();
            this._checkForConflictingOptions();
            const checkForUnknownOptions = () => {
                if (parsed.unknown.length > 0) {
                    this.unknownOption(parsed.unknown[0]);
                }
            };
            const commandEvent = `command:${this.name()}`;
            if (this._actionHandler) {
                checkForUnknownOptions();
                this._processArguments();
                let promiseChain;
                promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
                promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
                if (this.parent) {
                    promiseChain = this._chainOrCall(promiseChain, () => {
                        this.parent.emit(commandEvent, operands, unknown);
                    });
                }
                promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
                return promiseChain;
            }
            if (this.parent?.listenerCount(commandEvent)) {
                checkForUnknownOptions();
                this._processArguments();
                this.parent.emit(commandEvent, operands, unknown);
            } else if (operands.length) {
                if (this._findCommand("*")) {
                    return this._dispatchSubcommand("*", operands, unknown);
                }
                if (this.listenerCount("command:*")) {
                    this.emit("command:*", operands, unknown);
                } else if (this.commands.length) {
                    this.unknownCommand();
                } else {
                    checkForUnknownOptions();
                    this._processArguments();
                }
            } else if (this.commands.length) {
                checkForUnknownOptions();
                this.help({ error: true });
            } else {
                checkForUnknownOptions();
                this._processArguments();
            }
        }
        _findCommand(name) {
            if (!name) return;
            return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
        }
        _findOption(arg) {
            return this.options.find((option) => option.is(arg));
        }
        _checkForMissingMandatoryOptions() {
            this._getCommandAndAncestors().forEach((cmd) => {
                cmd.options.forEach((anOption) => {
                    if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
                        cmd.missingMandatoryOptionValue(anOption);
                    }
                });
            });
        }
        _checkForConflictingLocalOptions() {
            const definedNonDefaultOptions = this.options.filter((option) => {
                const optionKey = option.attributeName();
                if (this.getOptionValue(optionKey) === undefined) {
                    return false;
                }
                return this.getOptionValueSource(optionKey) !== "default";
            });
            const optionsWithConflicting = definedNonDefaultOptions.filter(
                (option) => option.conflictsWith.length > 0
            );
            optionsWithConflicting.forEach((option) => {
                const conflictingAndDefined = definedNonDefaultOptions.find((defined) =>
                    option.conflictsWith.includes(defined.attributeName())
                );
                if (conflictingAndDefined) {
                    this._conflictingOption(option, conflictingAndDefined);
                }
            });
        }
        _checkForConflictingOptions() {
            this._getCommandAndAncestors().forEach((cmd) => {
                cmd._checkForConflictingLocalOptions();
            });
        }
        parseOptions(args) {
            const operands = [];
            const unknown = [];
            let dest = operands;
            function maybeOption(arg) {
                return arg.length > 1 && arg[0] === "-";
            }
            const negativeNumberArg = (arg) => {
                if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
                return !this._getCommandAndAncestors().some((cmd) =>
                    cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short))
                );
            };
            let activeVariadicOption = null;
            let activeGroup = null;
            let i = 0;
            while (i < args.length || activeGroup) {
                const arg = activeGroup ?? args[i++];
                activeGroup = null;
                if (arg === "--") {
                    if (dest === unknown) dest.push(arg);
                    dest.push(...args.slice(i));
                    break;
                }
                if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
                    this.emit(`option:${activeVariadicOption.name()}`, arg);
                    continue;
                }
                activeVariadicOption = null;
                if (maybeOption(arg)) {
                    const option = this._findOption(arg);
                    if (option) {
                        if (option.required) {
                            const value = args[i++];
                            if (value === undefined) this.optionMissingArgument(option);
                            this.emit(`option:${option.name()}`, value);
                        } else if (option.optional) {
                            let value = null;
                            if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                                value = args[i++];
                            }
                            this.emit(`option:${option.name()}`, value);
                        } else {
                            this.emit(`option:${option.name()}`);
                        }
                        activeVariadicOption = option.variadic ? option : null;
                        continue;
                    }
                }
                if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
                    const option = this._findOption(`-${arg[1]}`);
                    if (option) {
                        if (option.required || (option.optional && this._combineFlagAndOptionalValue)) {
                            this.emit(`option:${option.name()}`, arg.slice(2));
                        } else {
                            this.emit(`option:${option.name()}`);
                            activeGroup = `-${arg.slice(2)}`;
                        }
                        continue;
                    }
                }
                if (/^--[^=]+=/.test(arg)) {
                    const index = arg.indexOf("=");
                    const option = this._findOption(arg.slice(0, index));
                    if (option && (option.required || option.optional)) {
                        this.emit(`option:${option.name()}`, arg.slice(index + 1));
                        continue;
                    }
                }
                if (
                    dest === operands &&
                    maybeOption(arg) &&
                    !(this.commands.length === 0 && negativeNumberArg(arg))
                ) {
                    dest = unknown;
                }
                if (
                    (this._enablePositionalOptions || this._passThroughOptions) &&
                    operands.length === 0 &&
                    unknown.length === 0
                ) {
                    if (this._findCommand(arg)) {
                        operands.push(arg);
                        unknown.push(...args.slice(i));
                        break;
                    } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
                        operands.push(arg, ...args.slice(i));
                        break;
                    } else if (this._defaultCommandName) {
                        unknown.push(arg, ...args.slice(i));
                        break;
                    }
                }
                if (this._passThroughOptions) {
                    dest.push(arg, ...args.slice(i));
                    break;
                }
                dest.push(arg);
            }
            return { operands, unknown };
        }
        opts() {
            if (this._storeOptionsAsProperties) {
                const result = {};
                const len = this.options.length;
                for (let i = 0; i < len; i++) {
                    const key = this.options[i].attributeName();
                    result[key] = key === this._versionOptionName ? this._version : this[key];
                }
                return result;
            }
            return this._optionValues;
        }
        optsWithGlobals() {
            return this._getCommandAndAncestors().reduce(
                (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
                {}
            );
        }
        error(message, errorOptions) {
            this._outputConfiguration.outputError(
                `${message}
`,
                this._outputConfiguration.writeErr
            );
            if (typeof this._showHelpAfterError === "string") {
                this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
            } else if (this._showHelpAfterError) {
                this._outputConfiguration.writeErr(`
`);
                this.outputHelp({ error: true });
            }
            const config = errorOptions || {};
            const exitCode = config.exitCode || 1;
            const code = config.code || "commander.error";
            this._exit(exitCode, code, message);
        }
        _parseOptionsEnv() {
            this.options.forEach((option) => {
                if (option.envVar && option.envVar in process9.env) {
                    const optionKey = option.attributeName();
                    if (
                        this.getOptionValue(optionKey) === undefined ||
                        ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))
                    ) {
                        if (option.required || option.optional) {
                            this.emit(`optionEnv:${option.name()}`, process9.env[option.envVar]);
                        } else {
                            this.emit(`optionEnv:${option.name()}`);
                        }
                    }
                }
            });
        }
        _parseOptionsImplied() {
            const dualHelper = new DualOptions(this.options);
            const hasCustomOptionValue = (optionKey) => {
                return (
                    this.getOptionValue(optionKey) !== undefined &&
                    !["default", "implied"].includes(this.getOptionValueSource(optionKey))
                );
            };
            this.options
                .filter(
                    (option) =>
                        option.implied !== undefined &&
                        hasCustomOptionValue(option.attributeName()) &&
                        dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)
                )
                .forEach((option) => {
                    Object.keys(option.implied)
                        .filter((impliedKey) => !hasCustomOptionValue(impliedKey))
                        .forEach((impliedKey) => {
                            this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
                        });
                });
        }
        missingArgument(name) {
            const message = `error: missing required argument '${name}'`;
            this.error(message, { code: "commander.missingArgument" });
        }
        optionMissingArgument(option) {
            const message = `error: option '${option.flags}' argument missing`;
            this.error(message, { code: "commander.optionMissingArgument" });
        }
        missingMandatoryOptionValue(option) {
            const message = `error: required option '${option.flags}' not specified`;
            this.error(message, { code: "commander.missingMandatoryOptionValue" });
        }
        _conflictingOption(option, conflictingOption) {
            const findBestOptionFromValue = (option2) => {
                const optionKey = option2.attributeName();
                const optionValue = this.getOptionValue(optionKey);
                const negativeOption = this.options.find(
                    (target) => target.negate && optionKey === target.attributeName()
                );
                const positiveOption = this.options.find(
                    (target) => !target.negate && optionKey === target.attributeName()
                );
                if (
                    negativeOption &&
                    ((negativeOption.presetArg === undefined && optionValue === false) ||
                        (negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg))
                ) {
                    return negativeOption;
                }
                return positiveOption || option2;
            };
            const getErrorMessage = (option2) => {
                const bestOption = findBestOptionFromValue(option2);
                const optionKey = bestOption.attributeName();
                const source = this.getOptionValueSource(optionKey);
                if (source === "env") {
                    return `environment variable '${bestOption.envVar}'`;
                }
                return `option '${bestOption.flags}'`;
            };
            const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(
                conflictingOption
            )}`;
            this.error(message, { code: "commander.conflictingOption" });
        }
        unknownOption(flag) {
            if (this._allowUnknownOption) return;
            let suggestion = "";
            if (flag.startsWith("--") && this._showSuggestionAfterError) {
                let candidateFlags = [];
                let command = this;
                do {
                    const moreFlags = command
                        .createHelp()
                        .visibleOptions(command)
                        .filter((option) => option.long)
                        .map((option) => option.long);
                    candidateFlags = candidateFlags.concat(moreFlags);
                    command = command.parent;
                } while (command && !command._enablePositionalOptions);
                suggestion = suggestSimilar(flag, candidateFlags);
            }
            const message = `error: unknown option '${flag}'${suggestion}`;
            this.error(message, { code: "commander.unknownOption" });
        }
        _excessArguments(receivedArgs) {
            if (this._allowExcessArguments) return;
            const expected = this.registeredArguments.length;
            const s = expected === 1 ? "" : "s";
            const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
            const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
            this.error(message, { code: "commander.excessArguments" });
        }
        unknownCommand() {
            const unknownName = this.args[0];
            let suggestion = "";
            if (this._showSuggestionAfterError) {
                const candidateNames = [];
                this.createHelp()
                    .visibleCommands(this)
                    .forEach((command) => {
                        candidateNames.push(command.name());
                        if (command.alias()) candidateNames.push(command.alias());
                    });
                suggestion = suggestSimilar(unknownName, candidateNames);
            }
            const message = `error: unknown command '${unknownName}'${suggestion}`;
            this.error(message, { code: "commander.unknownCommand" });
        }
        version(str, flags, description) {
            if (str === undefined) return this._version;
            this._version = str;
            flags = flags || "-V, --version";
            description = description || "output the version number";
            const versionOption = this.createOption(flags, description);
            this._versionOptionName = versionOption.attributeName();
            this._registerOption(versionOption);
            this.on("option:" + versionOption.name(), () => {
                this._outputConfiguration.writeOut(`${str}
`);
                this._exit(0, "commander.version", str);
            });
            return this;
        }
        description(str, argsDescription) {
            if (str === undefined && argsDescription === undefined) return this._description;
            this._description = str;
            if (argsDescription) {
                this._argsDescription = argsDescription;
            }
            return this;
        }
        summary(str) {
            if (str === undefined) return this._summary;
            this._summary = str;
            return this;
        }
        alias(alias) {
            if (alias === undefined) return this._aliases[0];
            let command = this;
            if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
                command = this.commands[this.commands.length - 1];
            }
            if (alias === command._name) throw new Error("Command alias can't be the same as its name");
            const matchingCommand = this.parent?._findCommand(alias);
            if (matchingCommand) {
                const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
                throw new Error(
                    `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
                );
            }
            command._aliases.push(alias);
            return this;
        }
        aliases(aliases) {
            if (aliases === undefined) return this._aliases;
            aliases.forEach((alias) => this.alias(alias));
            return this;
        }
        usage(str) {
            if (str === undefined) {
                if (this._usage) return this._usage;
                const args = this.registeredArguments.map((arg) => {
                    return humanReadableArgName(arg);
                });
                return []
                    .concat(
                        this.options.length || this._helpOption !== null ? "[options]" : [],
                        this.commands.length ? "[command]" : [],
                        this.registeredArguments.length ? args : []
                    )
                    .join(" ");
            }
            this._usage = str;
            return this;
        }
        name(str) {
            if (str === undefined) return this._name;
            this._name = str;
            return this;
        }
        helpGroup(heading) {
            if (heading === undefined) return this._helpGroupHeading ?? "";
            this._helpGroupHeading = heading;
            return this;
        }
        commandsGroup(heading) {
            if (heading === undefined) return this._defaultCommandGroup ?? "";
            this._defaultCommandGroup = heading;
            return this;
        }
        optionsGroup(heading) {
            if (heading === undefined) return this._defaultOptionGroup ?? "";
            this._defaultOptionGroup = heading;
            return this;
        }
        _initOptionGroup(option) {
            if (this._defaultOptionGroup && !option.helpGroupHeading)
                option.helpGroup(this._defaultOptionGroup);
        }
        _initCommandGroup(cmd) {
            if (this._defaultCommandGroup && !cmd.helpGroup()) cmd.helpGroup(this._defaultCommandGroup);
        }
        nameFromFilename(filename) {
            this._name = path.basename(filename, path.extname(filename));
            return this;
        }
        executableDir(path2) {
            if (path2 === undefined) return this._executableDir;
            this._executableDir = path2;
            return this;
        }
        helpInformation(contextOptions) {
            const helper = this.createHelp();
            const context = this._getOutputContext(contextOptions);
            helper.prepareContext({
                error: context.error,
                helpWidth: context.helpWidth,
                outputHasColors: context.hasColors,
            });
            const text = helper.formatHelp(this, helper);
            if (context.hasColors) return text;
            return this._outputConfiguration.stripColor(text);
        }
        _getOutputContext(contextOptions) {
            contextOptions = contextOptions || {};
            const error2 = !!contextOptions.error;
            let baseWrite;
            let hasColors2;
            let helpWidth;
            if (error2) {
                baseWrite = (str) => this._outputConfiguration.writeErr(str);
                hasColors2 = this._outputConfiguration.getErrHasColors();
                helpWidth = this._outputConfiguration.getErrHelpWidth();
            } else {
                baseWrite = (str) => this._outputConfiguration.writeOut(str);
                hasColors2 = this._outputConfiguration.getOutHasColors();
                helpWidth = this._outputConfiguration.getOutHelpWidth();
            }
            const write = (str) => {
                if (!hasColors2) str = this._outputConfiguration.stripColor(str);
                return baseWrite(str);
            };
            return { error: error2, write, hasColors: hasColors2, helpWidth };
        }
        outputHelp(contextOptions) {
            let deprecatedCallback;
            if (typeof contextOptions === "function") {
                deprecatedCallback = contextOptions;
                contextOptions = undefined;
            }
            const outputContext = this._getOutputContext(contextOptions);
            const eventContext = {
                error: outputContext.error,
                write: outputContext.write,
                command: this,
            };
            this._getCommandAndAncestors()
                .reverse()
                .forEach((command) => command.emit("beforeAllHelp", eventContext));
            this.emit("beforeHelp", eventContext);
            let helpInformation = this.helpInformation({ error: outputContext.error });
            if (deprecatedCallback) {
                helpInformation = deprecatedCallback(helpInformation);
                if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
                    throw new Error("outputHelp callback must return a string or a Buffer");
                }
            }
            outputContext.write(helpInformation);
            if (this._getHelpOption()?.long) {
                this.emit(this._getHelpOption().long);
            }
            this.emit("afterHelp", eventContext);
            this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
        }
        helpOption(flags, description) {
            if (typeof flags === "boolean") {
                if (flags) {
                    if (this._helpOption === null) this._helpOption = undefined;
                    if (this._defaultOptionGroup) {
                        this._initOptionGroup(this._getHelpOption());
                    }
                } else {
                    this._helpOption = null;
                }
                return this;
            }
            this._helpOption = this.createOption(
                flags ?? "-h, --help",
                description ?? "display help for command"
            );
            if (flags || description) this._initOptionGroup(this._helpOption);
            return this;
        }
        _getHelpOption() {
            if (this._helpOption === undefined) {
                this.helpOption(undefined, undefined);
            }
            return this._helpOption;
        }
        addHelpOption(option) {
            this._helpOption = option;
            this._initOptionGroup(option);
            return this;
        }
        help(contextOptions) {
            this.outputHelp(contextOptions);
            let exitCode = Number(process9.exitCode ?? 0);
            if (
                exitCode === 0 &&
                contextOptions &&
                typeof contextOptions !== "function" &&
                contextOptions.error
            ) {
                exitCode = 1;
            }
            this._exit(exitCode, "commander.help", "(outputHelp)");
        }
        addHelpText(position, text) {
            const allowedValues = ["beforeAll", "before", "after", "afterAll"];
            if (!allowedValues.includes(position)) {
                throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
            }
            const helpEvent = `${position}Help`;
            this.on(helpEvent, (context) => {
                let helpStr;
                if (typeof text === "function") {
                    helpStr = text({ error: context.error, command: context.command });
                } else {
                    helpStr = text;
                }
                if (helpStr) {
                    context.write(`${helpStr}
`);
                }
            });
            return this;
        }
        _outputHelpIfRequested(args) {
            const helpOption = this._getHelpOption();
            const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
            if (helpRequested) {
                this.outputHelp();
                this._exit(0, "commander.helpDisplayed", "(outputHelp)");
            }
        }
    }
    function incrementNodeInspectorPort(args) {
        return args.map((arg) => {
            if (!arg.startsWith("--inspect")) {
                return arg;
            }
            let debugOption;
            let debugHost = "127.0.0.1";
            let debugPort = "9229";
            let match;
            if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
                debugOption = match[1];
            } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
                debugOption = match[1];
                if (/^\d+$/.test(match[3])) {
                    debugPort = match[3];
                } else {
                    debugHost = match[3];
                }
            } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
                debugOption = match[1];
                debugHost = match[3];
                debugPort = match[4];
            }
            if (debugOption && debugPort !== "0") {
                return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
            }
            return arg;
        });
    }
    function useColor() {
        if (process9.env.NO_COLOR || process9.env.FORCE_COLOR === "0" || process9.env.FORCE_COLOR === "false")
            return false;
        if (process9.env.FORCE_COLOR || process9.env.CLICOLOR_FORCE !== undefined) return true;
        return;
    }
    exports.Command = Command;
    exports.useColor = useColor;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
    var { Argument } = require_argument();
    var { Command } = require_command();
    var { CommanderError, InvalidArgumentError } = require_error();
    var { Help } = require_help();
    var { Option } = require_option();
    exports.program = new Command();
    exports.createCommand = (name) => new Command(name);
    exports.createOption = (flags, description) => new Option(flags, description);
    exports.createArgument = (name, description) => new Argument(name, description);
    exports.Command = Command;
    exports.Option = Option;
    exports.Argument = Argument;
    exports.Help = Help;
    exports.CommanderError = CommanderError;
    exports.InvalidArgumentError = InvalidArgumentError;
    exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// dev/createGithubRelease.ts
var { $ } = globalThis.Bun;
import { rename, rm } from "fs/promises";

// node_modules/ora/index.js
import process8 from "process";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 =
    (offset = 0) =>
    (code) =>
        `\x1B[${code + offset}m`;
var wrapAnsi256 =
    (offset = 0) =>
    (code) =>
        `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m =
    (offset = 0) =>
    (red, green, blue) =>
        `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
    modifier: {
        reset: [0, 0],
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        overline: [53, 55],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29],
    },
    color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        blackBright: [90, 39],
        gray: [90, 39],
        grey: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39],
    },
    bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgBlackBright: [100, 49],
        bgGray: [100, 49],
        bgGrey: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49],
    },
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
    const codes = new Map();
    for (const [groupName, group] of Object.entries(styles)) {
        for (const [styleName, style] of Object.entries(group)) {
            styles[styleName] = {
                open: `\x1B[${style[0]}m`,
                close: `\x1B[${style[1]}m`,
            };
            group[styleName] = styles[styleName];
            codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
            value: group,
            enumerable: false,
        });
    }
    Object.defineProperty(styles, "codes", {
        value: codes,
        enumerable: false,
    });
    styles.color.close = "\x1B[39m";
    styles.bgColor.close = "\x1B[49m";
    styles.color.ansi = wrapAnsi16();
    styles.color.ansi256 = wrapAnsi256();
    styles.color.ansi16m = wrapAnsi16m();
    styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
    styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
    styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
    Object.defineProperties(styles, {
        rgbToAnsi256: {
            value(red, green, blue) {
                if (red === green && green === blue) {
                    if (red < 8) {
                        return 16;
                    }
                    if (red > 248) {
                        return 231;
                    }
                    return Math.round(((red - 8) / 247) * 24) + 232;
                }
                return (
                    16 +
                    36 * Math.round((red / 255) * 5) +
                    6 * Math.round((green / 255) * 5) +
                    Math.round((blue / 255) * 5)
                );
            },
            enumerable: false,
        },
        hexToRgb: {
            value(hex) {
                const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
                if (!matches) {
                    return [0, 0, 0];
                }
                let [colorString] = matches;
                if (colorString.length === 3) {
                    colorString = [...colorString].map((character) => character + character).join("");
                }
                const integer = Number.parseInt(colorString, 16);
                return [(integer >> 16) & 255, (integer >> 8) & 255, integer & 255];
            },
            enumerable: false,
        },
        hexToAnsi256: {
            value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
            enumerable: false,
        },
        ansi256ToAnsi: {
            value(code) {
                if (code < 8) {
                    return 30 + code;
                }
                if (code < 16) {
                    return 90 + (code - 8);
                }
                let red;
                let green;
                let blue;
                if (code >= 232) {
                    red = ((code - 232) * 10 + 8) / 255;
                    green = red;
                    blue = red;
                } else {
                    code -= 16;
                    const remainder = code % 36;
                    red = Math.floor(code / 36) / 5;
                    green = Math.floor(remainder / 6) / 5;
                    blue = (remainder % 6) / 5;
                }
                const value = Math.max(red, green, blue) * 2;
                if (value === 0) {
                    return 30;
                }
                let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));
                if (value === 2) {
                    result += 60;
                }
                return result;
            },
            enumerable: false,
        },
        rgbToAnsi: {
            value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
            enumerable: false,
        },
        hexToAnsi: {
            value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
            enumerable: false,
        },
    });
    return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "process";
import os from "os";
import tty from "tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
    flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
    flagForceColor = 1;
}
function envForceColor() {
    if ("FORCE_COLOR" in env) {
        if (env.FORCE_COLOR === "true") {
            return 1;
        }
        if (env.FORCE_COLOR === "false") {
            return 0;
        }
        return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
    }
}
function translateLevel(level) {
    if (level === 0) {
        return false;
    }
    return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3,
    };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
    const noFlagForceColor = envForceColor();
    if (noFlagForceColor !== undefined) {
        flagForceColor = noFlagForceColor;
    }
    const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
    if (forceColor === 0) {
        return 0;
    }
    if (sniffFlags) {
        if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
            return 3;
        }
        if (hasFlag("color=256")) {
            return 2;
        }
    }
    if ("TF_BUILD" in env && "AGENT_NAME" in env) {
        return 1;
    }
    if (haveStream && !streamIsTTY && forceColor === undefined) {
        return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
        return min;
    }
    if (process2.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
            return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
    }
    if ("CI" in env) {
        if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => key in env)) {
            return 3;
        }
        if (
            ["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) ||
            env.CI_NAME === "codeship"
        ) {
            return 1;
        }
        return min;
    }
    if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
        return 3;
    }
    if (env.TERM === "xterm-kitty") {
        return 3;
    }
    if (env.TERM === "xterm-ghostty") {
        return 3;
    }
    if (env.TERM === "wezterm") {
        return 3;
    }
    if ("TERM_PROGRAM" in env) {
        const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
            case "iTerm.app": {
                return version >= 3 ? 3 : 2;
            }
            case "Apple_Terminal": {
                return 2;
            }
        }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
    }
    if ("COLORTERM" in env) {
        return 1;
    }
    return min;
}
function createSupportsColor(stream, options = {}) {
    const level = _supportsColor(stream, {
        streamIsTTY: stream && stream.isTTY,
        ...options,
    });
    return translateLevel(level);
}
var supportsColor = {
    stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
    stderr: createSupportsColor({ isTTY: tty.isatty(2) }),
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
    let index = string.indexOf(substring);
    if (index === -1) {
        return string;
    }
    const substringLength = substring.length;
    let endIndex = 0;
    let returnValue = "";
    do {
        returnValue += string.slice(endIndex, index) + substring + replacer;
        endIndex = index + substringLength;
        index = string.indexOf(substring, endIndex);
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
    let endIndex = 0;
    let returnValue = "";
    do {
        const gotCR = string[index - 1] === "\r";
        returnValue +=
            string.slice(endIndex, gotCR ? index - 1 : index) +
            prefix +
            (gotCR
                ? `\r
`
                : `
`) +
            postfix;
        endIndex = index + 1;
        index = string.indexOf(
            `
`,
            endIndex
        );
    } while (index !== -1);
    returnValue += string.slice(endIndex);
    return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = ["ansi", "ansi", "ansi256", "ansi16m"];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
    if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
        throw new Error("The `level` option should be an integer from 0 to 3");
    }
    const colorLevel = stdoutColor ? stdoutColor.level : 0;
    object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
    const chalk = (...strings) => strings.join(" ");
    applyOptions(chalk, options);
    Object.setPrototypeOf(chalk, createChalk.prototype);
    return chalk;
};
function createChalk(options) {
    return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
    styles2[styleName] = {
        get() {
            const builder = createBuilder(
                this,
                createStyler(style.open, style.close, this[STYLER]),
                this[IS_EMPTY]
            );
            Object.defineProperty(this, styleName, { value: builder });
            return builder;
        },
    };
}
styles2.visible = {
    get() {
        const builder = createBuilder(this, this[STYLER], true);
        Object.defineProperty(this, "visible", { value: builder });
        return builder;
    },
};
var getModelAnsi = (model, level, type, ...arguments_) => {
    if (model === "rgb") {
        if (level === "ansi16m") {
            return ansi_styles_default[type].ansi16m(...arguments_);
        }
        if (level === "ansi256") {
            return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
        }
        return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
    }
    if (model === "hex") {
        return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
    }
    return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
    styles2[model] = {
        get() {
            const { level } = this;
            return function (...arguments_) {
                const styler = createStyler(
                    getModelAnsi(model, levelMapping[level], "color", ...arguments_),
                    ansi_styles_default.color.close,
                    this[STYLER]
                );
                return createBuilder(this, styler, this[IS_EMPTY]);
            };
        },
    };
    const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
    styles2[bgModel] = {
        get() {
            const { level } = this;
            return function (...arguments_) {
                const styler = createStyler(
                    getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_),
                    ansi_styles_default.bgColor.close,
                    this[STYLER]
                );
                return createBuilder(this, styler, this[IS_EMPTY]);
            };
        },
    };
}
var proto = Object.defineProperties(() => {}, {
    ...styles2,
    level: {
        enumerable: true,
        get() {
            return this[GENERATOR].level;
        },
        set(level) {
            this[GENERATOR].level = level;
        },
    },
});
var createStyler = (open, close, parent) => {
    let openAll;
    let closeAll;
    if (parent === undefined) {
        openAll = open;
        closeAll = close;
    } else {
        openAll = parent.openAll + open;
        closeAll = close + parent.closeAll;
    }
    return {
        open,
        close,
        openAll,
        closeAll,
        parent,
    };
};
var createBuilder = (self, _styler, _isEmpty) => {
    const builder = (...arguments_) =>
        applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
    Object.setPrototypeOf(builder, proto);
    builder[GENERATOR] = self;
    builder[STYLER] = _styler;
    builder[IS_EMPTY] = _isEmpty;
    return builder;
};
var applyStyle = (self, string) => {
    if (self.level <= 0 || !string) {
        return self[IS_EMPTY] ? "" : string;
    }
    let styler = self[STYLER];
    if (styler === undefined) {
        return string;
    }
    const { openAll, closeAll } = styler;
    if (string.includes("\x1B")) {
        while (styler !== undefined) {
            string = stringReplaceAll(string, styler.close, styler.open);
            styler = styler.parent;
        }
    }
    const lfIndex = string.indexOf(`
`);
    if (lfIndex !== -1) {
        string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
    }
    return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// node_modules/cli-cursor/index.js
import process5 from "process";

// node_modules/restore-cursor/index.js
import process4 from "process";

// node_modules/mimic-function/index.js
var copyProperty = (to, from, property, ignoreNonConfigurable) => {
    if (property === "length" || property === "prototype") {
        return;
    }
    if (property === "arguments" || property === "caller") {
        return;
    }
    const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
    const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
    if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
        return;
    }
    Object.defineProperty(to, property, fromDescriptor);
};
var canCopyProperty = function (toDescriptor, fromDescriptor) {
    return (
        toDescriptor === undefined ||
        toDescriptor.configurable ||
        (toDescriptor.writable === fromDescriptor.writable &&
            toDescriptor.enumerable === fromDescriptor.enumerable &&
            toDescriptor.configurable === fromDescriptor.configurable &&
            (toDescriptor.writable || toDescriptor.value === fromDescriptor.value))
    );
};
var changePrototype = (to, from) => {
    const fromPrototype = Object.getPrototypeOf(from);
    if (fromPrototype === Object.getPrototypeOf(to)) {
        return;
    }
    Object.setPrototypeOf(to, fromPrototype);
};
var wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/
${fromBody}`;
var toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
var toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
var changeToString = (to, from, name) => {
    const withName = name === "" ? "" : `with ${name.trim()}() `;
    const newToString = wrappedToString.bind(null, withName, from.toString());
    Object.defineProperty(newToString, "name", toStringName);
    const { writable, enumerable, configurable } = toStringDescriptor;
    Object.defineProperty(to, "toString", { value: newToString, writable, enumerable, configurable });
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
    const { name } = to;
    for (const property of Reflect.ownKeys(from)) {
        copyProperty(to, from, property, ignoreNonConfigurable);
    }
    changePrototype(to, from);
    changeToString(to, from, name);
    return to;
}

// node_modules/onetime/index.js
var calledFunctions = new WeakMap();
var onetime = (function_, options = {}) => {
    if (typeof function_ !== "function") {
        throw new TypeError("Expected a function");
    }
    let returnValue;
    let callCount = 0;
    const functionName = function_.displayName || function_.name || "<anonymous>";
    const onetime2 = function (...arguments_) {
        calledFunctions.set(onetime2, ++callCount);
        if (callCount === 1) {
            returnValue = function_.apply(this, arguments_);
            function_ = undefined;
        } else if (options.throw === true) {
            throw new Error(`Function \`${functionName}\` can only be called once`);
        }
        return returnValue;
    };
    mimicFunction(onetime2, function_);
    calledFunctions.set(onetime2, callCount);
    return onetime2;
};
onetime.callCount = (function_) => {
    if (!calledFunctions.has(function_)) {
        throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
    }
    return calledFunctions.get(function_);
};
var onetime_default = onetime;

// node_modules/signal-exit/dist/mjs/signals.js
var signals = [];
signals.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") {
    signals.push(
        "SIGALRM",
        "SIGABRT",
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
    );
}
if (process.platform === "linux") {
    signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
}

// node_modules/signal-exit/dist/mjs/index.js
var processOk = (process3) =>
    !!process3 &&
    typeof process3 === "object" &&
    typeof process3.removeListener === "function" &&
    typeof process3.emit === "function" &&
    typeof process3.reallyExit === "function" &&
    typeof process3.listeners === "function" &&
    typeof process3.kill === "function" &&
    typeof process3.pid === "number" &&
    typeof process3.on === "function";
var kExitEmitter = Symbol.for("signal-exit emitter");
var global = globalThis;
var ObjectDefineProperty = Object.defineProperty.bind(Object);

class Emitter {
    emitted = {
        afterExit: false,
        exit: false,
    };
    listeners = {
        afterExit: [],
        exit: [],
    };
    count = 0;
    id = Math.random();
    constructor() {
        if (global[kExitEmitter]) {
            return global[kExitEmitter];
        }
        ObjectDefineProperty(global, kExitEmitter, {
            value: this,
            writable: false,
            enumerable: false,
            configurable: false,
        });
    }
    on(ev, fn) {
        this.listeners[ev].push(fn);
    }
    removeListener(ev, fn) {
        const list = this.listeners[ev];
        const i = list.indexOf(fn);
        if (i === -1) {
            return;
        }
        if (i === 0 && list.length === 1) {
            list.length = 0;
        } else {
            list.splice(i, 1);
        }
    }
    emit(ev, code, signal) {
        if (this.emitted[ev]) {
            return false;
        }
        this.emitted[ev] = true;
        let ret = false;
        for (const fn of this.listeners[ev]) {
            ret = fn(code, signal) === true || ret;
        }
        if (ev === "exit") {
            ret = this.emit("afterExit", code, signal) || ret;
        }
        return ret;
    }
}

class SignalExitBase {}
var signalExitWrap = (handler) => {
    return {
        onExit(cb, opts) {
            return handler.onExit(cb, opts);
        },
        load() {
            return handler.load();
        },
        unload() {
            return handler.unload();
        },
    };
};

class SignalExitFallback extends SignalExitBase {
    onExit() {
        return () => {};
    }
    load() {}
    unload() {}
}

class SignalExit extends SignalExitBase {
    #hupSig = process3.platform === "win32" ? "SIGINT" : "SIGHUP";
    #emitter = new Emitter();
    #process;
    #originalProcessEmit;
    #originalProcessReallyExit;
    #sigListeners = {};
    #loaded = false;
    constructor(process3) {
        super();
        this.#process = process3;
        this.#sigListeners = {};
        for (const sig of signals) {
            this.#sigListeners[sig] = () => {
                const listeners = this.#process.listeners(sig);
                let { count } = this.#emitter;
                const p = process3;
                if (
                    typeof p.__signal_exit_emitter__ === "object" &&
                    typeof p.__signal_exit_emitter__.count === "number"
                ) {
                    count += p.__signal_exit_emitter__.count;
                }
                if (listeners.length === count) {
                    this.unload();
                    const ret = this.#emitter.emit("exit", null, sig);
                    const s = sig === "SIGHUP" ? this.#hupSig : sig;
                    if (!ret) process3.kill(process3.pid, s);
                }
            };
        }
        this.#originalProcessReallyExit = process3.reallyExit;
        this.#originalProcessEmit = process3.emit;
    }
    onExit(cb, opts) {
        if (!processOk(this.#process)) {
            return () => {};
        }
        if (this.#loaded === false) {
            this.load();
        }
        const ev = opts?.alwaysLast ? "afterExit" : "exit";
        this.#emitter.on(ev, cb);
        return () => {
            this.#emitter.removeListener(ev, cb);
            if (
                this.#emitter.listeners["exit"].length === 0 &&
                this.#emitter.listeners["afterExit"].length === 0
            ) {
                this.unload();
            }
        };
    }
    load() {
        if (this.#loaded) {
            return;
        }
        this.#loaded = true;
        this.#emitter.count += 1;
        for (const sig of signals) {
            try {
                const fn = this.#sigListeners[sig];
                if (fn) this.#process.on(sig, fn);
            } catch (_) {}
        }
        this.#process.emit = (ev, ...a) => {
            return this.#processEmit(ev, ...a);
        };
        this.#process.reallyExit = (code) => {
            return this.#processReallyExit(code);
        };
    }
    unload() {
        if (!this.#loaded) {
            return;
        }
        this.#loaded = false;
        signals.forEach((sig) => {
            const listener = this.#sigListeners[sig];
            if (!listener) {
                throw new Error("Listener not defined for signal: " + sig);
            }
            try {
                this.#process.removeListener(sig, listener);
            } catch (_) {}
        });
        this.#process.emit = this.#originalProcessEmit;
        this.#process.reallyExit = this.#originalProcessReallyExit;
        this.#emitter.count -= 1;
    }
    #processReallyExit(code) {
        if (!processOk(this.#process)) {
            return 0;
        }
        this.#process.exitCode = code || 0;
        this.#emitter.emit("exit", this.#process.exitCode, null);
        return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
    }
    #processEmit(ev, ...args) {
        const og = this.#originalProcessEmit;
        if (ev === "exit" && processOk(this.#process)) {
            if (typeof args[0] === "number") {
                this.#process.exitCode = args[0];
            }
            const ret = og.call(this.#process, ev, ...args);
            this.#emitter.emit("exit", this.#process.exitCode, null);
            return ret;
        } else {
            return og.call(this.#process, ev, ...args);
        }
    }
}
var process3 = globalThis.process;
var { onExit, load, unload } = signalExitWrap(
    processOk(process3) ? new SignalExit(process3) : new SignalExitFallback()
);

// node_modules/restore-cursor/index.js
var terminal = process4.stderr.isTTY ? process4.stderr : process4.stdout.isTTY ? process4.stdout : undefined;
var restoreCursor = terminal
    ? onetime_default(() => {
          onExit(
              () => {
                  terminal.write("\x1B[?25h");
              },
              { alwaysLast: true }
          );
      })
    : () => {};
var restore_cursor_default = restoreCursor;

// node_modules/cli-cursor/index.js
var isHidden = false;
var cliCursor = {};
cliCursor.show = (writableStream = process5.stderr) => {
    if (!writableStream.isTTY) {
        return;
    }
    isHidden = false;
    writableStream.write("\x1B[?25h");
};
cliCursor.hide = (writableStream = process5.stderr) => {
    if (!writableStream.isTTY) {
        return;
    }
    restore_cursor_default();
    isHidden = true;
    writableStream.write("\x1B[?25l");
};
cliCursor.toggle = (force, writableStream) => {
    if (force !== undefined) {
        isHidden = force;
    }
    if (isHidden) {
        cliCursor.show(writableStream);
    } else {
        cliCursor.hide(writableStream);
    }
};
var cli_cursor_default = cliCursor;
// node_modules/ora/node_modules/cli-spinners/spinners.json
var spinners_default = {
    dots: {
        interval: 80,
        frames: [
            "\u280B",
            "\u2819",
            "\u2839",
            "\u2838",
            "\u283C",
            "\u2834",
            "\u2826",
            "\u2827",
            "\u2807",
            "\u280F",
        ],
    },
    dots2: {
        interval: 80,
        frames: ["\u28FE", "\u28FD", "\u28FB", "\u28BF", "\u287F", "\u28DF", "\u28EF", "\u28F7"],
    },
    dots3: {
        interval: 80,
        frames: [
            "\u280B",
            "\u2819",
            "\u281A",
            "\u281E",
            "\u2816",
            "\u2826",
            "\u2834",
            "\u2832",
            "\u2833",
            "\u2813",
        ],
    },
    dots4: {
        interval: 80,
        frames: [
            "\u2804",
            "\u2806",
            "\u2807",
            "\u280B",
            "\u2819",
            "\u2838",
            "\u2830",
            "\u2820",
            "\u2830",
            "\u2838",
            "\u2819",
            "\u280B",
            "\u2807",
            "\u2806",
        ],
    },
    dots5: {
        interval: 80,
        frames: [
            "\u280B",
            "\u2819",
            "\u281A",
            "\u2812",
            "\u2802",
            "\u2802",
            "\u2812",
            "\u2832",
            "\u2834",
            "\u2826",
            "\u2816",
            "\u2812",
            "\u2810",
            "\u2810",
            "\u2812",
            "\u2813",
            "\u280B",
        ],
    },
    dots6: {
        interval: 80,
        frames: [
            "\u2801",
            "\u2809",
            "\u2819",
            "\u281A",
            "\u2812",
            "\u2802",
            "\u2802",
            "\u2812",
            "\u2832",
            "\u2834",
            "\u2824",
            "\u2804",
            "\u2804",
            "\u2824",
            "\u2834",
            "\u2832",
            "\u2812",
            "\u2802",
            "\u2802",
            "\u2812",
            "\u281A",
            "\u2819",
            "\u2809",
            "\u2801",
        ],
    },
    dots7: {
        interval: 80,
        frames: [
            "\u2808",
            "\u2809",
            "\u280B",
            "\u2813",
            "\u2812",
            "\u2810",
            "\u2810",
            "\u2812",
            "\u2816",
            "\u2826",
            "\u2824",
            "\u2820",
            "\u2820",
            "\u2824",
            "\u2826",
            "\u2816",
            "\u2812",
            "\u2810",
            "\u2810",
            "\u2812",
            "\u2813",
            "\u280B",
            "\u2809",
            "\u2808",
        ],
    },
    dots8: {
        interval: 80,
        frames: [
            "\u2801",
            "\u2801",
            "\u2809",
            "\u2819",
            "\u281A",
            "\u2812",
            "\u2802",
            "\u2802",
            "\u2812",
            "\u2832",
            "\u2834",
            "\u2824",
            "\u2804",
            "\u2804",
            "\u2824",
            "\u2820",
            "\u2820",
            "\u2824",
            "\u2826",
            "\u2816",
            "\u2812",
            "\u2810",
            "\u2810",
            "\u2812",
            "\u2813",
            "\u280B",
            "\u2809",
            "\u2808",
            "\u2808",
        ],
    },
    dots9: {
        interval: 80,
        frames: ["\u28B9", "\u28BA", "\u28BC", "\u28F8", "\u28C7", "\u2867", "\u2857", "\u284F"],
    },
    dots10: {
        interval: 80,
        frames: ["\u2884", "\u2882", "\u2881", "\u2841", "\u2848", "\u2850", "\u2860"],
    },
    dots11: {
        interval: 100,
        frames: ["\u2801", "\u2802", "\u2804", "\u2840", "\u2880", "\u2820", "\u2810", "\u2808"],
    },
    dots12: {
        interval: 80,
        frames: [
            "\u2880\u2800",
            "\u2840\u2800",
            "\u2804\u2800",
            "\u2882\u2800",
            "\u2842\u2800",
            "\u2805\u2800",
            "\u2883\u2800",
            "\u2843\u2800",
            "\u280D\u2800",
            "\u288B\u2800",
            "\u284B\u2800",
            "\u280D\u2801",
            "\u288B\u2801",
            "\u284B\u2801",
            "\u280D\u2809",
            "\u280B\u2809",
            "\u280B\u2809",
            "\u2809\u2819",
            "\u2809\u2819",
            "\u2809\u2829",
            "\u2808\u2899",
            "\u2808\u2859",
            "\u2888\u2829",
            "\u2840\u2899",
            "\u2804\u2859",
            "\u2882\u2829",
            "\u2842\u2898",
            "\u2805\u2858",
            "\u2883\u2828",
            "\u2843\u2890",
            "\u280D\u2850",
            "\u288B\u2820",
            "\u284B\u2880",
            "\u280D\u2841",
            "\u288B\u2801",
            "\u284B\u2801",
            "\u280D\u2809",
            "\u280B\u2809",
            "\u280B\u2809",
            "\u2809\u2819",
            "\u2809\u2819",
            "\u2809\u2829",
            "\u2808\u2899",
            "\u2808\u2859",
            "\u2808\u2829",
            "\u2800\u2899",
            "\u2800\u2859",
            "\u2800\u2829",
            "\u2800\u2898",
            "\u2800\u2858",
            "\u2800\u2828",
            "\u2800\u2890",
            "\u2800\u2850",
            "\u2800\u2820",
            "\u2800\u2880",
            "\u2800\u2840",
        ],
    },
    dots13: {
        interval: 80,
        frames: ["\u28FC", "\u28F9", "\u28BB", "\u283F", "\u285F", "\u28CF", "\u28E7", "\u28F6"],
    },
    dots14: {
        interval: 80,
        frames: [
            "\u2809\u2809",
            "\u2808\u2819",
            "\u2800\u2839",
            "\u2800\u28B8",
            "\u2800\u28F0",
            "\u2880\u28E0",
            "\u28C0\u28C0",
            "\u28C4\u2840",
            "\u28C6\u2800",
            "\u2847\u2800",
            "\u280F\u2800",
            "\u280B\u2801",
        ],
    },
    dots8Bit: {
        interval: 80,
        frames: [
            "\u2800",
            "\u2801",
            "\u2802",
            "\u2803",
            "\u2804",
            "\u2805",
            "\u2806",
            "\u2807",
            "\u2840",
            "\u2841",
            "\u2842",
            "\u2843",
            "\u2844",
            "\u2845",
            "\u2846",
            "\u2847",
            "\u2808",
            "\u2809",
            "\u280A",
            "\u280B",
            "\u280C",
            "\u280D",
            "\u280E",
            "\u280F",
            "\u2848",
            "\u2849",
            "\u284A",
            "\u284B",
            "\u284C",
            "\u284D",
            "\u284E",
            "\u284F",
            "\u2810",
            "\u2811",
            "\u2812",
            "\u2813",
            "\u2814",
            "\u2815",
            "\u2816",
            "\u2817",
            "\u2850",
            "\u2851",
            "\u2852",
            "\u2853",
            "\u2854",
            "\u2855",
            "\u2856",
            "\u2857",
            "\u2818",
            "\u2819",
            "\u281A",
            "\u281B",
            "\u281C",
            "\u281D",
            "\u281E",
            "\u281F",
            "\u2858",
            "\u2859",
            "\u285A",
            "\u285B",
            "\u285C",
            "\u285D",
            "\u285E",
            "\u285F",
            "\u2820",
            "\u2821",
            "\u2822",
            "\u2823",
            "\u2824",
            "\u2825",
            "\u2826",
            "\u2827",
            "\u2860",
            "\u2861",
            "\u2862",
            "\u2863",
            "\u2864",
            "\u2865",
            "\u2866",
            "\u2867",
            "\u2828",
            "\u2829",
            "\u282A",
            "\u282B",
            "\u282C",
            "\u282D",
            "\u282E",
            "\u282F",
            "\u2868",
            "\u2869",
            "\u286A",
            "\u286B",
            "\u286C",
            "\u286D",
            "\u286E",
            "\u286F",
            "\u2830",
            "\u2831",
            "\u2832",
            "\u2833",
            "\u2834",
            "\u2835",
            "\u2836",
            "\u2837",
            "\u2870",
            "\u2871",
            "\u2872",
            "\u2873",
            "\u2874",
            "\u2875",
            "\u2876",
            "\u2877",
            "\u2838",
            "\u2839",
            "\u283A",
            "\u283B",
            "\u283C",
            "\u283D",
            "\u283E",
            "\u283F",
            "\u2878",
            "\u2879",
            "\u287A",
            "\u287B",
            "\u287C",
            "\u287D",
            "\u287E",
            "\u287F",
            "\u2880",
            "\u2881",
            "\u2882",
            "\u2883",
            "\u2884",
            "\u2885",
            "\u2886",
            "\u2887",
            "\u28C0",
            "\u28C1",
            "\u28C2",
            "\u28C3",
            "\u28C4",
            "\u28C5",
            "\u28C6",
            "\u28C7",
            "\u2888",
            "\u2889",
            "\u288A",
            "\u288B",
            "\u288C",
            "\u288D",
            "\u288E",
            "\u288F",
            "\u28C8",
            "\u28C9",
            "\u28CA",
            "\u28CB",
            "\u28CC",
            "\u28CD",
            "\u28CE",
            "\u28CF",
            "\u2890",
            "\u2891",
            "\u2892",
            "\u2893",
            "\u2894",
            "\u2895",
            "\u2896",
            "\u2897",
            "\u28D0",
            "\u28D1",
            "\u28D2",
            "\u28D3",
            "\u28D4",
            "\u28D5",
            "\u28D6",
            "\u28D7",
            "\u2898",
            "\u2899",
            "\u289A",
            "\u289B",
            "\u289C",
            "\u289D",
            "\u289E",
            "\u289F",
            "\u28D8",
            "\u28D9",
            "\u28DA",
            "\u28DB",
            "\u28DC",
            "\u28DD",
            "\u28DE",
            "\u28DF",
            "\u28A0",
            "\u28A1",
            "\u28A2",
            "\u28A3",
            "\u28A4",
            "\u28A5",
            "\u28A6",
            "\u28A7",
            "\u28E0",
            "\u28E1",
            "\u28E2",
            "\u28E3",
            "\u28E4",
            "\u28E5",
            "\u28E6",
            "\u28E7",
            "\u28A8",
            "\u28A9",
            "\u28AA",
            "\u28AB",
            "\u28AC",
            "\u28AD",
            "\u28AE",
            "\u28AF",
            "\u28E8",
            "\u28E9",
            "\u28EA",
            "\u28EB",
            "\u28EC",
            "\u28ED",
            "\u28EE",
            "\u28EF",
            "\u28B0",
            "\u28B1",
            "\u28B2",
            "\u28B3",
            "\u28B4",
            "\u28B5",
            "\u28B6",
            "\u28B7",
            "\u28F0",
            "\u28F1",
            "\u28F2",
            "\u28F3",
            "\u28F4",
            "\u28F5",
            "\u28F6",
            "\u28F7",
            "\u28B8",
            "\u28B9",
            "\u28BA",
            "\u28BB",
            "\u28BC",
            "\u28BD",
            "\u28BE",
            "\u28BF",
            "\u28F8",
            "\u28F9",
            "\u28FA",
            "\u28FB",
            "\u28FC",
            "\u28FD",
            "\u28FE",
            "\u28FF",
        ],
    },
    dotsCircle: {
        interval: 80,
        frames: [
            "\u288E ",
            "\u280E\u2801",
            "\u280A\u2811",
            "\u2808\u2831",
            " \u2871",
            "\u2880\u2870",
            "\u2884\u2860",
            "\u2886\u2840",
        ],
    },
    sand: {
        interval: 80,
        frames: [
            "\u2801",
            "\u2802",
            "\u2804",
            "\u2840",
            "\u2848",
            "\u2850",
            "\u2860",
            "\u28C0",
            "\u28C1",
            "\u28C2",
            "\u28C4",
            "\u28CC",
            "\u28D4",
            "\u28E4",
            "\u28E5",
            "\u28E6",
            "\u28EE",
            "\u28F6",
            "\u28F7",
            "\u28FF",
            "\u287F",
            "\u283F",
            "\u289F",
            "\u281F",
            "\u285B",
            "\u281B",
            "\u282B",
            "\u288B",
            "\u280B",
            "\u280D",
            "\u2849",
            "\u2809",
            "\u2811",
            "\u2821",
            "\u2881",
        ],
    },
    line: {
        interval: 130,
        frames: ["-", "\\", "|", "/"],
    },
    line2: {
        interval: 100,
        frames: ["\u2802", "-", "\u2013", "\u2014", "\u2013", "-"],
    },
    rollingLine: {
        interval: 80,
        frames: ["/  ", " - ", " \\ ", "  |", "  |", " \\ ", " - ", "/  "],
    },
    pipe: {
        interval: 100,
        frames: ["\u2524", "\u2518", "\u2534", "\u2514", "\u251C", "\u250C", "\u252C", "\u2510"],
    },
    simpleDots: {
        interval: 400,
        frames: [".  ", ".. ", "...", "   "],
    },
    simpleDotsScrolling: {
        interval: 200,
        frames: [".  ", ".. ", "...", " ..", "  .", "   "],
    },
    star: {
        interval: 70,
        frames: ["\u2736", "\u2738", "\u2739", "\u273A", "\u2739", "\u2737"],
    },
    star2: {
        interval: 80,
        frames: ["+", "x", "*"],
    },
    flip: {
        interval: 70,
        frames: ["_", "_", "_", "-", "`", "`", "'", "\xB4", "-", "_", "_", "_"],
    },
    hamburger: {
        interval: 100,
        frames: ["\u2631", "\u2632", "\u2634"],
    },
    growVertical: {
        interval: 120,
        frames: [
            "\u2581",
            "\u2583",
            "\u2584",
            "\u2585",
            "\u2586",
            "\u2587",
            "\u2586",
            "\u2585",
            "\u2584",
            "\u2583",
        ],
    },
    growHorizontal: {
        interval: 120,
        frames: [
            "\u258F",
            "\u258E",
            "\u258D",
            "\u258C",
            "\u258B",
            "\u258A",
            "\u2589",
            "\u258A",
            "\u258B",
            "\u258C",
            "\u258D",
            "\u258E",
        ],
    },
    balloon: {
        interval: 140,
        frames: [" ", ".", "o", "O", "@", "*", " "],
    },
    balloon2: {
        interval: 120,
        frames: [".", "o", "O", "\xB0", "O", "o", "."],
    },
    noise: {
        interval: 100,
        frames: ["\u2593", "\u2592", "\u2591"],
    },
    bounce: {
        interval: 120,
        frames: ["\u2801", "\u2802", "\u2804", "\u2802"],
    },
    boxBounce: {
        interval: 120,
        frames: ["\u2596", "\u2598", "\u259D", "\u2597"],
    },
    boxBounce2: {
        interval: 100,
        frames: ["\u258C", "\u2580", "\u2590", "\u2584"],
    },
    triangle: {
        interval: 50,
        frames: ["\u25E2", "\u25E3", "\u25E4", "\u25E5"],
    },
    binary: {
        interval: 80,
        frames: [
            "010010",
            "001100",
            "100101",
            "111010",
            "111101",
            "010111",
            "101011",
            "111000",
            "110011",
            "110101",
        ],
    },
    arc: {
        interval: 100,
        frames: ["\u25DC", "\u25E0", "\u25DD", "\u25DE", "\u25E1", "\u25DF"],
    },
    circle: {
        interval: 120,
        frames: ["\u25E1", "\u2299", "\u25E0"],
    },
    squareCorners: {
        interval: 180,
        frames: ["\u25F0", "\u25F3", "\u25F2", "\u25F1"],
    },
    circleQuarters: {
        interval: 120,
        frames: ["\u25F4", "\u25F7", "\u25F6", "\u25F5"],
    },
    circleHalves: {
        interval: 50,
        frames: ["\u25D0", "\u25D3", "\u25D1", "\u25D2"],
    },
    squish: {
        interval: 100,
        frames: ["\u256B", "\u256A"],
    },
    toggle: {
        interval: 250,
        frames: ["\u22B6", "\u22B7"],
    },
    toggle2: {
        interval: 80,
        frames: ["\u25AB", "\u25AA"],
    },
    toggle3: {
        interval: 120,
        frames: ["\u25A1", "\u25A0"],
    },
    toggle4: {
        interval: 100,
        frames: ["\u25A0", "\u25A1", "\u25AA", "\u25AB"],
    },
    toggle5: {
        interval: 100,
        frames: ["\u25AE", "\u25AF"],
    },
    toggle6: {
        interval: 300,
        frames: ["\u101D", "\u1040"],
    },
    toggle7: {
        interval: 80,
        frames: ["\u29BE", "\u29BF"],
    },
    toggle8: {
        interval: 100,
        frames: ["\u25CD", "\u25CC"],
    },
    toggle9: {
        interval: 100,
        frames: ["\u25C9", "\u25CE"],
    },
    toggle10: {
        interval: 100,
        frames: ["\u3282", "\u3280", "\u3281"],
    },
    toggle11: {
        interval: 50,
        frames: ["\u29C7", "\u29C6"],
    },
    toggle12: {
        interval: 120,
        frames: ["\u2617", "\u2616"],
    },
    toggle13: {
        interval: 80,
        frames: ["=", "*", "-"],
    },
    arrow: {
        interval: 100,
        frames: ["\u2190", "\u2196", "\u2191", "\u2197", "\u2192", "\u2198", "\u2193", "\u2199"],
    },
    arrow2: {
        interval: 80,
        frames: [
            "\u2B06\uFE0F ",
            "\u2197\uFE0F ",
            "\u27A1\uFE0F ",
            "\u2198\uFE0F ",
            "\u2B07\uFE0F ",
            "\u2199\uFE0F ",
            "\u2B05\uFE0F ",
            "\u2196\uFE0F ",
        ],
    },
    arrow3: {
        interval: 120,
        frames: [
            "\u25B9\u25B9\u25B9\u25B9\u25B9",
            "\u25B8\u25B9\u25B9\u25B9\u25B9",
            "\u25B9\u25B8\u25B9\u25B9\u25B9",
            "\u25B9\u25B9\u25B8\u25B9\u25B9",
            "\u25B9\u25B9\u25B9\u25B8\u25B9",
            "\u25B9\u25B9\u25B9\u25B9\u25B8",
        ],
    },
    bouncingBar: {
        interval: 80,
        frames: [
            "[    ]",
            "[=   ]",
            "[==  ]",
            "[=== ]",
            "[====]",
            "[ ===]",
            "[  ==]",
            "[   =]",
            "[    ]",
            "[   =]",
            "[  ==]",
            "[ ===]",
            "[====]",
            "[=== ]",
            "[==  ]",
            "[=   ]",
        ],
    },
    bouncingBall: {
        interval: 80,
        frames: [
            "( \u25CF    )",
            "(  \u25CF   )",
            "(   \u25CF  )",
            "(    \u25CF )",
            "(     \u25CF)",
            "(    \u25CF )",
            "(   \u25CF  )",
            "(  \u25CF   )",
            "( \u25CF    )",
            "(\u25CF     )",
        ],
    },
    smiley: {
        interval: 200,
        frames: ["\uD83D\uDE04 ", "\uD83D\uDE1D "],
    },
    monkey: {
        interval: 300,
        frames: ["\uD83D\uDE48 ", "\uD83D\uDE48 ", "\uD83D\uDE49 ", "\uD83D\uDE4A "],
    },
    hearts: {
        interval: 100,
        frames: ["\uD83D\uDC9B ", "\uD83D\uDC99 ", "\uD83D\uDC9C ", "\uD83D\uDC9A ", "\uD83D\uDC97 "],
    },
    clock: {
        interval: 100,
        frames: [
            "\uD83D\uDD5B ",
            "\uD83D\uDD50 ",
            "\uD83D\uDD51 ",
            "\uD83D\uDD52 ",
            "\uD83D\uDD53 ",
            "\uD83D\uDD54 ",
            "\uD83D\uDD55 ",
            "\uD83D\uDD56 ",
            "\uD83D\uDD57 ",
            "\uD83D\uDD58 ",
            "\uD83D\uDD59 ",
            "\uD83D\uDD5A ",
        ],
    },
    earth: {
        interval: 180,
        frames: ["\uD83C\uDF0D ", "\uD83C\uDF0E ", "\uD83C\uDF0F "],
    },
    material: {
        interval: 17,
        frames: [
            "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
            "\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
            "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
            "\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
            "\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
            "\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
            "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2588",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
            "\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581\u2581",
        ],
    },
    moon: {
        interval: 80,
        frames: [
            "\uD83C\uDF11 ",
            "\uD83C\uDF12 ",
            "\uD83C\uDF13 ",
            "\uD83C\uDF14 ",
            "\uD83C\uDF15 ",
            "\uD83C\uDF16 ",
            "\uD83C\uDF17 ",
            "\uD83C\uDF18 ",
        ],
    },
    runner: {
        interval: 140,
        frames: ["\uD83D\uDEB6 ", "\uD83C\uDFC3 "],
    },
    pong: {
        interval: 80,
        frames: [
            "\u2590\u2802       \u258C",
            "\u2590\u2808       \u258C",
            "\u2590 \u2802      \u258C",
            "\u2590 \u2820      \u258C",
            "\u2590  \u2840     \u258C",
            "\u2590  \u2820     \u258C",
            "\u2590   \u2802    \u258C",
            "\u2590   \u2808    \u258C",
            "\u2590    \u2802   \u258C",
            "\u2590    \u2820   \u258C",
            "\u2590     \u2840  \u258C",
            "\u2590     \u2820  \u258C",
            "\u2590      \u2802 \u258C",
            "\u2590      \u2808 \u258C",
            "\u2590       \u2802\u258C",
            "\u2590       \u2820\u258C",
            "\u2590       \u2840\u258C",
            "\u2590      \u2820 \u258C",
            "\u2590      \u2802 \u258C",
            "\u2590     \u2808  \u258C",
            "\u2590     \u2802  \u258C",
            "\u2590    \u2820   \u258C",
            "\u2590    \u2840   \u258C",
            "\u2590   \u2820    \u258C",
            "\u2590   \u2802    \u258C",
            "\u2590  \u2808     \u258C",
            "\u2590  \u2802     \u258C",
            "\u2590 \u2820      \u258C",
            "\u2590 \u2840      \u258C",
            "\u2590\u2820       \u258C",
        ],
    },
    shark: {
        interval: 120,
        frames: [
            "\u2590|\\____________\u258C",
            "\u2590_|\\___________\u258C",
            "\u2590__|\\__________\u258C",
            "\u2590___|\\_________\u258C",
            "\u2590____|\\________\u258C",
            "\u2590_____|\\_______\u258C",
            "\u2590______|\\______\u258C",
            "\u2590_______|\\_____\u258C",
            "\u2590________|\\____\u258C",
            "\u2590_________|\\___\u258C",
            "\u2590__________|\\__\u258C",
            "\u2590___________|\\_\u258C",
            "\u2590____________|\\\u258C",
            "\u2590____________/|\u258C",
            "\u2590___________/|_\u258C",
            "\u2590__________/|__\u258C",
            "\u2590_________/|___\u258C",
            "\u2590________/|____\u258C",
            "\u2590_______/|_____\u258C",
            "\u2590______/|______\u258C",
            "\u2590_____/|_______\u258C",
            "\u2590____/|________\u258C",
            "\u2590___/|_________\u258C",
            "\u2590__/|__________\u258C",
            "\u2590_/|___________\u258C",
            "\u2590/|____________\u258C",
        ],
    },
    dqpb: {
        interval: 100,
        frames: ["d", "q", "p", "b"],
    },
    weather: {
        interval: 100,
        frames: [
            "\u2600\uFE0F ",
            "\u2600\uFE0F ",
            "\u2600\uFE0F ",
            "\uD83C\uDF24 ",
            "\u26C5\uFE0F ",
            "\uD83C\uDF25 ",
            "\u2601\uFE0F ",
            "\uD83C\uDF27 ",
            "\uD83C\uDF28 ",
            "\uD83C\uDF27 ",
            "\uD83C\uDF28 ",
            "\uD83C\uDF27 ",
            "\uD83C\uDF28 ",
            "\u26C8 ",
            "\uD83C\uDF28 ",
            "\uD83C\uDF27 ",
            "\uD83C\uDF28 ",
            "\u2601\uFE0F ",
            "\uD83C\uDF25 ",
            "\u26C5\uFE0F ",
            "\uD83C\uDF24 ",
            "\u2600\uFE0F ",
            "\u2600\uFE0F ",
        ],
    },
    christmas: {
        interval: 400,
        frames: ["\uD83C\uDF32", "\uD83C\uDF84"],
    },
    grenade: {
        interval: 80,
        frames: [
            "\u060C  ",
            "\u2032  ",
            " \xB4 ",
            " \u203E ",
            "  \u2E0C",
            "  \u2E0A",
            "  |",
            "  \u204E",
            "  \u2055",
            " \u0DF4 ",
            "  \u2053",
            "   ",
            "   ",
            "   ",
        ],
    },
    point: {
        interval: 125,
        frames: [
            "\u2219\u2219\u2219",
            "\u25CF\u2219\u2219",
            "\u2219\u25CF\u2219",
            "\u2219\u2219\u25CF",
            "\u2219\u2219\u2219",
        ],
    },
    layer: {
        interval: 150,
        frames: ["-", "=", "\u2261"],
    },
    betaWave: {
        interval: 80,
        frames: [
            "\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2",
            "\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2\u03B2",
            "\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2\u03B2",
            "\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2\u03B2",
            "\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2\u03B2",
            "\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1\u03B2",
            "\u03B2\u03B2\u03B2\u03B2\u03B2\u03B2\u03C1",
        ],
    },
    fingerDance: {
        interval: 160,
        frames: [
            "\uD83E\uDD18 ",
            "\uD83E\uDD1F ",
            "\uD83D\uDD96 ",
            "\u270B ",
            "\uD83E\uDD1A ",
            "\uD83D\uDC46 ",
        ],
    },
    fistBump: {
        interval: 80,
        frames: [
            "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
            "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
            "\uD83E\uDD1C\u3000\u3000\u3000\u3000\uD83E\uDD1B ",
            "\u3000\uD83E\uDD1C\u3000\u3000\uD83E\uDD1B\u3000 ",
            "\u3000\u3000\uD83E\uDD1C\uD83E\uDD1B\u3000\u3000 ",
            "\u3000\uD83E\uDD1C\u2728\uD83E\uDD1B\u3000\u3000 ",
            "\uD83E\uDD1C\u3000\u2728\u3000\uD83E\uDD1B\u3000 ",
        ],
    },
    soccerHeader: {
        interval: 80,
        frames: [
            " \uD83E\uDDD1\u26BD\uFE0F       \uD83E\uDDD1 ",
            "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 ",
            "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
            "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
            "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
            "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
            "\uD83E\uDDD1       \u26BD\uFE0F\uD83E\uDDD1  ",
            "\uD83E\uDDD1      \u26BD\uFE0F  \uD83E\uDDD1 ",
            "\uD83E\uDDD1     \u26BD\uFE0F   \uD83E\uDDD1 ",
            "\uD83E\uDDD1    \u26BD\uFE0F    \uD83E\uDDD1 ",
            "\uD83E\uDDD1   \u26BD\uFE0F     \uD83E\uDDD1 ",
            "\uD83E\uDDD1  \u26BD\uFE0F      \uD83E\uDDD1 ",
        ],
    },
    mindblown: {
        interval: 160,
        frames: [
            "\uD83D\uDE10 ",
            "\uD83D\uDE10 ",
            "\uD83D\uDE2E ",
            "\uD83D\uDE2E ",
            "\uD83D\uDE26 ",
            "\uD83D\uDE26 ",
            "\uD83D\uDE27 ",
            "\uD83D\uDE27 ",
            "\uD83E\uDD2F ",
            "\uD83D\uDCA5 ",
            "\u2728 ",
            "\u3000 ",
            "\u3000 ",
            "\u3000 ",
        ],
    },
    speaker: {
        interval: 160,
        frames: ["\uD83D\uDD08 ", "\uD83D\uDD09 ", "\uD83D\uDD0A ", "\uD83D\uDD09 "],
    },
    orangePulse: {
        interval: 100,
        frames: ["\uD83D\uDD38 ", "\uD83D\uDD36 ", "\uD83D\uDFE0 ", "\uD83D\uDFE0 ", "\uD83D\uDD36 "],
    },
    bluePulse: {
        interval: 100,
        frames: ["\uD83D\uDD39 ", "\uD83D\uDD37 ", "\uD83D\uDD35 ", "\uD83D\uDD35 ", "\uD83D\uDD37 "],
    },
    orangeBluePulse: {
        interval: 100,
        frames: [
            "\uD83D\uDD38 ",
            "\uD83D\uDD36 ",
            "\uD83D\uDFE0 ",
            "\uD83D\uDFE0 ",
            "\uD83D\uDD36 ",
            "\uD83D\uDD39 ",
            "\uD83D\uDD37 ",
            "\uD83D\uDD35 ",
            "\uD83D\uDD35 ",
            "\uD83D\uDD37 ",
        ],
    },
    timeTravel: {
        interval: 100,
        frames: [
            "\uD83D\uDD5B ",
            "\uD83D\uDD5A ",
            "\uD83D\uDD59 ",
            "\uD83D\uDD58 ",
            "\uD83D\uDD57 ",
            "\uD83D\uDD56 ",
            "\uD83D\uDD55 ",
            "\uD83D\uDD54 ",
            "\uD83D\uDD53 ",
            "\uD83D\uDD52 ",
            "\uD83D\uDD51 ",
            "\uD83D\uDD50 ",
        ],
    },
    aesthetic: {
        interval: 80,
        frames: [
            "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1",
            "\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1",
            "\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1\u25B1",
            "\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1\u25B1",
            "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1\u25B1",
            "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B1",
            "\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0",
            "\u25B0\u25B1\u25B1\u25B1\u25B1\u25B1\u25B1",
        ],
    },
    dwarfFortress: {
        interval: 80,
        frames: [
            " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A\u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "\u263A \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A\u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u263A \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A\u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u263A \u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2593\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2592\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A\u2591\u2588\u2588\xA3\xA3\xA3  ",
            "   \u263A \u2588\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2588\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2593\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2592\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
            "    \u263A\u2591\u2588\xA3\xA3\xA3  ",
            "    \u263A \u2588\xA3\xA3\xA3  ",
            "     \u263A\u2588\xA3\xA3\xA3  ",
            "     \u263A\u2588\xA3\xA3\xA3  ",
            "     \u263A\u2593\xA3\xA3\xA3  ",
            "     \u263A\u2593\xA3\xA3\xA3  ",
            "     \u263A\u2592\xA3\xA3\xA3  ",
            "     \u263A\u2592\xA3\xA3\xA3  ",
            "     \u263A\u2591\xA3\xA3\xA3  ",
            "     \u263A\u2591\xA3\xA3\xA3  ",
            "     \u263A \xA3\xA3\xA3  ",
            "      \u263A\xA3\xA3\xA3  ",
            "      \u263A\xA3\xA3\xA3  ",
            "      \u263A\u2593\xA3\xA3  ",
            "      \u263A\u2593\xA3\xA3  ",
            "      \u263A\u2592\xA3\xA3  ",
            "      \u263A\u2592\xA3\xA3  ",
            "      \u263A\u2591\xA3\xA3  ",
            "      \u263A\u2591\xA3\xA3  ",
            "      \u263A \xA3\xA3  ",
            "       \u263A\xA3\xA3  ",
            "       \u263A\xA3\xA3  ",
            "       \u263A\u2593\xA3  ",
            "       \u263A\u2593\xA3  ",
            "       \u263A\u2592\xA3  ",
            "       \u263A\u2592\xA3  ",
            "       \u263A\u2591\xA3  ",
            "       \u263A\u2591\xA3  ",
            "       \u263A \xA3  ",
            "        \u263A\xA3  ",
            "        \u263A\xA3  ",
            "        \u263A\u2593  ",
            "        \u263A\u2593  ",
            "        \u263A\u2592  ",
            "        \u263A\u2592  ",
            "        \u263A\u2591  ",
            "        \u263A\u2591  ",
            "        \u263A   ",
            "        \u263A  &",
            "        \u263A \u263C&",
            "       \u263A \u263C &",
            "       \u263A\u263C  &",
            "      \u263A\u263C  & ",
            "      \u203C   & ",
            "     \u263A   &  ",
            "    \u203C    &  ",
            "   \u263A    &   ",
            "  \u203C     &   ",
            " \u263A     &    ",
            "\u203C      &    ",
            "      &     ",
            "      &     ",
            "     &   \u2591  ",
            "     &   \u2592  ",
            "    &    \u2593  ",
            "    &    \xA3  ",
            "   &    \u2591\xA3  ",
            "   &    \u2592\xA3  ",
            "  &     \u2593\xA3  ",
            "  &     \xA3\xA3  ",
            " &     \u2591\xA3\xA3  ",
            " &     \u2592\xA3\xA3  ",
            "&      \u2593\xA3\xA3  ",
            "&      \xA3\xA3\xA3  ",
            "      \u2591\xA3\xA3\xA3  ",
            "      \u2592\xA3\xA3\xA3  ",
            "      \u2593\xA3\xA3\xA3  ",
            "      \u2588\xA3\xA3\xA3  ",
            "     \u2591\u2588\xA3\xA3\xA3  ",
            "     \u2592\u2588\xA3\xA3\xA3  ",
            "     \u2593\u2588\xA3\xA3\xA3  ",
            "     \u2588\u2588\xA3\xA3\xA3  ",
            "    \u2591\u2588\u2588\xA3\xA3\xA3  ",
            "    \u2592\u2588\u2588\xA3\xA3\xA3  ",
            "    \u2593\u2588\u2588\xA3\xA3\xA3  ",
            "    \u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u2591\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u2592\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u2593\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "   \u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u2591\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u2592\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u2593\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            "  \u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u2591\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u2592\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u2593\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
            " \u2588\u2588\u2588\u2588\u2588\u2588\xA3\xA3\xA3  ",
        ],
    },
};

// node_modules/ora/node_modules/cli-spinners/index.js
var cli_spinners_default = spinners_default;
var spinnersList = Object.keys(spinners_default);

// node_modules/log-symbols/symbols.js
var exports_symbols = {};
__export(exports_symbols, {
    warning: () => warning,
    success: () => success,
    info: () => info,
    error: () => error,
});

// node_modules/yoctocolors/base.js
import tty2 from "tty";
var hasColors = tty2?.WriteStream?.prototype?.hasColors?.() ?? false;
var format = (open, close) => {
    if (!hasColors) {
        return (input) => input;
    }
    const openCode = `\x1B[${open}m`;
    const closeCode = `\x1B[${close}m`;
    return (input) => {
        const string = input + "";
        let index = string.indexOf(closeCode);
        if (index === -1) {
            return openCode + string + closeCode;
        }
        let result = openCode;
        let lastIndex = 0;
        const reopenOnNestedClose = close === 22;
        const replaceCode = (reopenOnNestedClose ? closeCode : "") + openCode;
        while (index !== -1) {
            result += string.slice(lastIndex, index) + replaceCode;
            lastIndex = index + closeCode.length;
            index = string.indexOf(closeCode, lastIndex);
        }
        result += string.slice(lastIndex) + closeCode;
        return result;
    };
};
var reset = format(0, 0);
var bold = format(1, 22);
var dim = format(2, 22);
var italic = format(3, 23);
var underline = format(4, 24);
var overline = format(53, 55);
var inverse = format(7, 27);
var hidden = format(8, 28);
var strikethrough = format(9, 29);
var black = format(30, 39);
var red = format(31, 39);
var green = format(32, 39);
var yellow = format(33, 39);
var blue = format(34, 39);
var magenta = format(35, 39);
var cyan = format(36, 39);
var white = format(37, 39);
var gray = format(90, 39);
var bgBlack = format(40, 49);
var bgRed = format(41, 49);
var bgGreen = format(42, 49);
var bgYellow = format(43, 49);
var bgBlue = format(44, 49);
var bgMagenta = format(45, 49);
var bgCyan = format(46, 49);
var bgWhite = format(47, 49);
var bgGray = format(100, 49);
var redBright = format(91, 39);
var greenBright = format(92, 39);
var yellowBright = format(93, 39);
var blueBright = format(94, 39);
var magentaBright = format(95, 39);
var cyanBright = format(96, 39);
var whiteBright = format(97, 39);
var bgRedBright = format(101, 49);
var bgGreenBright = format(102, 49);
var bgYellowBright = format(103, 49);
var bgBlueBright = format(104, 49);
var bgMagentaBright = format(105, 49);
var bgCyanBright = format(106, 49);
var bgWhiteBright = format(107, 49);

// node_modules/is-unicode-supported/index.js
import process6 from "process";
function isUnicodeSupported() {
    const { env: env2 } = process6;
    const { TERM, TERM_PROGRAM } = env2;
    if (process6.platform !== "win32") {
        return TERM !== "linux";
    }
    return (
        Boolean(env2.WT_SESSION) ||
        Boolean(env2.TERMINUS_SUBLIME) ||
        env2.ConEmuTask === "{cmd::Cmder}" ||
        TERM_PROGRAM === "Terminus-Sublime" ||
        TERM_PROGRAM === "vscode" ||
        TERM === "xterm-256color" ||
        TERM === "alacritty" ||
        TERM === "rxvt-unicode" ||
        TERM === "rxvt-unicode-256color" ||
        env2.TERMINAL_EMULATOR === "JetBrains-JediTerm"
    );
}

// node_modules/log-symbols/symbols.js
var _isUnicodeSupported = isUnicodeSupported();
var info = blue(_isUnicodeSupported ? "\u2139" : "i");
var success = green(_isUnicodeSupported ? "\u2714" : "\u221A");
var warning = yellow(_isUnicodeSupported ? "\u26A0" : "\u203C");
var error = red(_isUnicodeSupported ? "\u2716" : "\xD7");
// node_modules/ora/node_modules/strip-ansi/node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
    const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
    const osc = `(?:\\u001B\\][\\s\\S]*?${ST})`;
    const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
    const pattern = `${osc}|${csi}`;
    return new RegExp(pattern, onlyFirst ? undefined : "g");
}

// node_modules/ora/node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
    if (typeof string !== "string") {
        throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
    }
    return string.replace(regex, "");
}

// node_modules/get-east-asian-width/lookup.js
function isAmbiguous(x) {
    return (
        x === 161 ||
        x === 164 ||
        x === 167 ||
        x === 168 ||
        x === 170 ||
        x === 173 ||
        x === 174 ||
        (x >= 176 && x <= 180) ||
        (x >= 182 && x <= 186) ||
        (x >= 188 && x <= 191) ||
        x === 198 ||
        x === 208 ||
        x === 215 ||
        x === 216 ||
        (x >= 222 && x <= 225) ||
        x === 230 ||
        (x >= 232 && x <= 234) ||
        x === 236 ||
        x === 237 ||
        x === 240 ||
        x === 242 ||
        x === 243 ||
        (x >= 247 && x <= 250) ||
        x === 252 ||
        x === 254 ||
        x === 257 ||
        x === 273 ||
        x === 275 ||
        x === 283 ||
        x === 294 ||
        x === 295 ||
        x === 299 ||
        (x >= 305 && x <= 307) ||
        x === 312 ||
        (x >= 319 && x <= 322) ||
        x === 324 ||
        (x >= 328 && x <= 331) ||
        x === 333 ||
        x === 338 ||
        x === 339 ||
        x === 358 ||
        x === 359 ||
        x === 363 ||
        x === 462 ||
        x === 464 ||
        x === 466 ||
        x === 468 ||
        x === 470 ||
        x === 472 ||
        x === 474 ||
        x === 476 ||
        x === 593 ||
        x === 609 ||
        x === 708 ||
        x === 711 ||
        (x >= 713 && x <= 715) ||
        x === 717 ||
        x === 720 ||
        (x >= 728 && x <= 731) ||
        x === 733 ||
        x === 735 ||
        (x >= 768 && x <= 879) ||
        (x >= 913 && x <= 929) ||
        (x >= 931 && x <= 937) ||
        (x >= 945 && x <= 961) ||
        (x >= 963 && x <= 969) ||
        x === 1025 ||
        (x >= 1040 && x <= 1103) ||
        x === 1105 ||
        x === 8208 ||
        (x >= 8211 && x <= 8214) ||
        x === 8216 ||
        x === 8217 ||
        x === 8220 ||
        x === 8221 ||
        (x >= 8224 && x <= 8226) ||
        (x >= 8228 && x <= 8231) ||
        x === 8240 ||
        x === 8242 ||
        x === 8243 ||
        x === 8245 ||
        x === 8251 ||
        x === 8254 ||
        x === 8308 ||
        x === 8319 ||
        (x >= 8321 && x <= 8324) ||
        x === 8364 ||
        x === 8451 ||
        x === 8453 ||
        x === 8457 ||
        x === 8467 ||
        x === 8470 ||
        x === 8481 ||
        x === 8482 ||
        x === 8486 ||
        x === 8491 ||
        x === 8531 ||
        x === 8532 ||
        (x >= 8539 && x <= 8542) ||
        (x >= 8544 && x <= 8555) ||
        (x >= 8560 && x <= 8569) ||
        x === 8585 ||
        (x >= 8592 && x <= 8601) ||
        x === 8632 ||
        x === 8633 ||
        x === 8658 ||
        x === 8660 ||
        x === 8679 ||
        x === 8704 ||
        x === 8706 ||
        x === 8707 ||
        x === 8711 ||
        x === 8712 ||
        x === 8715 ||
        x === 8719 ||
        x === 8721 ||
        x === 8725 ||
        x === 8730 ||
        (x >= 8733 && x <= 8736) ||
        x === 8739 ||
        x === 8741 ||
        (x >= 8743 && x <= 8748) ||
        x === 8750 ||
        (x >= 8756 && x <= 8759) ||
        x === 8764 ||
        x === 8765 ||
        x === 8776 ||
        x === 8780 ||
        x === 8786 ||
        x === 8800 ||
        x === 8801 ||
        (x >= 8804 && x <= 8807) ||
        x === 8810 ||
        x === 8811 ||
        x === 8814 ||
        x === 8815 ||
        x === 8834 ||
        x === 8835 ||
        x === 8838 ||
        x === 8839 ||
        x === 8853 ||
        x === 8857 ||
        x === 8869 ||
        x === 8895 ||
        x === 8978 ||
        (x >= 9312 && x <= 9449) ||
        (x >= 9451 && x <= 9547) ||
        (x >= 9552 && x <= 9587) ||
        (x >= 9600 && x <= 9615) ||
        (x >= 9618 && x <= 9621) ||
        x === 9632 ||
        x === 9633 ||
        (x >= 9635 && x <= 9641) ||
        x === 9650 ||
        x === 9651 ||
        x === 9654 ||
        x === 9655 ||
        x === 9660 ||
        x === 9661 ||
        x === 9664 ||
        x === 9665 ||
        (x >= 9670 && x <= 9672) ||
        x === 9675 ||
        (x >= 9678 && x <= 9681) ||
        (x >= 9698 && x <= 9701) ||
        x === 9711 ||
        x === 9733 ||
        x === 9734 ||
        x === 9737 ||
        x === 9742 ||
        x === 9743 ||
        x === 9756 ||
        x === 9758 ||
        x === 9792 ||
        x === 9794 ||
        x === 9824 ||
        x === 9825 ||
        (x >= 9827 && x <= 9829) ||
        (x >= 9831 && x <= 9834) ||
        x === 9836 ||
        x === 9837 ||
        x === 9839 ||
        x === 9886 ||
        x === 9887 ||
        x === 9919 ||
        (x >= 9926 && x <= 9933) ||
        (x >= 9935 && x <= 9939) ||
        (x >= 9941 && x <= 9953) ||
        x === 9955 ||
        x === 9960 ||
        x === 9961 ||
        (x >= 9963 && x <= 9969) ||
        x === 9972 ||
        (x >= 9974 && x <= 9977) ||
        x === 9979 ||
        x === 9980 ||
        x === 9982 ||
        x === 9983 ||
        x === 10045 ||
        (x >= 10102 && x <= 10111) ||
        (x >= 11094 && x <= 11097) ||
        (x >= 12872 && x <= 12879) ||
        (x >= 57344 && x <= 63743) ||
        (x >= 65024 && x <= 65039) ||
        x === 65533 ||
        (x >= 127232 && x <= 127242) ||
        (x >= 127248 && x <= 127277) ||
        (x >= 127280 && x <= 127337) ||
        (x >= 127344 && x <= 127373) ||
        x === 127375 ||
        x === 127376 ||
        (x >= 127387 && x <= 127404) ||
        (x >= 917760 && x <= 917999) ||
        (x >= 983040 && x <= 1048573) ||
        (x >= 1048576 && x <= 1114109)
    );
}
function isFullWidth(x) {
    return x === 12288 || (x >= 65281 && x <= 65376) || (x >= 65504 && x <= 65510);
}
function isWide(x) {
    return (
        (x >= 4352 && x <= 4447) ||
        x === 8986 ||
        x === 8987 ||
        x === 9001 ||
        x === 9002 ||
        (x >= 9193 && x <= 9196) ||
        x === 9200 ||
        x === 9203 ||
        x === 9725 ||
        x === 9726 ||
        x === 9748 ||
        x === 9749 ||
        (x >= 9776 && x <= 9783) ||
        (x >= 9800 && x <= 9811) ||
        x === 9855 ||
        (x >= 9866 && x <= 9871) ||
        x === 9875 ||
        x === 9889 ||
        x === 9898 ||
        x === 9899 ||
        x === 9917 ||
        x === 9918 ||
        x === 9924 ||
        x === 9925 ||
        x === 9934 ||
        x === 9940 ||
        x === 9962 ||
        x === 9970 ||
        x === 9971 ||
        x === 9973 ||
        x === 9978 ||
        x === 9981 ||
        x === 9989 ||
        x === 9994 ||
        x === 9995 ||
        x === 10024 ||
        x === 10060 ||
        x === 10062 ||
        (x >= 10067 && x <= 10069) ||
        x === 10071 ||
        (x >= 10133 && x <= 10135) ||
        x === 10160 ||
        x === 10175 ||
        x === 11035 ||
        x === 11036 ||
        x === 11088 ||
        x === 11093 ||
        (x >= 11904 && x <= 11929) ||
        (x >= 11931 && x <= 12019) ||
        (x >= 12032 && x <= 12245) ||
        (x >= 12272 && x <= 12287) ||
        (x >= 12289 && x <= 12350) ||
        (x >= 12353 && x <= 12438) ||
        (x >= 12441 && x <= 12543) ||
        (x >= 12549 && x <= 12591) ||
        (x >= 12593 && x <= 12686) ||
        (x >= 12688 && x <= 12773) ||
        (x >= 12783 && x <= 12830) ||
        (x >= 12832 && x <= 12871) ||
        (x >= 12880 && x <= 42124) ||
        (x >= 42128 && x <= 42182) ||
        (x >= 43360 && x <= 43388) ||
        (x >= 44032 && x <= 55203) ||
        (x >= 63744 && x <= 64255) ||
        (x >= 65040 && x <= 65049) ||
        (x >= 65072 && x <= 65106) ||
        (x >= 65108 && x <= 65126) ||
        (x >= 65128 && x <= 65131) ||
        (x >= 94176 && x <= 94180) ||
        (x >= 94192 && x <= 94198) ||
        (x >= 94208 && x <= 101589) ||
        (x >= 101631 && x <= 101662) ||
        (x >= 101760 && x <= 101874) ||
        (x >= 110576 && x <= 110579) ||
        (x >= 110581 && x <= 110587) ||
        x === 110589 ||
        x === 110590 ||
        (x >= 110592 && x <= 110882) ||
        x === 110898 ||
        (x >= 110928 && x <= 110930) ||
        x === 110933 ||
        (x >= 110948 && x <= 110951) ||
        (x >= 110960 && x <= 111355) ||
        (x >= 119552 && x <= 119638) ||
        (x >= 119648 && x <= 119670) ||
        x === 126980 ||
        x === 127183 ||
        x === 127374 ||
        (x >= 127377 && x <= 127386) ||
        (x >= 127488 && x <= 127490) ||
        (x >= 127504 && x <= 127547) ||
        (x >= 127552 && x <= 127560) ||
        x === 127568 ||
        x === 127569 ||
        (x >= 127584 && x <= 127589) ||
        (x >= 127744 && x <= 127776) ||
        (x >= 127789 && x <= 127797) ||
        (x >= 127799 && x <= 127868) ||
        (x >= 127870 && x <= 127891) ||
        (x >= 127904 && x <= 127946) ||
        (x >= 127951 && x <= 127955) ||
        (x >= 127968 && x <= 127984) ||
        x === 127988 ||
        (x >= 127992 && x <= 128062) ||
        x === 128064 ||
        (x >= 128066 && x <= 128252) ||
        (x >= 128255 && x <= 128317) ||
        (x >= 128331 && x <= 128334) ||
        (x >= 128336 && x <= 128359) ||
        x === 128378 ||
        x === 128405 ||
        x === 128406 ||
        x === 128420 ||
        (x >= 128507 && x <= 128591) ||
        (x >= 128640 && x <= 128709) ||
        x === 128716 ||
        (x >= 128720 && x <= 128722) ||
        (x >= 128725 && x <= 128728) ||
        (x >= 128732 && x <= 128735) ||
        x === 128747 ||
        x === 128748 ||
        (x >= 128756 && x <= 128764) ||
        (x >= 128992 && x <= 129003) ||
        x === 129008 ||
        (x >= 129292 && x <= 129338) ||
        (x >= 129340 && x <= 129349) ||
        (x >= 129351 && x <= 129535) ||
        (x >= 129648 && x <= 129660) ||
        (x >= 129664 && x <= 129674) ||
        (x >= 129678 && x <= 129734) ||
        x === 129736 ||
        (x >= 129741 && x <= 129756) ||
        (x >= 129759 && x <= 129770) ||
        (x >= 129775 && x <= 129784) ||
        (x >= 131072 && x <= 196605) ||
        (x >= 196608 && x <= 262141)
    );
}

// node_modules/get-east-asian-width/index.js
function validate(codePoint) {
    if (!Number.isSafeInteger(codePoint)) {
        throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
    }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
    validate(codePoint);
    if (isFullWidth(codePoint) || isWide(codePoint) || (ambiguousAsWide && isAmbiguous(codePoint))) {
        return 2;
    }
    return 1;
}

// node_modules/ora/node_modules/string-width/index.js
var segmenter = new Intl.Segmenter();
var zeroWidthClusterRegex = /^(?:\p{Default_Ignorable_Code_Point}|\p{Control}|\p{Mark}|\p{Surrogate})+$/v;
var leadingNonPrintingRegex =
    /^[\p{Default_Ignorable_Code_Point}\p{Control}\p{Format}\p{Mark}\p{Surrogate}]+/v;
var rgiEmojiRegex = /^\p{RGI_Emoji}$/v;
function baseVisible(segment) {
    return segment.replace(leadingNonPrintingRegex, "");
}
function isZeroWidthCluster(segment) {
    return zeroWidthClusterRegex.test(segment);
}
function trailingHalfwidthWidth(segment, eastAsianWidthOptions) {
    let extra = 0;
    if (segment.length > 1) {
        for (const char of segment.slice(1)) {
            if (char >= "\uFF00" && char <= "\uFFEF") {
                extra += eastAsianWidth(char.codePointAt(0), eastAsianWidthOptions);
            }
        }
    }
    return extra;
}
function stringWidth(input, options = {}) {
    if (typeof input !== "string" || input.length === 0) {
        return 0;
    }
    const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
    let string = input;
    if (!countAnsiEscapeCodes) {
        string = stripAnsi(string);
    }
    if (string.length === 0) {
        return 0;
    }
    let width = 0;
    const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
    for (const { segment } of segmenter.segment(string)) {
        if (isZeroWidthCluster(segment)) {
            continue;
        }
        if (rgiEmojiRegex.test(segment)) {
            width += 2;
            continue;
        }
        const codePoint = baseVisible(segment).codePointAt(0);
        width += eastAsianWidth(codePoint, eastAsianWidthOptions);
        width += trailingHalfwidthWidth(segment, eastAsianWidthOptions);
    }
    return width;
}

// node_modules/is-interactive/index.js
function isInteractive({ stream = process.stdout } = {}) {
    return Boolean(stream && stream.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env));
}

// node_modules/stdin-discarder/index.js
import process7 from "process";
var ASCII_ETX_CODE = 3;

class StdinDiscarder {
    #activeCount = 0;
    start() {
        this.#activeCount++;
        if (this.#activeCount === 1) {
            this.#realStart();
        }
    }
    stop() {
        if (this.#activeCount <= 0) {
            throw new Error("`stop` called more times than `start`");
        }
        this.#activeCount--;
        if (this.#activeCount === 0) {
            this.#realStop();
        }
    }
    #realStart() {
        if (process7.platform === "win32" || !process7.stdin.isTTY) {
            return;
        }
        process7.stdin.setRawMode(true);
        process7.stdin.on("data", this.#handleInput);
        process7.stdin.resume();
    }
    #realStop() {
        if (!process7.stdin.isTTY) {
            return;
        }
        process7.stdin.off("data", this.#handleInput);
        process7.stdin.pause();
        process7.stdin.setRawMode(false);
    }
    #handleInput(chunk) {
        if (chunk[0] === ASCII_ETX_CODE) {
            process7.emit("SIGINT");
        }
    }
}
var stdinDiscarder = new StdinDiscarder();
var stdin_discarder_default = stdinDiscarder;

// node_modules/ora/index.js
class Ora {
    #linesToClear = 0;
    #isDiscardingStdin = false;
    #lineCount = 0;
    #frameIndex = -1;
    #lastSpinnerFrameTime = 0;
    #lastIndent = 0;
    #options;
    #spinner;
    #stream;
    #id;
    #initialInterval;
    #isEnabled;
    #isSilent;
    #indent;
    #text;
    #prefixText;
    #suffixText;
    color;
    constructor(options) {
        if (typeof options === "string") {
            options = {
                text: options,
            };
        }
        this.#options = {
            color: "cyan",
            stream: process8.stderr,
            discardStdin: true,
            hideCursor: true,
            ...options,
        };
        this.color = this.#options.color;
        this.spinner = this.#options.spinner;
        this.#initialInterval = this.#options.interval;
        this.#stream = this.#options.stream;
        this.#isEnabled =
            typeof this.#options.isEnabled === "boolean"
                ? this.#options.isEnabled
                : isInteractive({ stream: this.#stream });
        this.#isSilent = typeof this.#options.isSilent === "boolean" ? this.#options.isSilent : false;
        this.text = this.#options.text;
        this.prefixText = this.#options.prefixText;
        this.suffixText = this.#options.suffixText;
        this.indent = this.#options.indent;
        if (process8.env.NODE_ENV === "test") {
            this._stream = this.#stream;
            this._isEnabled = this.#isEnabled;
            Object.defineProperty(this, "_linesToClear", {
                get() {
                    return this.#linesToClear;
                },
                set(newValue) {
                    this.#linesToClear = newValue;
                },
            });
            Object.defineProperty(this, "_frameIndex", {
                get() {
                    return this.#frameIndex;
                },
            });
            Object.defineProperty(this, "_lineCount", {
                get() {
                    return this.#lineCount;
                },
            });
        }
    }
    get indent() {
        return this.#indent;
    }
    set indent(indent = 0) {
        if (!(indent >= 0 && Number.isInteger(indent))) {
            throw new Error("The `indent` option must be an integer from 0 and up");
        }
        this.#indent = indent;
        this.#updateLineCount();
    }
    get interval() {
        return this.#initialInterval ?? this.#spinner.interval ?? 100;
    }
    get spinner() {
        return this.#spinner;
    }
    set spinner(spinner) {
        this.#frameIndex = -1;
        this.#initialInterval = undefined;
        if (typeof spinner === "object") {
            if (
                !Array.isArray(spinner.frames) ||
                spinner.frames.length === 0 ||
                spinner.frames.some((frame) => typeof frame !== "string")
            ) {
                throw new Error("The given spinner must have a non-empty `frames` array of strings");
            }
            if (
                spinner.interval !== undefined &&
                !(Number.isInteger(spinner.interval) && spinner.interval > 0)
            ) {
                throw new Error("`spinner.interval` must be a positive integer if provided");
            }
            this.#spinner = spinner;
        } else if (!isUnicodeSupported()) {
            this.#spinner = cli_spinners_default.line;
        } else if (spinner === undefined) {
            this.#spinner = cli_spinners_default.dots;
        } else if (spinner !== "default" && cli_spinners_default[spinner]) {
            this.#spinner = cli_spinners_default[spinner];
        } else {
            throw new Error(
                `There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`
            );
        }
    }
    get text() {
        return this.#text;
    }
    set text(value = "") {
        this.#text = value;
        this.#updateLineCount();
    }
    get prefixText() {
        return this.#prefixText;
    }
    set prefixText(value = "") {
        this.#prefixText = value;
        this.#updateLineCount();
    }
    get suffixText() {
        return this.#suffixText;
    }
    set suffixText(value = "") {
        this.#suffixText = value;
        this.#updateLineCount();
    }
    get isSpinning() {
        return this.#id !== undefined;
    }
    #formatAffix(value, separator, placeBefore = false) {
        const resolved = typeof value === "function" ? value() : value;
        if (typeof resolved === "string" && resolved !== "") {
            return placeBefore ? separator + resolved : resolved + separator;
        }
        return "";
    }
    #getFullPrefixText(prefixText = this.#prefixText, postfix = " ") {
        return this.#formatAffix(prefixText, postfix, false);
    }
    #getFullSuffixText(suffixText = this.#suffixText, prefix = " ") {
        return this.#formatAffix(suffixText, prefix, true);
    }
    #computeLineCountFrom(text, columns) {
        let count = 0;
        for (const line of stripAnsi(text).split(`
`)) {
            count += Math.max(1, Math.ceil(stringWidth(line) / columns));
        }
        return count;
    }
    #updateLineCount() {
        const columns = this.#stream.columns ?? 80;
        const prefixText = typeof this.#prefixText === "function" ? "" : this.#prefixText;
        const suffixText = typeof this.#suffixText === "function" ? "" : this.#suffixText;
        const fullPrefixText = typeof prefixText === "string" && prefixText !== "" ? prefixText + " " : "";
        const fullSuffixText = typeof suffixText === "string" && suffixText !== "" ? " " + suffixText : "";
        const spinnerChar = "-";
        const fullText =
            " ".repeat(this.#indent) +
            fullPrefixText +
            spinnerChar +
            (typeof this.#text === "string" ? " " + this.#text : "") +
            fullSuffixText;
        this.#lineCount = this.#computeLineCountFrom(fullText, columns);
    }
    get isEnabled() {
        return this.#isEnabled && !this.#isSilent;
    }
    set isEnabled(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("The `isEnabled` option must be a boolean");
        }
        this.#isEnabled = value;
    }
    get isSilent() {
        return this.#isSilent;
    }
    set isSilent(value) {
        if (typeof value !== "boolean") {
            throw new TypeError("The `isSilent` option must be a boolean");
        }
        this.#isSilent = value;
    }
    frame() {
        const now = Date.now();
        if (this.#frameIndex === -1 || now - this.#lastSpinnerFrameTime >= this.interval) {
            this.#frameIndex = ++this.#frameIndex % this.#spinner.frames.length;
            this.#lastSpinnerFrameTime = now;
        }
        const { frames } = this.#spinner;
        let frame = frames[this.#frameIndex];
        if (this.color) {
            frame = source_default[this.color](frame);
        }
        const fullPrefixText = this.#getFullPrefixText(this.#prefixText, " ");
        const fullText = typeof this.text === "string" ? " " + this.text : "";
        const fullSuffixText = this.#getFullSuffixText(this.#suffixText, " ");
        return fullPrefixText + frame + fullText + fullSuffixText;
    }
    clear() {
        if (!this.#isEnabled || !this.#stream.isTTY) {
            return this;
        }
        this.#stream.cursorTo(0);
        for (let index = 0; index < this.#linesToClear; index++) {
            if (index > 0) {
                this.#stream.moveCursor(0, -1);
            }
            this.#stream.clearLine(1);
        }
        if (this.#indent || this.#lastIndent !== this.#indent) {
            this.#stream.cursorTo(this.#indent);
        }
        this.#lastIndent = this.#indent;
        this.#linesToClear = 0;
        return this;
    }
    render() {
        if (!this.#isEnabled || this.#isSilent) {
            return this;
        }
        this.clear();
        let frameContent = this.frame();
        const columns = this.#stream.columns ?? 80;
        const actualLineCount = this.#computeLineCountFrom(frameContent, columns);
        const consoleHeight = this.#stream.rows;
        if (consoleHeight && consoleHeight > 1 && actualLineCount > consoleHeight) {
            const lines = frameContent.split(`
`);
            const maxLines = consoleHeight - 1;
            frameContent = [...lines.slice(0, maxLines), "... (content truncated to fit terminal)"].join(`
`);
        }
        this.#stream.write(frameContent);
        this.#linesToClear = this.#computeLineCountFrom(frameContent, columns);
        return this;
    }
    start(text) {
        if (text) {
            this.text = text;
        }
        if (this.#isSilent) {
            return this;
        }
        if (!this.#isEnabled) {
            const line =
                " ".repeat(this.#indent) +
                this.#getFullPrefixText(this.#prefixText, " ") +
                (this.text ? `- ${this.text}` : "") +
                this.#getFullSuffixText(this.#suffixText, " ");
            if (line.trim() !== "") {
                this.#stream.write(
                    line +
                        `
`
                );
            }
            return this;
        }
        if (this.isSpinning) {
            return this;
        }
        if (this.#options.hideCursor) {
            cli_cursor_default.hide(this.#stream);
        }
        if (this.#options.discardStdin && process8.stdin.isTTY) {
            this.#isDiscardingStdin = true;
            stdin_discarder_default.start();
        }
        this.render();
        this.#id = setInterval(this.render.bind(this), this.interval);
        return this;
    }
    stop() {
        clearInterval(this.#id);
        this.#id = undefined;
        this.#frameIndex = 0;
        if (this.#isEnabled) {
            this.clear();
            if (this.#options.hideCursor) {
                cli_cursor_default.show(this.#stream);
            }
        }
        if (this.#options.discardStdin && process8.stdin.isTTY && this.#isDiscardingStdin) {
            stdin_discarder_default.stop();
            this.#isDiscardingStdin = false;
        }
        return this;
    }
    succeed(text) {
        return this.stopAndPersist({ symbol: exports_symbols.success, text });
    }
    fail(text) {
        return this.stopAndPersist({ symbol: exports_symbols.error, text });
    }
    warn(text) {
        return this.stopAndPersist({ symbol: exports_symbols.warning, text });
    }
    info(text) {
        return this.stopAndPersist({ symbol: exports_symbols.info, text });
    }
    stopAndPersist(options = {}) {
        if (this.#isSilent) {
            return this;
        }
        const prefixText = options.prefixText ?? this.#prefixText;
        const fullPrefixText = this.#getFullPrefixText(prefixText, " ");
        const symbolText = options.symbol ?? " ";
        const text = options.text ?? this.text;
        const separatorText = symbolText ? " " : "";
        const fullText = typeof text === "string" ? separatorText + text : "";
        const suffixText = options.suffixText ?? this.#suffixText;
        const fullSuffixText = this.#getFullSuffixText(suffixText, " ");
        const textToWrite =
            fullPrefixText +
            symbolText +
            fullText +
            fullSuffixText +
            `
`;
        this.stop();
        this.#stream.write(textToWrite);
        return this;
    }
}
function ora(options) {
    return new Ora(options);
}

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
    program,
    createCommand,
    createArgument,
    createOption,
    CommanderError,
    InvalidArgumentError,
    InvalidOptionArgumentError,
    Command,
    Argument,
    Option,
    Help,
} = import__.default;

// dev/createGithubRelease.ts
var packageJson = await Bun.file("./package.json").json();
program.option("-d --dry-run", "Don't upload anything");
program.parse();
var buildPlatforms = [
    {
        bunName: "bun-linux-x64",
        name: "linux-x64",
        srcFileExtension: "",
        targetFileExtension: ".x86_64",
    },
    {
        bunName: "bun-linux-arm64",
        name: "linux-arm64",
        srcFileExtension: "",
        targetFileExtension: ".x86_64",
    },
    {
        bunName: "bun-windows-x64",
        name: "windows-x64",
        srcFileExtension: ".exe",
        targetFileExtension: ".exe",
    },
    {
        bunName: "bun-darwin-x64",
        name: "macos-x64",
        srcFileExtension: "",
        targetFileExtension: "",
    },
    {
        bunName: "bun-darwin-arm64",
        name: "macos-arm64",
        srcFileExtension: "",
        targetFileExtension: "",
    },
];
var spin = ora("Removing old binaries").start();
await rm("./bin", { recursive: true, force: true });
var succeededPlatforms = [];
for (const platform of buildPlatforms) {
    try {
        spin.text = `Building for ${platform.name}`;
        await Bun.build({
            compile: true,
            entrypoints: ["./src/index.ts"],
            outdir: "./bin",
            target: platform.bunName,
        });
        await rename(
            `./bin/src${platform.srcFileExtension}`,
            `./bin/${packageJson.name}-${platform.name}${platform.targetFileExtension}`
        );
        succeededPlatforms.push(platform);
    } catch {
        spin.warn(`Failed to compile binary for ${platform.name}`).start();
    }
}
var version = packageJson.version;
var tag = `v${version}`;
if (!program.opts().dryRun) {
    spin.text = `Pushing to git`;
    await $`git push`.quiet();
    spin.text = `Pushing tags`;
    await $`git push --tags`.quiet();
    spin.text = `Creating github release for tag ${tag}`;
    await $`gh release create ${tag} --generate-notes`.quiet();
    for (const platform of succeededPlatforms) {
        spin.text = `Uploading binary for ${platform.name}`;
        await $`gh release upload ${tag} ./bin/${packageJson.name}-${platform.name}${platform.targetFileExtension}`.quiet();
    }
}
spin.succeed(`Created release for tag ${tag} with ${succeededPlatforms.length} binaries`);
await $`notify-send -a "${packageJson.name}" "Finished" "Finished uploading release ${tag} to GitHub"`.nothrow();
