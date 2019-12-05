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
var moment = require("moment");
var DEFAULT_ALL_COMPLETED_TEXT = "Everyone has completed. Thanks for participating.";
exports.DEFAULT_ALL_COMPLETED_TEXT = DEFAULT_ALL_COMPLETED_TEXT;
var DEFAULT_TIMEOUT_TEXT = "The max time has been reached. Stopping now. Thanks for participating.";
exports.DEFAULT_TIMEOUT_TEXT = DEFAULT_TIMEOUT_TEXT;
var DEFAULT_INVALID_RESPONSE_TEXT = "That's not a valid response, please try again.";
exports.DEFAULT_INVALID_RESPONSE_TEXT = DEFAULT_INVALID_RESPONSE_TEXT;
var DEFAULT_MAX_RESPONSES_TEXT = "You've responded to everything. Thanks for participating. You will be notified when everyone has completed.";
exports.DEFAULT_MAX_RESPONSES_TEXT = DEFAULT_MAX_RESPONSES_TEXT;
var rulesText = function (maxTime) { return "The process will stop automatically after " + moment.duration(maxTime, 'seconds').humanize() + "."; };
exports.rulesText = rulesText;
var whichToInit = function (contactableConfigs) {
    var specifyDefault = {
        doTelegram: false,
        doMattermost: false,
        doSms: false
    };
    // change to true if there is an instance of a ContactableConfig with the relevant
    // type
    return contactableConfigs.reduce(function (memo, value) {
        var uppercased = value.type.charAt(0).toUpperCase() + value.type.slice(1);
        memo["do" + uppercased] = true;
        return memo;
    }, specifyDefault);
};
exports.whichToInit = whichToInit;
var timer = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
exports.timer = timer;
var collectFromContactables = function (contactables, maxTime, validate, onInvalid, isPersonalComplete, onPersonalComplete, // will only be called once
convertToResult, onResult, isTotalComplete) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve) {
                // array to store the results
                var results = [];
                // stop the process after a maximum amount of time
                // maxTime is passed in as seconds, and setTimeout accepts milliseconds,
                // so multiply by a thousand
                var timeoutId = setTimeout(function () {
                    // complete, saving whatever results we have
                    contactables.forEach(function (contactable) { return contactable.stopListening(); });
                    resolve({ timeoutComplete: true, results: results });
                }, maxTime * 1000);
                contactables.forEach(function (contactable) {
                    // keep track of the results from this person
                    var personalResults = [];
                    // listen for messages from them, and treat each one
                    // as an input, up till the alotted amount
                    contactable.listen(function (text) {
                        var personalComplete = isPersonalComplete(personalResults);
                        if (!personalComplete) {
                            if (!validate(text)) {
                                onInvalid(text, contactable);
                                return;
                            }
                            var newResult = convertToResult(text, personalResults, contactable);
                            personalResults.push(newResult);
                            results.push(newResult);
                            onResult(__assign({}, newResult), personalResults, contactable); // clone
                        }
                        if (isPersonalComplete(personalResults)) {
                            onPersonalComplete(personalResults, contactable);
                            contactable.stopListening();
                        }
                        if (isTotalComplete(results)) {
                            clearTimeout(timeoutId);
                            contactables.forEach(function (contactable) { return contactable.stopListening(); });
                            resolve({ timeoutComplete: false, results: results });
                        }
                    });
                });
            })];
    });
}); };
exports.collectFromContactables = collectFromContactables;
var formatPairwiseChoice = function (numPerPerson, numSoFar, pairwiseChoice) {
    return "(" + (numPerPerson - 1 - numSoFar) + " more remaining)\n0) " + pairwiseChoice[0].text + "\n1) " + pairwiseChoice[1].text;
};
// accomodates PairwiseVote, PairwiseQualified, PairwiseQuantified
var formatPairwiseList = function (description, key, pairwiseList, anonymize) {
    return pairwiseList.reduce(function (memo, el) {
        return memo + "\n0) " + el.choices[0].text + "\n1) " + el.choices[1].text + "\n" + description + ": " + el[key] + (anonymize || !el.contact ? '' : " : " + el.contact.id + "@" + el.contact.type);
    }, '');
};
exports.formatPairwiseList = formatPairwiseList;
var genericPairwise = function (contactables, statements, contextMsg, maxTime, eachCb, validate, convertToPairwiseResult, maxResponsesText, allCompletedText, timeoutText, invalidResponseText, speechDelay) {
    if (maxResponsesText === void 0) { maxResponsesText = DEFAULT_MAX_RESPONSES_TEXT; }
    if (allCompletedText === void 0) { allCompletedText = DEFAULT_ALL_COMPLETED_TEXT; }
    if (timeoutText === void 0) { timeoutText = DEFAULT_TIMEOUT_TEXT; }
    if (invalidResponseText === void 0) { invalidResponseText = DEFAULT_INVALID_RESPONSE_TEXT; }
    if (speechDelay === void 0) { speechDelay = 500; }
    return __awaiter(void 0, void 0, void 0, function () {
        var pairsTexts, onInvalid, isPersonalComplete, onPersonalComplete, onResult, isTotalComplete, convertToResult, collectResults, timeoutComplete, results, closeFlowText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pairsTexts = [];
                    statements.forEach(function (statement, index) {
                        for (var i = index + 1; i < statements.length; i++) {
                            var pairedStatement = statements[i];
                            // use A and 1 to try to minimize preference
                            // bias for 1 vs 2, or A vs B
                            pairsTexts.push({
                                0: statement,
                                1: pairedStatement
                            });
                        }
                    });
                    // initiate contact with each person
                    // and set context, and "rules"
                    contactables.forEach(function (contactable) { return __awaiter(void 0, void 0, void 0, function () {
                        var first;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, contactable.speak(rulesText(maxTime))];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, timer(speechDelay)];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, contactable.speak(contextMsg)
                                        // send the first one
                                    ];
                                case 3:
                                    _a.sent();
                                    if (!statements.length) return [3 /*break*/, 6];
                                    return [4 /*yield*/, timer(speechDelay)];
                                case 4:
                                    _a.sent();
                                    first = formatPairwiseChoice(pairsTexts.length, 0, pairsTexts[0]);
                                    return [4 /*yield*/, contactable.speak(first)];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); });
                    onInvalid = function (msg, contactable) {
                        contactable.speak(invalidResponseText);
                    };
                    isPersonalComplete = function (personalResultsSoFar) {
                        return personalResultsSoFar.length === pairsTexts.length;
                    };
                    onPersonalComplete = function (personalResultsSoFar, contactable) {
                        contactable.speak(maxResponsesText);
                    };
                    onResult = function (el, personalResultsSoFar, contactable) {
                        // each time it gets one, send the next one
                        // until they're all responded to!
                        var responsesSoFar = personalResultsSoFar.length;
                        if (pairsTexts[responsesSoFar]) {
                            var nextPair = pairsTexts[responsesSoFar];
                            var nextPairFormatted = formatPairwiseChoice(pairsTexts.length, responsesSoFar, nextPair);
                            contactable.speak(nextPairFormatted);
                        }
                        eachCb(el);
                    };
                    isTotalComplete = function (allResultsSoFar) {
                        // exit when everyone has responded to everything
                        return allResultsSoFar.length === contactables.length * pairsTexts.length;
                    };
                    convertToResult = function (msg, personalResultsSoFar, contactable) {
                        return convertToPairwiseResult(msg, personalResultsSoFar, contactable, pairsTexts);
                    };
                    return [4 /*yield*/, collectFromContactables(contactables, maxTime, validate, onInvalid, isPersonalComplete, onPersonalComplete, convertToResult, onResult, isTotalComplete)];
                case 1:
                    collectResults = _a.sent();
                    timeoutComplete = collectResults.timeoutComplete, results = collectResults.results;
                    closeFlowText = timeoutComplete ? timeoutText : allCompletedText;
                    // send every participant a "process complete" message
                    return [4 /*yield*/, Promise.all(contactables.map(function (contactable) { return contactable.speak(closeFlowText); }))];
                case 2:
                    // send every participant a "process complete" message
                    _a.sent();
                    return [2 /*return*/, results];
            }
        });
    });
};
exports.genericPairwise = genericPairwise;
