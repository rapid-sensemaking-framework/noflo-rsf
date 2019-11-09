"use strict";
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
var noflo_1 = require("noflo");
var rsf_contactable_1 = require("rsf-contactable");
var shared_1 = require("../libs/shared");
// define other constants or creator functions
// of the strings for user interaction here
var process = function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
    var choice, statements, maxTime, botConfigs, contactableConfigs, maxResponsesText, allCompletedText, invalidResponseText, timeoutText, contactables, e_1, results, n, numPerPerson, timeoutId, calledComplete, complete, validResponse, checkCompletionCondition, pairsTexts;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Check preconditions on input data
                if (!input.hasData('choice', 'statements', 'max_time', 'contactable_configs', 'bot_configs')) {
                    return [2 /*return*/];
                }
                choice = input.getData('choice');
                statements = input.getData('statements');
                maxTime = input.getData('max_time');
                botConfigs = input.getData('bot_configs');
                contactableConfigs = input.getData('contactable_configs');
                maxResponsesText = input.getData('max_responses_text');
                allCompletedText = input.getData('all_completed_text');
                invalidResponseText = input.getData('invalid_response_text');
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
                // Process data and send output
                output.send({
                    error: e_1
                });
                // Deactivate
                output.done();
                return [2 /*return*/];
            case 4:
                results = [];
                n = statements.length;
                numPerPerson = n * (n - 1) / 2;
                timeoutId = setTimeout(function () {
                    // complete, saving whatever results we have
                    complete(timeoutText || shared_1.DEFAULT_TIMEOUT_TEXT);
                }, maxTime * 1000);
                calledComplete = false;
                complete = function (completionText) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!!calledComplete) return [3 /*break*/, 2];
                                // It is good practice to inform participants the process is ending
                                contactables.forEach(function (contactable) { return contactable.speak(completionText); });
                                clearTimeout(timeoutId);
                                calledComplete = true;
                                contactables.forEach(function (contactable) { return contactable.stopListening(); });
                                return [4 /*yield*/, rsf_contactable_1.shutdown()
                                    // Process data and send output
                                ]; // rsf-contactable
                            case 1:
                                _a.sent(); // rsf-contactable
                                // Process data and send output
                                output.send({
                                    results: results
                                });
                                // Deactivate
                                output.done();
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                }); };
                validResponse = function (text) {
                    return text === '1' || text === 'A' || text === 'a';
                };
                checkCompletionCondition = function () {
                    // exit when everyone has responded to everything
                    if (results.length === contactables.length * numPerPerson) {
                        complete(allCompletedText || shared_1.DEFAULT_ALL_COMPLETED_TEXT);
                    }
                };
                pairsTexts = [];
                statements.forEach(function (statement, index) {
                    for (var i = index + 1; i < statements.length; i++) {
                        var pairedStatement = statements[i];
                        // use A and 1 to try to minimize preference
                        // bias for 1 vs 2, or A vs B
                        pairsTexts.push({
                            A: statement.text,
                            1: pairedStatement.text
                        });
                    }
                });
                // The "rules" of the game should be conveyed here
                // Make sure people fully understand the process
                contactables.forEach(function (contactable) {
                    // initiate contact with the person
                    // and set context, and "rules"
                    // contactable.speak(prompt)
                    contactable.speak(shared_1.rulesText(maxTime));
                    setTimeout(function () {
                        contactable.speak(choice);
                    }, 500);
                    // send them one message per pair,
                    // awaiting their response before sending the next
                    var responseCount = 0;
                    var nextText = function () {
                        return "(" + (numPerPerson - 1 - responseCount) + " remaining)\nA) " + pairsTexts[responseCount]['A'] + "\n1) " + pairsTexts[responseCount]['1'];
                    };
                    contactable.listen(function (text) {
                        // do we still accept this response?
                        if (responseCount < numPerPerson) {
                            if (!validResponse(text)) {
                                contactable.speak(invalidResponseText || shared_1.DEFAULT_INVALID_RESPONSE_TEXT);
                                return;
                            }
                            results.push({
                                choices: pairsTexts[responseCount],
                                choice: text.toUpperCase(),
                                id: contactable.id,
                                timestamp: Date.now()
                            });
                            responseCount++;
                        }
                        // is there anything else we should say?
                        if (responseCount === numPerPerson) {
                            // remind them they've responded to everything
                            contactable.speak(maxResponsesText || shared_1.DEFAULT_MAX_RESPONSES_TEXT);
                        }
                        else {
                            // still haven't reached the end,
                            // so send the next one
                            contactable.speak(nextText());
                        }
                        // are we done?
                        checkCompletionCondition();
                    });
                    // send the first one
                    setTimeout(function () {
                        contactable.speak(nextText());
                    }, 1000);
                });
                return [2 /*return*/];
        }
    });
}); };
var getComponent = function () {
    var c = new noflo_1["default"].Component();
    /* META */
    c.description = 'Iterate through all the combinations in a list of statements getting peoples choices on them';
    c.icon = 'compress';
    /* IN PORTS */
    c.inPorts.add('choice', {
        datatype: 'string',
        description: 'a human readable string clarifying what a choice for either of any two options means',
        required: true
    });
    c.inPorts.add('statements', {
        datatype: 'array',
        description: 'the list of statements (as objects with property "text") to create all possible pairs out of, and make choices between',
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
    c.inPorts.add('all_completed_text', {
        datatype: 'string',
        description: 'msg override: the message sent to all participants when the process completes, by completion by all participants'
    });
    c.inPorts.add('invalid_response_text', {
        datatype: 'string',
        description: 'msg override: the message sent when participant use an invalid response'
    });
    c.inPorts.add('timeout_text', {
        datatype: 'string',
        description: 'msg override: the message sent to all participants when the process completes because the timeout is reached'
    });
    /* OUT PORTS */
    c.outPorts.add('results', {
        datatype: 'array'
        /*
        RESULTS:
        [Choice], array of Choice
        Choice.choices : ChoiceObject, the choices being chosen between
        ChoiceObject.A : String, the text of the choice associated with key A
        ChoiceObject.1 : String, the text of the choice associated with key 1
        Choice.choice : String, 1 or A, whichever was chosen
        Choice.id : String, the id of the contactable who chose
        Choice.timestamp : Number, the unix timestamp specifying when the choice was made
        */
    });
    c.outPorts.add('error', {
        datatype: 'all'
    });
    /* DEFINE PROCESS */
    c.process(process);
    /* return */
    return c;
};
exports.getComponent = getComponent;
