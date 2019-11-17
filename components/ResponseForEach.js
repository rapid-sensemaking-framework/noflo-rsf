"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var noflo = require("noflo");
var rsf_contactable_1 = require("rsf-contactable");
var shared_1 = require("../libs/shared");
// define other constants or creator functions
// of the strings for user interaction here
var giveOptionsText = function (options) {
    return "The options for each statement are: " + options.map(function (o) { return o.text + " (" + o.triggers.join(', ') + ")"; }).join(', ');
};
// use of this trigger will allow any response to match
var WILDCARD_TRIGGER = '*';
var defaultReactionCb = function (reaction) { };
var coreLogic = function (contactables, statements, options, maxTime, reactionCb, maxResponsesText, allCompletedText, timeoutText, invalidResponseText) {
    if (reactionCb === void 0) { reactionCb = defaultReactionCb; }
    if (maxResponsesText === void 0) { maxResponsesText = shared_1.DEFAULT_MAX_RESPONSES_TEXT; }
    if (allCompletedText === void 0) { allCompletedText = shared_1.DEFAULT_ALL_COMPLETED_TEXT; }
    if (timeoutText === void 0) { timeoutText = shared_1.DEFAULT_TIMEOUT_TEXT; }
    if (invalidResponseText === void 0) { invalidResponseText = shared_1.DEFAULT_INVALID_RESPONSE_TEXT; }
    return __awaiter(void 0, void 0, void 0, function () {
        var matchOption, validate, onInvalid, isPersonalComplete, onPersonalComplete, convertToResult, onResult, isTotalComplete, _a, timeoutComplete, results;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // initiate contact with each person
                    // and set context, and "rules"
                    contactables.forEach(function (contactable) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, contactable.speak(shared_1.rulesText(maxTime))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, shared_1.timer(500)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, contactable.speak(giveOptionsText(options))
                                        // send the first one
                                    ];
                                case 3:
                                    _a.sent();
                                    if (!statements.length) return [3 /*break*/, 6];
                                    return [4 /*yield*/, shared_1.timer(500)];
                                case 4:
                                    _a.sent();
                                    return [4 /*yield*/, contactable.speak("(" + (statements.length - 1) + " remaining) " + statements[0].text)];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    matchOption = function (text) {
                        return options.find(function (option) {
                            return option.triggers.find(function (trigger) { return trigger === text || trigger === WILDCARD_TRIGGER; });
                        });
                    };
                    validate = function (msg) {
                        return !!matchOption(msg);
                    };
                    onInvalid = function (msg, contactable) {
                        contactable.speak(invalidResponseText);
                    };
                    isPersonalComplete = function (personalResultsSoFar) {
                        return personalResultsSoFar.length === statements.length;
                    };
                    onPersonalComplete = function (personalResultsSoFar, contactable) {
                        contactable.speak(maxResponsesText);
                    };
                    convertToResult = function (msg, personalResultsSoFar, contactable) {
                        var matchedOption = matchOption(msg);
                        var responsesSoFar = personalResultsSoFar.length;
                        return {
                            statement: __assign({}, statements[responsesSoFar]),
                            response: matchedOption.text,
                            responseTrigger: msg,
                            id: contactable.id,
                            timestamp: Date.now()
                        };
                    };
                    onResult = function (reaction, personalResultsSoFar, contactable) {
                        // each time it gets one, send the next one
                        // until they're all responded to!
                        var responsesSoFar = personalResultsSoFar.length;
                        if (statements[responsesSoFar]) {
                            var next = "(" + (statements.length - 1 - responsesSoFar) + " remaining) " + statements[responsesSoFar].text;
                            contactable.speak(next);
                        }
                        reactionCb(reaction);
                    };
                    isTotalComplete = function (allResultsSoFar) {
                        return allResultsSoFar.length === contactables.length * statements.length;
                    };
                    return [4 /*yield*/, shared_1.collectFromContactables(contactables, maxTime, validate, onInvalid, isPersonalComplete, onPersonalComplete, convertToResult, onResult, isTotalComplete)];
                case 1:
                    _a = _b.sent(), timeoutComplete = _a.timeoutComplete, results = _a.results;
                    return [4 /*yield*/, Promise.all(contactables.map(function (contactable) { return contactable.speak(timeoutComplete ? timeoutText : allCompletedText); }))];
                case 2:
                    _b.sent();
                    return [2 /*return*/, results];
            }
        });
    });
};
exports.coreLogic = coreLogic;
var process = function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
    var maxTime, options, statements, botConfigs, contactableConfigs, invalidResponseText, maxResponsesText, allCompletedText, timeoutText, contactables, e_1, results, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!input.hasData('options', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
                    return [2 /*return*/];
                }
                maxTime = input.getData('max_time');
                options = input.getData('options');
                statements = input.getData('statements').slice(0) // make sure that this array is its own
                ;
                botConfigs = input.getData('bot_configs');
                contactableConfigs = input.getData('contactable_configs');
                invalidResponseText = input.getData('invalid_response_text');
                maxResponsesText = input.getData('max_responses_text');
                allCompletedText = input.getData('all_completed_text');
                timeoutText = input.getData('timeout_text');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, rsf_contactable_1.init(shared_1.whichToInit(contactableConfigs), botConfigs)];
            case 2:
                _a.sent();
                contactables = contactableConfigs.map(rsf_contactable_1.makeContactable);
                return [3 /*break*/, 4];
            case 3:
                e_1 = _a.sent();
                output.send({
                    error: e_1
                });
                output.done();
                return [2 /*return*/];
            case 4:
                _a.trys.push([4, 6, , 7]);
                return [4 /*yield*/, coreLogic(contactables, statements, options, maxTime, function (reaction) {
                        output.send({ reaction: reaction });
                    }, maxResponsesText, allCompletedText, timeoutText, invalidResponseText)];
            case 5:
                results = _a.sent();
                output.send({
                    results: results
                });
                return [3 /*break*/, 7];
            case 6:
                e_2 = _a.sent();
                output.send({
                    error: e_2
                });
                return [3 /*break*/, 7];
            case 7: return [4 /*yield*/, rsf_contactable_1.shutdown()];
            case 8:
                _a.sent();
                output.done();
                return [2 /*return*/];
        }
    });
}); };
var getComponent = function () {
    var c = new noflo.Component();
    /* META */
    c.description = 'For a list/array of statements, collect a response or vote for each from a list of participants';
    c.icon = 'compress';
    /* IN PORTS */
    c.inPorts.add('options', {
        datatype: 'array',
        description: 'a list containing the options (as objects with properties "triggers": "array" and "text": "string") people have to respond with',
        required: true
    });
    c.inPorts.add('statements', {
        datatype: 'array',
        description: 'the list of statements (as objects with property "text") to gather responses to',
        required: true
    });
    c.inPorts.add('max_time', {
        datatype: 'int',
        description: 'the number of seconds to wait until stopping this process automatically',
        required: true
    });
    c.inPorts.add('contactable_configs', {
        datatype: 'array',
        description: 'an array of rsf-contactable compatible config objects',
        required: true
    });
    c.inPorts.add('bot_configs', {
        datatype: 'object',
        description: 'an object of rsf-contactable compatible bot config objects',
        required: true
    });
    c.inPorts.add('max_responses_text', {
        datatype: 'string',
        description: 'msg override: the message sent when participant hits response limit'
    });
    c.inPorts.add('invalid_response_text', {
        datatype: 'string',
        description: 'msg override: the message sent when participant use an invalid response'
    });
    c.inPorts.add('all_completed_text', {
        datatype: 'string',
        description: 'msg override: the message sent to all participants when the process completes, by completion by all participants'
    });
    c.inPorts.add('timeout_text', {
        datatype: 'string',
        description: 'msg override: the message sent to all participants when the process completes because the timeout is reached'
    });
    /* OUT PORTS */
    c.outPorts.add('reaction', {
        datatype: 'object' // rsf-types/Reaction
    });
    c.outPorts.add('results', {
        datatype: 'array' // rsf-types/Reaction[]
    });
    c.outPorts.add('error', {
        datatype: 'all'
    });
    /* DEFINE PROCESS */
    c.process(process);
    return c;
};
exports.getComponent = getComponent;
