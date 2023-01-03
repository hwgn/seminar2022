import * as WebSocket from "ws";
import * as http from "http";
import { Message } from "./types";
import { randomUUID } from "crypto";

// websocket server

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("[WEBSOCKET] Client connected");
  ws.on("message", (message: Message) => {
    console.log(
      "[WEBSOCKET] " +
        getTimeString(message.timestamp) +
        " | " +
        message.sender +
        ": " +
        message.content
    );
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss.on("close", () => console.log("[WEBSOCKET] Client disconnected"));

server.listen(8081, () => console.log(`Websocket server started on port 8081`));

const filterMessages = (timestamp: string, messages: Message[]) => {
  return messages.filter(
    (message) => Date.parse(message.timestamp) > Date.parse(timestamp)
  );
};

const getTimeString = (dateString: string) => {
  const date = new Date(dateString);
  return date.getHours() + ":" + date.getMinutes();
};

// http/polling server

const lastPollingMessages: Message[] = [];

const pollingServer = http.createServer((req, res) => {
  if (req.url === "/polling") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      const timestamp: string = body;
      const messages = body
        ? filterMessages(timestamp, lastPollingMessages)
        : lastPollingMessages; // return all messages if no timestamp was sent
      res.setHeader("Content-Type", "application/json");
      if (messages.length > 0) {
        res.end(JSON.stringify(messages)); // return messages as json
      } else {
        res.end(JSON.stringify([])); // return empty array
      }
    });
  } else if (req.url === "/polling/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      console.log(
        "[POLLING] " +
          getTimeString(message.timestamp) +
          " | " +
          message.sender +
          ": " +
          message.content
      );
      lastPollingMessages.push(message);
      if (lastPollingMessages.length > 100) {
        lastPollingMessages.shift();
      }
      res.end(); // send 200 OK
    });
  } else {
    res.end(); // ignore other requests
  }
});

pollingServer.listen(8082, () =>
  console.log(`Polling server started on port 8082`)
);

// long polling server

const lastLongPollingMessages: Message[] = [];
const longPollingClients = new Set() as Set<http.ServerResponse>;

const longPollingServer = http.createServer((req, res) => {
  if (req.url === "/long-polling") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      const timestamp: string = body || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
      const messages = body
        ? filterMessages(timestamp, lastLongPollingMessages)
        : lastLongPollingMessages; // return all messages if no timestamp was sent

      if (messages.length > 0) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(messages)); // return messages as json
      }

      // register client
      longPollingClients.add(res);
    });
  } else if (req.url === "/long-polling/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      console.log(
        "[LONG POLLING] " +
          getTimeString(message.timestamp) +
          " | " +
          message.sender +
          ": " +
          message.content
      );
      lastLongPollingMessages.push(message);
      if (lastLongPollingMessages.length > 100) {
        lastLongPollingMessages.shift();
      }
      res.end(); // send 200 OK

      try {
        // send message to all clients
        longPollingClients.forEach((client) => {
          // reserve client by removing it from the set immediately
          longPollingClients.delete(client);

          client.setHeader("Content-Type", "application/json");
          client.end(JSON.stringify([message]));
        });
      } catch (_) {
        // Error while sending long polling message. This was likely due to a connection already having been used to send a previous message.
        // We can ignore this error, because the client will send a new request with an appropriate timestamp - the new message will be sent then.
      }
    });
  } else {
    res.end(); // ignore other requests
  }
});

longPollingServer.listen(8083, () =>
  console.log(`Long polling server started on port 8083`)
);

// streaming server

const lastStreamingMessages: Message[] = [];
const streamingClients = new Set() as Set<http.ServerResponse>;

const streamingServer = http.createServer((req, res) => {
  if (req.url === "/streaming") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      let timestamp: string = body || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
      const messages = body
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
  } else if (req.url === "/streaming/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      console.log(
        "[STREAMING] " +
          getTimeString(message.timestamp) +
          " | " +
          message.sender +
          ": " +
          message.content
      );
      lastStreamingMessages.push(message);
      if (lastStreamingMessages.length > 100) {
        lastStreamingMessages.shift();
      }
      res.end(); // send 200 OK

      // send message to all clients
      streamingClients.forEach((client) => {
        client.write(JSON.stringify([message]));
      });
    });
  } else {
    res.end(); // ignore other requests
  }
});

streamingServer.listen(8084, () =>
  console.log(`Streaming server started on port 8084`)
);

// server push server

const lastServerPushMessages: Message[] = [];
const clients: Map<string, http.ServerResponse> = new Map();

const serverPushServer = http.createServer((req, res) => {
  if (req.url === "/server-push") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      // register client
      const clientId = randomUUID();
      clients.set(clientId, res);

      // send client id to client
      res.setHeader("Content-Type", "text/plain");
      res.end(clientId);
    });
  } else if (req.url === "/server-push/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      console.log(
        "[SERVER PUSH] " +
          getTimeString(message.timestamp) +
          " | " +
          message.sender +
          ": " +
          message.content
      );
      lastServerPushMessages.push(message);
      if (lastServerPushMessages.length > 100) {
        lastServerPushMessages.shift();
      }

      // send message to all clients
      clients.forEach((res) => {
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify(message));
      });

      res.end(); // send 200 OK
    });
  } else {
    res.end(); // ignore other requests
  }
});

// serverPushServer.listen(8085, () =>
//   console.log(`Server push server started on port 8085`)
// );
