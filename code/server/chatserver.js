"use strict";
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
// websocket server
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
    console.log('[WEBSOCKET] Client connected');
    ws.on('message', function (message) {
        console.log('[WEBSOCKET] ' + getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
        wss.emit('message', message);
        // wss.clients.forEach((client: WebSocket) => {
        //   if (client !== ws && client.readyState === WebSocket.OPEN) {
        //     client.send(message);
        //   }
        // });
    });
});
wss.on('close', function () { return console.log('[WEBSOCKET] Client disconnected'); });
server.listen(8081, function () {
    return console.log("Websocket server started on port 8081");
});
var filterMessages = function (timestamp, messages) {
    return messages.filter(function (message) { return Date.parse(message.timestamp) > Date.parse(timestamp); });
};
var getTimeString = function (dateString) {
    var date = new Date(dateString);
    return date.getHours() + ':' + date.getMinutes();
};
// http/polling server
var lastPollingMessages = [];
var pollingServer = http.createServer(function (req, res) {
    if (req.url === '/polling') {
        var body_1 = '';
        req.on('data', function (chunk) {
            body_1 += chunk; // convert Buffer to string
        });
        req.on('end', function () {
            var timestamp = body_1;
            var messages = body_1 ? filterMessages(timestamp, lastPollingMessages) : lastPollingMessages; // return all messages if no timestamp was sent
            res.setHeader('Content-Type', 'application/json');
            if (messages.length > 0) {
                res.end(JSON.stringify(messages)); // return messages as json
            }
            else {
                res.end(JSON.stringify([])); // return empty array
            }
        });
    }
    else if (req.url === '/polling/send') {
        var body_2 = '';
        req.on('data', function (chunk) {
            body_2 += chunk;
        });
        req.on('end', function () {
            var message = JSON.parse(body_2);
            console.log('[POLLING] ' + getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
            lastPollingMessages.push(message);
            if (lastPollingMessages.length > 100) {
                lastPollingMessages.shift();
            }
            res.end(); // send 200 OK
        });
    }
    else {
        res.end(); // ignore other requests
    }
});
pollingServer.listen(8082, function () {
    return console.log("Polling server started on port 8082");
});
// long polling server
var lastLongPollingMessages = [];
var longPollingServer = http.createServer(function (req, res) {
    if (req.url === '/long-polling') {
        var body_3 = '';
        req.on('data', function (chunk) {
            body_3 += chunk; // convert Buffer to string
        });
        req.on('end', function () {
            var timestamp = body_3 || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
            var messages = body_3 ? filterMessages(timestamp, lastLongPollingMessages) : lastLongPollingMessages; // return all messages if no timestamp was sent
            if (messages.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(messages)); // return messages as json
            }
            else {
                // wait for new messages
                var interval_1 = setInterval(function () {
                    if (filterMessages(timestamp, lastLongPollingMessages).length > 0) {
                        clearInterval(interval_1);
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(filterMessages(timestamp, lastLongPollingMessages))); // return messages as json
                    }
                }, 1000);
            }
        });
    }
    else if (req.url === '/long-polling/send') {
        var body_4 = '';
        req.on('data', function (chunk) {
            body_4 += chunk;
        });
        req.on('end', function () {
            var message = JSON.parse(body_4);
            console.log('[LONG POLLING] ' + getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
            lastLongPollingMessages.push(message);
            if (lastLongPollingMessages.length > 100) {
                lastLongPollingMessages.shift();
            }
            res.end(); // send 200 OK
        });
    }
    else {
        res.end(); // ignore other requests
    }
});
longPollingServer.listen(8083, function () {
    return console.log("Long polling server started on port 8083");
});
