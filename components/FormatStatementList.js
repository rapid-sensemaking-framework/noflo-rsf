"use strict";
exports.__esModule = true;
var noflo = require("noflo");
var MAIN_INPUT_STRING = 'statements';
var coreLogic = function (statements, anonymize) {
    return statements.reduce(function (memo, s) {
        return memo + "\n" + s.text + (anonymize || !s.contact ? '' : " : " + s.contact.id + "@" + s.contact.type);
    }, '');
};
exports.coreLogic = coreLogic;
var process = function (input, output) {
    if (!input.hasData(MAIN_INPUT_STRING)) {
        return;
    }
    var statements = input.getData(MAIN_INPUT_STRING);
    var anonymize = input.getData('anonymize');
    var formatted = coreLogic(statements, anonymize);
    output.send({
        formatted: formatted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo.Component();
    /* META */
    c.description = 'Format a list of statements into a single string message, separated to new lines';
    c.icon = 'compress';
    /* IN PORTS */
    c.inPorts.add(MAIN_INPUT_STRING, {
        datatype: 'array',
        description: 'the list of statements to format',
        required: true
    });
    c.inPorts.add('anonymize', {
        datatype: 'boolean',
        description: 'whether to remove the information associating statements with people'
    });
    /* OUT PORTS */
    c.outPorts.add('formatted', {
        datatype: 'string'
    });
    /* DEFINE PROCESS */
    c.process(process);
    /* return */
    return c;
};
exports.getComponent = getComponent;
