"use strict";
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
var crypto_1 = require("crypto");
// websocket server
var server = http.createServer();
var wss = new WebSocket.Server({ server: server });
wss.on("connection", function (ws) {
    console.log("[WEBSOCKET] Client connected");
    ws.on("message", function (message) {
        console.log("[WEBSOCKET] " +
            getTimeString(message.timestamp) +
            " | " +
            message.sender +
            ": " +
            message.content);
        wss.clients.forEach(function (client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});
wss.on("close", function () { return console.log("[WEBSOCKET] Client disconnected"); });
server.listen(8081, function () { return console.log("Websocket server started on port 8081"); });
var filterMessages = function (timestamp, messages) {
    return messages.filter(function (message) { return Date.parse(message.timestamp) > Date.parse(timestamp); });
};
var getTimeString = function (dateString) {
    var date = new Date(dateString);
    return date.getHours() + ":" + date.getMinutes();
};
// http/polling server
var lastPollingMessages = [];
var pollingServer = http.createServer(function (req, res) {
    if (req.url === "/polling") {
        var body_1 = "";
        req.on("data", function (chunk) {
            body_1 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            var timestamp = body_1;
            var messages = body_1
                ? filterMessages(timestamp, lastPollingMessages)
                : lastPollingMessages; // return all messages if no timestamp was sent
            res.setHeader("Content-Type", "application/json");
            if (messages.length > 0) {
                res.end(JSON.stringify(messages)); // return messages as json
            }
            else {
                res.end(JSON.stringify([])); // return empty array
            }
        });
    }
    else if (req.url === "/polling/send") {
        var body_2 = "";
        req.on("data", function (chunk) {
            body_2 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_2);
            console.log("[POLLING] " +
                getTimeString(message.timestamp) +
                " | " +
                message.sender +
                ": " +
                message.content);
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
var longPollingClients = new Set();
var longPollingServer = http.createServer(function (req, res) {
    if (req.url === "/long-polling") {
        var body_3 = "";
        req.on("data", function (chunk) {
            body_3 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            var timestamp = body_3 || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
            var messages = body_3
                ? filterMessages(timestamp, lastLongPollingMessages)
                : lastLongPollingMessages; // return all messages if no timestamp was sent
            if (messages.length > 0) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(messages)); // return messages as json
            }
            // register client
            longPollingClients.add(res);
        });
    }
    else if (req.url === "/long-polling/send") {
        var body_4 = "";
        req.on("data", function (chunk) {
            body_4 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_4);
            console.log("[LONG POLLING] " +
                getTimeString(message.timestamp) +
                " | " +
                message.sender +
                ": " +
                message.content);
            lastLongPollingMessages.push(message);
            if (lastLongPollingMessages.length > 100) {
                lastLongPollingMessages.shift();
            }
            res.end(); // send 200 OK
            try {
                // send message to all clients
                longPollingClients.forEach(function (client) {
                    // reserve client by removing it from the set immediately
                    longPollingClients["delete"](client);
                    client.setHeader("Content-Type", "application/json");
                    client.end(JSON.stringify([message]));
                });
            }
            catch (e) {
                console.log("Error while sending long polling message. This was likely due to a connection already having been used to send a previous message.");
            }
        });
    }
    else {
        res.end(); // ignore other requests
    }
});
longPollingServer.listen(8083, function () {
    return console.log("Long polling server started on port 8083");
});
// streaming server
var lastStreamingMessages = [];
var streamingClients = new Set();
var streamingServer = http.createServer(function (req, res) {
    if (req.url === "/streaming") {
        var body_5 = "";
        req.on("data", function (chunk) {
            body_5 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            var timestamp = body_5 || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
            var messages = body_5
                ? filterMessages(timestamp, lastStreamingMessages)
                : lastStreamingMessages; // return all messages if no timestamp was sent
            res.setHeader("Content-Type", "text/event-stream");
            // return all avaialble messages, but keep the connection open
            if (messages.length > 0) {
                res.write(JSON.stringify(messages));
            }
            // register client
            streamingClients.add(res);
        });
    }
    else if (req.url === "/streaming/send") {
        var body_6 = "";
        req.on("data", function (chunk) {
            body_6 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_6);
            console.log("[STREAMING] " +
                getTimeString(message.timestamp) +
                " | " +
                message.sender +
                ": " +
                message.content);
            lastStreamingMessages.push(message);
            if (lastStreamingMessages.length > 100) {
                lastStreamingMessages.shift();
            }
            res.end(); // send 200 OK
            // send message to all clients
            streamingClients.forEach(function (client) {
                client.write(JSON.stringify([message]));
            });
        });
    }
    else {
        res.end(); // ignore other requests
    }
});
streamingServer.listen(8084, function () {
    return console.log("Streaming server started on port 8084");
});
// server push server
var lastServerPushMessages = [];
var clients = new Map();
var serverPushServer = http.createServer(function (req, res) {
    if (req.url === "/server-push") {
        var body_7 = "";
        req.on("data", function (chunk) {
            body_7 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            // register client
            var clientId = (0, crypto_1.randomUUID)();
            clients.set(clientId, res);
            // send client id to client
            res.setHeader("Content-Type", "text/plain");
            res.end(clientId);
        });
    }
    else if (req.url === "/server-push/send") {
        var body_8 = "";
        req.on("data", function (chunk) {
            body_8 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_8);
            console.log("[SERVER PUSH] " +
                getTimeString(message.timestamp) +
                " | " +
                message.sender +
                ": " +
                message.content);
            lastServerPushMessages.push(message);
            if (lastServerPushMessages.length > 100) {
                lastServerPushMessages.shift();
            }
            // send message to all clients
            clients.forEach(function (res) {
                res.setHeader("Content-Type", "application/json");
                res.write(JSON.stringify(message));
            });
            res.end(); // send 200 OK
        });
    }
    else {
        res.end(); // ignore other requests
    }
});
serverPushServer.listen(8085, function () {
    return console.log("Server push server started on port 8085");
});
