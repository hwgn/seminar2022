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
  if (req.url === '/polling') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk; // convert Buffer to string
    });
    req.on('end', () => {
      const timestamp: string = body;
      const messages = body ? lastMessages.filter(
        (message) => Date.parse(message.timestamp) > Date.parse(timestamp)
      ) : lastMessages; // return all messages if no timestamp was sent
      res.setHeader('Content-Type', 'application/json');
      if(messages.length > 0) {
        res.end(JSON.stringify(messages)); // return messages as json
      } else {
        res.end(); // no messages to return
      }
    });
  } else if (req.url === '/polling/send') {
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
      res.end(); // send 200 OK
    });
  } else {
    res.end(); // ignore other requests
  }
});

pollingServer.listen(8082, () =>
  console.log(`Polling server started on port 8082`)
);
