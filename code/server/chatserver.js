"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var WebSocket = require("ws");
var http = require("http");
// helpers
var filterMessages = function (timestamp, messages) {
    if (!timestamp)
        return messages; // return all messages if no timestamp was sent
    return messages.filter(function (message) { return Date.parse(message.timestamp) > Date.parse(timestamp); });
};
var getTimeString = function (dateString) {
    var date = new Date(dateString);
    return date.getHours() + ":" + date.getMinutes();
};
var logMessage = function (message, type) {
    console.log("[".concat(type, "] ").concat(getTimeString(message.timestamp), " | ") +
        "".concat(message.sender, ": ").concat(message.content.replace(/\n+/, " ")));
};
// http/polling server
var lastPollingMessages = [];
var pollingServer = http.createServer(function (req, res) {
    if (req.url === "/polling") {
        // we get a Buffer that contains our timestamp
        var timestamp_1 = "";
        req.on("data", function (chunk) {
            timestamp_1 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(__spreadArray([], filterMessages(timestamp_1, lastPollingMessages), true))); // return messages as json
        });
    }
    else if (req.url === "/polling/send") {
        var body_1 = "";
        req.on("data", function (chunk) {
            body_1 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_1);
            logMessage(message, "POLLING");
            lastPollingMessages.push(message);
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
        var timestamp_2 = "";
        req.on("data", function (chunk) {
            timestamp_2 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            var messages = __spreadArray([], filterMessages(timestamp_2, lastLongPollingMessages), true);
            if (messages.length > 0) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(messages));
            }
            else {
                longPollingClients.add(res); // register client
            }
        });
    }
    else if (req.url === "/long-polling/send") {
        var body_2 = "";
        req.on("data", function (chunk) {
            body_2 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_2);
            logMessage(message, "LONG POLLING");
            lastLongPollingMessages.push(message);
            res.end(); // send 200 OK
            // send message to all clients
            longPollingClients.forEach(function (client) {
                try {
                    // reserve client by removing it from the set immediately
                    longPollingClients["delete"](client);
                    client.setHeader("Content-Type", "application/json");
                    client.end(JSON.stringify([message]));
                }
                catch (_) {
                    // ignore errors
                }
            });
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
        var timestamp_3 = "";
        req.on("data", function (chunk) {
            timestamp_3 += chunk; // convert Buffer to string
        });
        req.on("end", function () {
            var messages = __spreadArray([], filterMessages(timestamp_3, lastLongPollingMessages), true);
            res.setHeader("Content-Type", "application/json");
            // return all avaialble messages, but keep the connection open
            if (messages.length > 0) {
                res.write(JSON.stringify(messages));
            }
            // register client
            streamingClients.add(res);
        });
    }
    else if (req.url === "/streaming/send") {
        var body_3 = "";
        req.on("data", function (chunk) {
            body_3 += chunk;
        });
        req.on("end", function () {
            var message = JSON.parse(body_3);
            logMessage(message, "STREAMING");
            lastStreamingMessages.push(message);
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
// websocket server
var websocketServer = http.createServer();
var wss = new WebSocket.Server({ server: websocketServer });
wss.on("connection", function (ws) {
    ws.on("message", function (message) {
        wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN)
                client.send(message);
        });
    });
});
websocketServer.listen(8081, function () {
    return console.log("Websocket server started on port 8081");
});
// server push server
/*
const lastServerPushMessages: Message[] = [];
const serverPushClients = new Set() as Set<http.ServerResponse>;

const serverPushServer = http.createServer((req, res) => {
  if (req.url === "/server-push") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      // register client
      serverPushClients.add(res);
      res.end();
    });
  } else if (req.url === "/server-push/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      logMessage(message, "SERVER PUSH");
      lastServerPushMessages.push(message);

      // send message to all clients
      serverPushClients.forEach((res) => {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
      });

      res.end(); // send 200 OK
    });
  } else {
    res.end(); // ignore other requests
  }
});

serverPushServer.listen(8085, () =>
  console.log(`Server push server started on port 8085`)
);

*/
