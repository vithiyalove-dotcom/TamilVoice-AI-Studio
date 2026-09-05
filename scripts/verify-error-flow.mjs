import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9233;
const USER_DATA_DIR = path.join(os.tmpdir(), 'edge_error_test_' + Date.now());

async function runErrorFlowTest() {
  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    'http://127.0.0.1:3000/'
  ]);

  let isKilled = false;
  const killEdge = () => { if (!isKilled) { isKilled = true; try { edgeProc.kill(); } catch {} } };
  process.on('exit', killEdge);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page') || targets[0];
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => ws.onopen = r);

        let msgId = 1;
        const pending = new Map();
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          if (d.id && pending.has(d.id)) {
            pending.get(d.id).resolve(d.result);
            pending.delete(d.id);
          }
        };

        const exec = (expression) => new Promise((resolve, reject) => {
          const id = msgId++;
          pending.set(id, { resolve, reject });
          ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
        });

        await new Promise((r) => setTimeout(r, 2000));

        // Navigate to TTS page (Arun Kumar is the default male voice)
        await exec(`(() => {
          const ttsBtn = Array.from(document.querySelectorAll('nav button, aside button')).find(b => b.innerText.includes('Text to Speech'));
          if (ttsBtn) ttsBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 1000));

        // Click Generate Audio on Arun Kumar
        await exec(`(() => {
          const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Generate Audio'));
          if (genBtn) genBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 2000));

        // Inspect UI error alert
        const errorResult = await exec(`(() => {
          const errBox = document.querySelector('.bg-rose-950');
          return {
            hasErrorBox: Boolean(errBox),
            errorText: errBox ? errBox.innerText : null
          };
        })()`);

        console.log('UI Error Handling Verification:', errorResult.value);

        killEdge();
        process.exit(0);
      }
    } catch {}
  }
}
runErrorFlowTest().catch(console.error);
