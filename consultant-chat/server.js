// Echo server from the task statement: run with `node server.js` (port 8081).
// Replies after 300ms and drops the connection every ~30s.
// WS_PORT is an escape hatch for when 8081 is already taken.
const { WebSocketServer } = require('ws'); // npm i ws
const wss = new WebSocketServer({ port: Number(process.env.WS_PORT) || 8081 });
wss.on('connection', (ws) => {
  ws.on('message', (m) => setTimeout(() => ws.readyState === 1 && ws.send(m.toString()), 300));
  setTimeout(() => ws.terminate(), 25000 + Math.random() * 10000);
});
