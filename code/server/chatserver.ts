import * as WebSocket from "ws";
import * as http from "http";
import { Message } from "./types";

// helpers

const filterMessages = (timestamp: string, messages: Message[]) => {
  if (!timestamp) return messages; // return all messages if no timestamp was sent
  return messages.filter(
    (message) => Date.parse(message.timestamp) > Date.parse(timestamp)
  );
};

const getTimeString = (dateString: string) => {
  const date = new Date(dateString);
  return date.getHours() + ":" + date.getMinutes();
};

const logMessage = (message: Message, type: string) => {
  console.log(
    `[${type}] ${getTimeString(message.timestamp)} | ` +
      `${message.sender}: ${message.content.replace(/\n+/, " ")}`
  );
};

// http/polling server

const lastPollingMessages: Message[] = [];

const pollingServer = http.createServer((req, res) => {
  if (req.url === "/polling") {
    // we get a Buffer that contains our timestamp
    let timestamp = "";
    req.on("data", (chunk) => {
      timestamp += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify([...filterMessages(timestamp, lastPollingMessages)])
      ); // return messages as json
    });
  } else if (req.url === "/polling/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      logMessage(message, "POLLING");
      lastPollingMessages.push(message);
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
    let timestamp = "";
    req.on("data", (chunk) => {
      timestamp += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      const messages = [...filterMessages(timestamp, lastLongPollingMessages)];

      if (messages.length > 0) {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(messages));
      } else {
        longPollingClients.add(res); // register client
      }
    });
  } else if (req.url === "/long-polling/send") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const message: Message = JSON.parse(body);
      logMessage(message, "LONG POLLING");
      lastLongPollingMessages.push(message);
      res.end(); // send 200 OK

      // send message to all clients
      longPollingClients.forEach((client) => {
        try {
          // reserve client by removing it from the set immediately
          longPollingClients.delete(client);

          client.setHeader("Content-Type", "application/json");
          client.end(JSON.stringify([message]));
        } catch (_) {
          // ignore errors
        }
      });
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
    let timestamp = "";
    req.on("data", (chunk) => {
      timestamp += chunk; // convert Buffer to string
    });
    req.on("end", () => {
      const messages = [...filterMessages(timestamp, lastLongPollingMessages)];

      res.setHeader("Content-Type", "application/json");

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
      logMessage(message, "STREAMING");
      lastStreamingMessages.push(message);
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

// websocket server

const websocketServer = http.createServer();
const wss = new WebSocket.Server({ server: websocketServer });

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (message: Message) => {
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) client.send(message);
    });
  });
});

websocketServer.listen(8081, () =>
  console.log(`Websocket server started on port 8081`)
);

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
