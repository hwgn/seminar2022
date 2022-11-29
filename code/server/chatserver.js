"use strict";
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
// websocket server
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
    console.log('Client connected');
    ws.on('message', function (message) {
        console.log('Received websocket message => ' + message);
        wss.clients.forEach(function (client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
wss.on('close', function () { return console.log('Client disconnected'); });
server.listen(8081, function () {
    return console.log("Websocket server started on port 8081");
});
// http/polling server
var lastMessages = [];
var pollingServer = http.createServer(function (req, res) {
    if (req.url === '/messages') {
        var body_1 = '';
        req.on('data', function (chunk) {
            body_1 += chunk;
        });
        req.on('end', function () {
            // return all messages after timestamp in body
            var timestamp = body_1;
            var messages = lastMessages.filter(function (message) { return Date.parse(message.timestamp) > Date.parse(timestamp); });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(messages));
        });
    }
    else if (req.url === '/messages/send') {
        var body_2 = '';
        req.on('data', function (chunk) {
            body_2 += chunk;
        });
        req.on('end', function () {
            var message = JSON.parse(body_2);
            console.log('Received http message => ' + message);
            lastMessages.push(message);
            if (lastMessages.length > 100) {
                lastMessages.shift();
            }
            res.end();
        });
    }
    else {
        res.end();
    }
});
pollingServer.listen(8082, function () {
    return console.log("Polling server started on port 8082");
});