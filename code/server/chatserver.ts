// server for chat app using websockets and nodejs

import * as WebSocket from 'ws';
import * as http from 'http';
import { Message } from './types';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (message: Message) => {
        wss.clients.forEach((client: WebSocket) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

server.listen(8080);

console.log('Server started on port 8080');

