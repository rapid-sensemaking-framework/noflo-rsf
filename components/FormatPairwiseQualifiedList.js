"use strict";
exports.__esModule = true;
var noflo = require("noflo");
var shared_1 = require("../libs/shared");
var MAIN_INPUT_STRING = 'pairwise_qualifieds';
var coreLogic = function (list, anonymize) {
    return shared_1.formatPairwiseList('response', 'quality', list, anonymize);
};
exports.coreLogic = coreLogic;
var process = function (input, output) {
    if (!input.hasData(MAIN_INPUT_STRING)) {
        return;
    }
    var responses = input.getData(MAIN_INPUT_STRING);
    var anonymize = input.getData('anonymize');
    var formatted = coreLogic(responses, anonymize);
    output.send({
        formatted: formatted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo.Component();
    c.description = 'Format a list of pairwise freeform responses to a single string message';
    c.icon = 'compress';
    c.inPorts.add(MAIN_INPUT_STRING, {
        datatype: 'array',
        description: 'the list of reactions to format',
        required: true
    });
    c.inPorts.add('anonymize', {
        datatype: 'boolean',
        description: 'whether to remove the information associating responses with people'
    });
    c.outPorts.add('formatted', {
        datatype: 'string'
    });
    c.process(process);
    return c;
};
exports.getComponent = getComponent;
