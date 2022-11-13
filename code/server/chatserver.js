"use strict";
// server for chat app using websockets and nodejs
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
    console.log('Client connected');
    ws.on('message', function (message) {
        console.log('Received message => ' + message);
        wss.clients.forEach(function (client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
wss.on('close', function () { return console.log('Client disconnected'); });
server.listen(8081);
console.log('Server started on port 8081');
