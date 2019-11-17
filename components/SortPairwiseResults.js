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
exports.__esModule = true;
var noflo = require("noflo");
var process = function (input, output) {
    if (!input.hasData('statements', 'rankings')) {
        return;
    }
    var statements = input.getData('statements');
    var rankings = input.getData('rankings');
    var withCounts = statements.map(function (statement) {
        return __assign(__assign({}, statement), { count: rankings.filter(function (vote) { return vote.choices[vote.choice].text === statement.text; }).length });
    });
    var sorted = withCounts.sort(function (a, b) {
        if (a.count > b.count)
            return -1;
        else if (a.count === b.count)
            return 0;
        else if (a.count < b.count)
            return 1;
    });
    output.send({
        sorted: sorted
    });
    output.done();
};
var getComponent = function () {
    var c = new noflo.Component();
    c.description = '';
    c.icon = 'handshake-o';
    c.inPorts.add('statements', {
        datatype: 'array',
        description: 'The list of statements'
    });
    c.inPorts.add('rankings', {
        datatype: 'array',
        description: 'The list of votes'
    });
    c.outPorts.add('sorted', {
        datatype: 'array' // rsf-types/Statement[]
    });
    c.process(process);
    return c;
};
exports.getComponent = getComponent;
