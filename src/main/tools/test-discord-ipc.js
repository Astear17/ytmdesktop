const net = require('net');

function sendBuffer(socket, op, obj) {
  const json = JSON.stringify(obj);
  const len = Buffer.byteLength(json);
  const buf = Buffer.alloc(8 + len);
  buf.writeInt32LE(op, 0);
  buf.writeInt32LE(len, 4);
  buf.write(json, 8, len);
  socket.write(buf);
}

async function tryConnect(id) {
  return new Promise((resolve) => {
    const ipcPath = `\\\\?\\pipe\\discord-ipc-${id}`; // Windows named pipe path
    const socket = net.createConnection(ipcPath);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ id, ok: false, reason: 'timeout' });
    }, 2500);

    socket.on('connect', () => {
      clearTimeout(timeout);
      try {
        sendBuffer(socket, 0, { v: 1, client_id: '1143202598460076053' });
      } catch (e) {}
      socket.on('data', (buffer) => {
        try {
          const op = buffer.readInt32LE(0);
          const length = buffer.readInt32LE(4);
          const json = JSON.parse(buffer.toString('utf8', 8, 8 + length));
          socket.destroy();
          resolve({ id, ok: true, op, json });
        } catch (e) {
          socket.destroy();
          resolve({ id, ok: true, note: 'invalid-json' });
        }
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      resolve({ id, ok: false, reason: err.message });
    });
  });
}

(async () => {
  console.log('Testing Discord IPC named pipes (0..9)');
  for (let i = 0; i < 10; i++) {
    // eslint-disable-next-line no-await-in-loop
    const r = await tryConnect(i);
    console.log(JSON.stringify(r));
    if (r.ok) break;
  }
  process.exit(0);
})();
