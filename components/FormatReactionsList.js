"use strict";
exports.__esModule = true;
var noflo = require("noflo");
var MAIN_INPUT_STRING = 'reactions';
var coreLogic = function (reactions, anonymize) {
    return reactions.reduce(function (memo, r) {
        return memo + "\n" + r.statement.text + " : " + r.response + " : " + r.responseTrigger + (anonymize || !r.contact ? '' : " : " + r.contact.id + "@" + r.contact.type);
    }, '');
};
exports.coreLogic = coreLogic;
var process = function (input, output) {
    if (!input.hasData(MAIN_INPUT_STRING)) {
        return;
    }
    var reactions = input.getData(MAIN_INPUT_STRING);
    var anonymize = input.getData('anonymize');
    var formatted = coreLogic(reactions, anonymize);
    output.send({
        formatted: formatted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo.Component();
    c.description = 'Format a list of reactions to statements to a single string message';
    c.icon = 'compress';
    c.inPorts.add(MAIN_INPUT_STRING, {
        datatype: 'array',
        description: 'the list of reactions to format',
        required: true
    });
    c.inPorts.add('anonymize', {
        datatype: 'boolean',
        description: 'whether to remove the information associating votes with people'
    });
    c.outPorts.add('formatted', {
        datatype: 'string'
    });
    c.process(process);
    return c;
};
exports.getComponent = getComponent;
