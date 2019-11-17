"use strict";
exports.__esModule = true;
var noflo = require("noflo");
var process = function (input, output) {
    if (!input.hasData('reactions')) {
        return;
    }
    var reactions = input.getData('reactions');
    var anonymize = input.getData('anonymize');
    var formatted = reactions.reduce(function (memo, r) {
        return memo + "\n" + r.statement.text + " : " + r.response + (anonymize ? '' : " : " + r.id);
    }, '');
    output.send({
        formatted: formatted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo.Component();
    c.description = 'Format a list of reactions to statements to a single string message';
    c.icon = 'compress';
    c.inPorts.add('reactions', {
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
