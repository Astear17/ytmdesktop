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

async function tryConnectAndSetActivity(id) {
  return new Promise((resolve) => {
    const ipcPath = `\\\\?\\pipe\\discord-ipc-${id}`;
    const socket = net.createConnection(ipcPath);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ id, ok: false, reason: 'timeout' });
    }, 5000);

    socket.on('connect', () => {
      try {
        sendBuffer(socket, 0, { v: 1, client_id: '1143202598460076053' });
      } catch (e) {}
      socket.on('data', (buffer) => {
        try {
          const op = buffer.readInt32LE(0);
          const length = buffer.readInt32LE(4);
          const json = JSON.parse(buffer.toString('utf8', 8, 8 + length));
          // After READY, send SET_ACTIVITY
          if (json && json.cmd === 'DISPATCH' && json.data && json.data.v) {
            // send SET_ACTIVITY
            const activity = {
              type: 2,
              status_display_type: 1,
              details: 'Test Song',
              state: 'Artist',
              instance: false
            };
            sendBuffer(socket, 1, { cmd: 'SET_ACTIVITY', args: { pid: process.pid, activity }, nonce: 'testnonce' });
            // wait for potential response, then resolve
            setTimeout(() => {
              socket.destroy();
              clearTimeout(timeout);
              resolve({ id, ok: true, note: 'sent-activity' });
            }, 1500);
          }
        } catch (e) {
          // ignore
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
  console.log('Testing SET_ACTIVITY on Discord IPC (0..9)');
  for (let i = 0; i < 10; i++) {
    // eslint-disable-next-line no-await-in-loop
    const r = await tryConnectAndSetActivity(i);
    console.log(JSON.stringify(r));
    if (r.ok) break;
  }
  process.exit(0);
})();
