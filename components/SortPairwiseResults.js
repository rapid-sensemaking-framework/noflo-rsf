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
var noflo_1 = require("noflo");
var getComponent = function () {
    var c = new noflo_1["default"].Component();
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
        datatype: 'array'
    });
    c.process(function (input, output) {
        // Check preconditions on input data
        if (!input.hasData('statements', 'rankings')) {
            return;
        }
        // Read packets we need to process
        var statements = input.getData('statements');
        var rankings = input.getData('rankings');
        // Process data and send output
        var withCounts = statements.map(function (statement) {
            return __assign(__assign({}, statement), { count: rankings.filter(function (vote) { return vote.choices[vote.choice] === statement.text; }).length });
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
        // Deactivate
        output.done();
    });
    return c;
};
exports.getComponent = getComponent;
