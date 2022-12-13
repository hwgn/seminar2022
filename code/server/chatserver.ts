import * as WebSocket from 'ws';
import * as http from 'http';
import {Message} from './types';

// websocket server

const server = http.createServer();
const wss = new WebSocket.Server({server});

wss.on('connection', (ws: WebSocket) => {
  console.log('[WEBSOCKET] Client connected');
  ws.on('message', (message: Message) => {
    console.log('[WEBSOCKET] ' +  getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss.on('close', () => console.log('[WEBSOCKET] Client disconnected'));

server.listen(8081, () =>
  console.log(`Websocket server started on port 8081`)
);

const filterMessages = (timestamp: string, messages: Message[]) => {
  return messages.filter(
    (message) => Date.parse(message.timestamp) > Date.parse(timestamp)
  );
};

const getTimeString = (dateString: string) => {
  const date = new Date(dateString);
  return date.getHours() + ':' + date.getMinutes();
};

// http/polling server

const lastPollingMessages: Message[] = [];

const pollingServer = http.createServer((req, res) => {
  if (req.url === '/polling') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on('end', () => {
      const timestamp: string = body;
      const messages = body ? filterMessages(timestamp, lastPollingMessages) : lastPollingMessages; // return all messages if no timestamp was sent
      res.setHeader('Content-Type', 'application/json');
      if(messages.length > 0) {
        res.end(JSON.stringify(messages)); // return messages as json
      } else {
        res.end(JSON.stringify([])); // return empty array
      }
    });
  } else if (req.url === '/polling/send') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const message: Message = JSON.parse(body);
      console.log('[POLLING] ' +  getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
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

const longPollingServer = http.createServer((req, res) => {
  if (req.url === '/long-polling') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on('end', () => {
      const timestamp: string = body || new Date().toISOString(); // we need the timestamp later to wait for new messages, so we use the current timestamp if no timestamp was sent
      const messages = body ? filterMessages(timestamp, lastLongPollingMessages) : lastLongPollingMessages; // return all messages if no timestamp was sent
      
      if(messages.length > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(messages)); // return messages as json
      } else {
        // wait for new messages
        const interval = setInterval(() => {
          if(filterMessages(timestamp, lastLongPollingMessages).length > 0) {
            clearInterval(interval);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(filterMessages(timestamp, lastLongPollingMessages))); // return messages as json
          }
        }, 1000);
      }
    });
  } else if (req.url === '/long-polling/send') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const message: Message = JSON.parse(body);
      console.log('[LONG POLLING] ' +  getTimeString(message.timestamp) + ' | ' + message.sender + ': ' + message.content);
      lastLongPollingMessages.push(message);
      if (lastLongPollingMessages.length > 100) {
        lastLongPollingMessages.shift();
      }
      res.end(); // send 200 OK
    });
  } else {
    res.end(); // ignore other requests
  }
});

longPollingServer.listen(8083, () =>
  console.log(`Long polling server started on port 8083`)
);