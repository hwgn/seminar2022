// server for chat app using websockets and nodejs

import * as WebSocket from 'ws';
import * as http from 'http';
import {Message} from './types';

const server = http.createServer();
const wss = new WebSocket.Server({server});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  ws.on('message', (message: Message) => {
    console.log('Received message => ' + message);
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

wss.on('close', () => console.log('Client disconnected'));


server.listen(8081);

console.log('Server started on port 8081');

