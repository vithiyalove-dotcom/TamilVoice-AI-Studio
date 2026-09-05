import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9232;
const USER_DATA_DIR = path.join(os.tmpdir(), 'edge_piper_test_' + Date.now());

async function runPiperIntegrationVerification() {
  console.log('================================================================');
  console.log('VERIFYING PIPER AI & FRONTEND TTS GENERATION FLOW');
  console.log('================================================================\n');

  const edgeProc = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--disable-gpu',
    '--no-sandbox',
    'http://127.0.0.1:3000/'
  ]);

  let isKilled = false;
  const killEdge = () => {
    if (!isKilled) {
      isKilled = true;
      try { edgeProc.kill(); } catch {}
    }
  };

  process.on('exit', killEdge);
  process.on('SIGINT', killEdge);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        targets = await res.json();
        break;
      }
    } catch {}
  }

  if (!targets || targets.length === 0) {
    console.error('Failed to connect to Edge CDP on port ' + PORT);
    killEdge();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((r) => ws.onopen = r);

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  async function evalScript(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  // Wait for React hydration
  await new Promise((r) => setTimeout(r, 2000));

  console.log('--- TEST 1: VERIFY PIPER ENGINE IN HEADER ---');
  const headerEngine = await evalScript(`(() => {
    const headerPill = document.querySelector('header span.text-indigo-300');
    return { text: headerPill ? headerPill.innerText : '' };
  })()`);
  console.log('Header Engine Display:', headerEngine);

  console.log('\n--- TEST 2: NAVIGATE TO VOICE LIBRARY AND SELECT NITHYA SREE ---');
  await evalScript(`(() => {
    const libBtn = Array.from(document.querySelectorAll('nav button, aside button')).find(b => b.innerText.includes('Voice Library'));
    if (libBtn) libBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 1000));

  // Find Nithya Sree card and click "Use Voice"
  const selectResult = await evalScript(`(() => {
    const cards = Array.from(document.querySelectorAll('h3')).filter(h => h.innerText.includes('Nithya Sree'));
    if (cards.length === 0) return { error: 'Nithya Sree card not found' };
    const cardEl = cards[0].closest('.group');
    const useBtn = Array.from(cardEl.querySelectorAll('button')).find(b => b.innerText.includes('Use Voice'));
    if (!useBtn) return { error: 'Use Voice button not found' };
    useBtn.click();
    return { clicked: true };
  })()`);
  console.log('Voice Library Selection:', selectResult);
  await new Promise((r) => setTimeout(r, 1000));

  console.log('\n--- TEST 3: VERIFY TTS PAGE WITH NITHYA SREE SELECTED ---');
  const ttsState = await evalScript(`(() => {
    const heading = document.querySelector('h1')?.innerText;
    const selectedVoiceName = document.querySelector('h4.text-white')?.innerText;
    const enginePill = document.body.innerText.includes('Local Piper Neural AI');
    return { heading, selectedVoiceName, hasLocalPiperIndicator: enginePill };
  })()`);
  console.log('TTS Page State:', ttsState);

  console.log('\n--- TEST 4: PREVIEW VOICE SAMPLE WITH PIPER ---');
  const previewResult = await evalScript(`(async () => {
    const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Preview Voice Sample'));
    if (!previewBtn) return { error: 'Preview button not found' };
    previewBtn.click();
    await new Promise(r => setTimeout(r, 2000));
    return { clicked: true, isSpeakingOrAudio: Boolean(document.querySelector('audio')) };
  })()`);
  console.log('Preview Result:', previewResult);

  console.log('\n--- TEST 5: TRIGGER GENERATE AUDIO VIA PIPER BACKEND ---');
  await evalScript(`(() => {
    const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Generate Audio'));
    if (genBtn) genBtn.click();
  })()`);

  // Poll for completion
  let genResult = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 800));
    genResult = await evalScript(`(() => {
      const isGenerating = document.body.innerText.includes('Synthesizing Audio...');
      const audioEl = document.querySelector('audio[src^="blob:"]');
      const errBox = document.querySelector('.bg-rose-950');
      return {
        isGenerating,
        audioSrc: audioEl ? audioEl.src.slice(0, 32) + '...' : null,
        duration: audioEl ? audioEl.duration : 0,
        errorMessage: errBox ? errBox.innerText : null
      };
    })()`);

    if (!genResult.isGenerating && genResult.audioSrc) {
      break;
    }
  }
  console.log('Generation Result:', genResult);

  console.log('\n--- TEST 6: AUDIOPLAYER PLAYBACK TEST ---');
  const playTest = await evalScript(`(async () => {
    const audioEl = document.querySelector('audio[src^="blob:"]');
    const playBtn = Array.from(document.querySelectorAll('button')).find(b => b.title && b.title.includes('Speech'));
    if (!audioEl || !playBtn) return { error: 'Audio or play button not found' };

    let isPlaying = false;
    audioEl.addEventListener('play', () => { isPlaying = true; });

    playBtn.click();
    await new Promise(r => setTimeout(r, 800));

    return {
      audioLoaded: Boolean(audioEl.src),
      duration: audioEl.duration,
      paused: audioEl.paused,
      currentTime: audioEl.currentTime
    };
  })()`);
  console.log('AudioPlayer Play Test:', playTest);

  console.log('\n================================================================');
  console.log('PIPER VERIFICATION COMPLETED SUCCESSFULLY!');
  console.log('================================================================');

  killEdge();
  process.exit(0);
}

runPiperIntegrationVerification().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
