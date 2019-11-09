"use strict";
/*
 Built for compatibility with https://github.com/rapid-sensemaking-framework/rsf-http-register
*/
exports.__esModule = true;
var noflo_1 = require("noflo");
var socket_io_client_1 = require("socket.io-client");
var guidGenerator = function () {
    var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
var process = function (input, output) {
    // TODO set a timeout
    // Check preconditions on input data
    if (!input.hasData('socket_url', 'max_time', 'max_participants', 'process_description')) {
        return;
    }
    // Read packets we need to process
    var httpUrl = input.getData('http_url');
    var socketUrl = input.getData('socket_url');
    var maxTime = input.getData('max_time');
    var maxParticipants = parseInt(input.getData('max_participants'));
    var processDescription = input.getData('process_description');
    // create a brand new id which will be used
    // in the url address on the site, where people will register
    var id = guidGenerator();
    var socket = socket_io_client_1["default"](socketUrl);
    socket.on('connect', function () {
        socket.emit('participant_register', { id: id, maxParticipants: maxParticipants, maxTime: maxTime, processDescription: processDescription });
        output.send({
            register_url: httpUrl + "/register/" + id
        });
    });
    // single one
    socket.on('participant_register_result', function (result) {
        output.send({
            result: result
        });
    });
    // all results
    socket.on('participant_register_results', function (results) {
        output.send({
            results: results
        });
        output.done();
    });
};
var getComponent = function () {
    var c = new noflo_1["default"].Component();
    /* META */
    c.description = 'Spins up a web server to collect participant configs that are rsf-contactable compatible';
    c.icon = 'compress';
    /* IN PORTS */
    c.inPorts.add('http_url', {
        datatype: 'string',
        description: 'the http url used to determine the address for the register page',
        required: true
    });
    c.inPorts.add('socket_url', {
        datatype: 'string',
        description: 'the url with websocket protocol to connect to run this function',
        required: true
    });
    c.inPorts.add('max_time', {
        datatype: 'int',
        description: 'the number of seconds to wait until stopping this process automatically',
        required: true
    });
    c.inPorts.add('max_participants', {
        datatype: 'int',
        description: 'the number of participants to welcome to the process, default is unlimited',
        required: true
    });
    c.inPorts.add('process_description', {
        datatype: 'string',
        description: 'the text to display to potential participants explaining the process',
        required: true
    });
    /* OUT PORTS */
    c.outPorts.add('register_url', {
        datatype: 'string'
    });
    c.outPorts.add('result', {
        datatype: 'object' // ContactableConfig
    });
    c.outPorts.add('results', {
        datatype: 'array' // ContactableConfig[]
    });
    /* DEFINE PROCESS */
    c.process(process);
    /* return */
    return c;
};
exports.getComponent = getComponent;
