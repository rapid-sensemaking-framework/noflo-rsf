"use strict";
exports.__esModule = true;
var noflo_1 = require("noflo");
var process = function (input, output) {
    // Check preconditions on input data
    if (!input.hasData('statements')) {
        return;
    }
    // Read packets we need to process
    var statements = input.getData('statements');
    var formatted = statements.reduce(function (memo, s) {
        return memo + "\n" + s.text;
    }, '');
    output.send({
        formatted: formatted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo_1["default"].Component();
    /* META */
    c.description = 'Format a list of statements into a single string message, separated to new lines';
    c.icon = 'compress';
    /* IN PORTS */
    c.inPorts.add('statements', {
        datatype: 'array',
        description: 'the list of statements to format',
        required: true
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
