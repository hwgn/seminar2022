import * as WebSocket from 'ws';
import * as http from 'http';
import {Message} from './types';

// websocket server

const server = http.createServer();
const wss = new WebSocket.Server({server});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  ws.on('message', (message: Message) => {
    console.log('Received websocket message => ' + message);
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss.on('close', () => console.log('Client disconnected'));

server.listen(8081, () =>
  console.log(`Websocket server started on port 8081`)
);

// http/polling server

const lastMessages: Message[] = [];

const pollingServer = http.createServer((req, res) => {
  if (req.url === '/messages') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      // return all messages after timestamp in body
      const timestamp: string = body;
      const messages = lastMessages.filter(
        (message) => Date.parse(message.timestamp) > Date.parse(timestamp)
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(messages));
    });
  } else if (req.url === '/messages/send') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const message: Message = JSON.parse(body);
      console.log('Received http message => ' + message);
      lastMessages.push(message);
      if (lastMessages.length > 100) {
        lastMessages.shift();
      }
      res.end();
    });
  } else {
    res.end();
  }
});

pollingServer.listen(8082, () =>
  console.log(`Polling server started on port 8082`)
);
