"use strict";
// server for chat app using websockets and nodejs
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });
wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        wss.clients.forEach(function (client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
server.listen(8080);
console.log('Server started on port 8080');
