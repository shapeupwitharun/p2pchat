// Stateless relay: forwards small JSON messages between two online users. Stores nothing.
const { WebSocketServer } = require('ws');
const http = require('http');
const srv = http.createServer((q, r) => r.end('ok'));
const wss = new WebSocketServer({ server: srv });
const peers = new Map();
wss.on('connection', (ws, req) => {
  const id = new URL(req.url, 'http://x').searchParams.get('id');
  if (!id) return ws.close();
  peers.set(id, ws);
  ws.on('message', d => {
    let m; try { m = JSON.parse(d); } catch { return; }
    const t = peers.get(m.to);
    if (t && t.readyState === 1) { m.from = id; t.send(JSON.stringify(m)); }
    else ws.send(JSON.stringify({ type: 'offline', from: m.to }));
  });
  ws.on('close', () => { if (peers.get(id) === ws) peers.delete(id); });
});
srv.listen(process.env.PORT || 8080);
