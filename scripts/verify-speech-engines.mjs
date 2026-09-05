import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9229;
const USER_DATA_DIR = path.join(os.tmpdir(), 'edge_speech_test_' + Date.now());

async function runSpeechVerification() {
  console.log('================================================================');
  console.log('STARTING TAMILVOICE-AI-STUDIO SPEECH ENGINE VERIFICATION');
  console.log('================================================================');

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
    console.error('Failed to connect to Edge CDP.');
    killEdge();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pendingRequests = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const resolver = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      resolver(data.result);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      if (data.params.type === 'error') {
        const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
        consoleErrors.push(text);
      }
    }
  };

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Console.enable');

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  };

  // Wait for React to load
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Inspect System Voices detected by browser
  console.log('\n--- 1. SYSTEM VOICE DISCOVERY ---');
  const systemVoiceData = await evaluate(`(() => {
    const vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return {
      total: vs.length,
      voices: vs.map(v => ({ name: v.name, lang: v.lang }))
    };
  })()`);
  console.log(`Detected ${systemVoiceData.total} system voices in browser:`);
  systemVoiceData.voices.slice(0, 8).forEach(v => console.log(`  • [${v.lang}] ${v.name}`));
  if (systemVoiceData.total > 8) console.log(`  ... and ${systemVoiceData.total - 8} more`);

  // Navigate to Voice Library
  console.log('\n--- 2. TESTING VOICE LIBRARY CARDS & MAPPINGS ---');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('aside nav button')).find(b => b.innerText.includes('Voice Library'));
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  // Test Test Case A: Tamil Male (Arun Kumar)
  console.log('\n[TEST A] TAMIL MALE VOICE: Arun Kumar');
  const tamilMaleTest = await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('.group.relative.rounded-2xl'));
    const arunCard = cards.find(c => c.innerText.includes('Arun Kumar'));
    const systemVoiceText = arunCard ? arunCard.innerText : '';
    const previewBtn = arunCard ? Array.from(arunCard.querySelectorAll('button')).find(b => b.innerText.includes('Preview')) : null;
    if (previewBtn) previewBtn.click();
    return {
      found: !!arunCard,
      cardText: systemVoiceText.slice(0, 300),
      speaking: window.speechSynthesis.speaking
    };
  })()`);
  console.log('Arun Kumar Card Inspection:');
  console.log('  Speaking triggered:', tamilMaleTest.speaking);

  // Test Test Case B: Tamil Female (Nithya Sree)
  console.log('\n[TEST B] TAMIL FEMALE VOICE: Nithya Sree');
  const tamilFemaleTest = await evaluate(`(() => {
    try {
      window.speechSynthesis.cancel();
      const cards = Array.from(document.querySelectorAll('.group.relative.rounded-2xl'));
      const nithyaCard = cards.find(c => c.innerText.includes('Nithya Sree'));
      const text = nithyaCard ? nithyaCard.innerText : '';
      const previewBtn = nithyaCard ? Array.from(nithyaCard.querySelectorAll('button')).find(b => b.innerText.includes('Preview')) : null;
      if (previewBtn) previewBtn.click();
      return {
        found: !!nithyaCard,
        hasWarningMessage: text.includes('No Tamil female system voice is currently installed'),
        detectedSystemVoice: text.includes('System Voice:') ? text.split('System Voice:')[1].split('\\n')[0].trim() : 'Not found',
        speaking: window.speechSynthesis.speaking
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('Nithya Sree Card Inspection:', tamilFemaleTest);

  // Test Test Case C: English Male (Alexander Ross)
  console.log('\n[TEST C] ENGLISH MALE VOICE: Alexander Ross');
  const englishMaleTest = await evaluate(`(() => {
    try {
      window.speechSynthesis.cancel();
      const cards = Array.from(document.querySelectorAll('.group.relative.rounded-2xl'));
      const alexCard = cards.find(c => c.innerText.includes('Alexander Ross'));
      const text = alexCard ? alexCard.innerText : '';
      const previewBtn = alexCard ? Array.from(alexCard.querySelectorAll('button')).find(b => b.innerText.includes('Preview')) : null;
      if (previewBtn) previewBtn.click();
      return {
        found: !!alexCard,
        detectedSystemVoice: text.includes('System Voice:') ? text.split('System Voice:')[1].split('\\n')[0].trim() : 'Not found',
        speaking: window.speechSynthesis.speaking
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('Alexander Ross Card Inspection:', englishMaleTest);

  // Test Test Case D: English Female (Seraphina Claire)
  console.log('\n[TEST D] ENGLISH FEMALE VOICE: Seraphina Claire');
  const englishFemaleTest = await evaluate(`(() => {
    try {
      window.speechSynthesis.cancel();
      const cards = Array.from(document.querySelectorAll('.group.relative.rounded-2xl'));
      const seraCard = cards.find(c => c.innerText.includes('Seraphina Claire'));
      const text = seraCard ? seraCard.innerText : '';
      const previewBtn = seraCard ? Array.from(seraCard.querySelectorAll('button')).find(b => b.innerText.includes('Preview')) : null;
      if (previewBtn) previewBtn.click();
      return {
        found: !!seraCard,
        detectedSystemVoice: text.includes('System Voice:') ? text.split('System Voice:')[1].split('\\n')[0].trim() : 'Not found',
        speaking: window.speechSynthesis.speaking
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('Seraphina Claire Card Inspection:', englishFemaleTest);

  // Test "Use Voice" interaction (Req 12)
  console.log('\n--- 3. TESTING "USE VOICE" NAVIGATION & STATE (REQ 12) ---');
  await evaluate(`(() => {
    try {
      window.speechSynthesis.cancel();
      const cards = Array.from(document.querySelectorAll('.group.relative.rounded-2xl'));
      const nithyaCard = cards.find(c => c.innerText.includes('Nithya Sree'));
      const useBtn = nithyaCard ? Array.from(nithyaCard.querySelectorAll('button')).find(b => b.innerText.includes('Use Voice')) : null;
      if (useBtn) useBtn.click();
    } catch (e) {}
  })()`);
  await new Promise((r) => setTimeout(r, 1000));

  const ttsSelectedCheck = await evaluate(`(() => {
    try {
      const h1 = document.querySelector('header h1')?.innerText || '';
      const body = document.body.innerText || '';
      return {
        onTtsPage: h1.includes('Text to Speech'),
        hasNithyaSelected: body.includes('Nithya Sree'),
        hasFemaleGender: body.includes('female') || body.includes('Female'),
        showsWarningInTts: body.includes('No Tamil female system voice is currently installed'),
        mappedSystemVoice: body.includes('Mapped System Voice:') ? body.split('Mapped System Voice:')[1].split('\\n')[0].trim() : 'Not found',
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('TTS Page After "Use Voice":', ttsSelectedCheck);

  // Test Speech Generation in TTS without humming
  console.log('\n--- 4. TESTING TTS AUDIO GENERATION & AUDIO PLAYER (REQ 13) ---');
  await evaluate(`(() => {
    const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Generate Audio'));
    if (genBtn) genBtn.click();
  })()`);

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    const isDone = await evaluate(`(() => {
      const audio = document.querySelector('audio');
      return !!audio && !!audio.src;
    })()`);
    if (isDone) break;
  }

  const playerStatus = await evaluate(`(() => {
    try {
      const body = document.body.innerText || '';
      const audio = document.querySelector('audio');
      return {
        audioSrc: audio?.src ? 'Valid speech container' : 'None',
        showsSystemVoice: body.includes('System Voice:'),
        showsWarningIfApplicable: body.includes('No Tamil female system voice is currently installed'),
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('Generated Audio Player status:', playerStatus);

  // Test playing speech in AudioPlayer
  console.log('\n--- 5. TESTING AUDIOPLAYER SPEECH PLAYBACK ---');
  const playSpeechResult = await evaluate(`(() => {
    try {
      const playBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Play Speech');
      if (playBtn) playBtn.click();
      return {
        playBtnFound: !!playBtn,
        speakingAfterPlay: window.speechSynthesis.speaking
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('AudioPlayer Play button click speaking status:', playSpeechResult);

  // Header Diagnostics Pill (Req 10)
  console.log('\n--- 6. TESTING HEADER SYSTEM VOICE STATUS PILL (REQ 10) ---');
  await evaluate(`(() => {
    const headerBtn = document.querySelector('header button[title="System Voices Detection Status"]');
    if (headerBtn) headerBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const headerPillStatus = await evaluate(`(() => {
    try {
      const body = document.body.innerText || '';
      return {
        showsDetectedSystemVoices: body.includes('Detected System Voices'),
        showsTamilCount: body.includes('Tamil Voices'),
        showsEnglishCount: body.includes('English Voices'),
      };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log('Header Diagnostics Popover status:', headerPillStatus);

  console.log('\n================================================================');
  console.log('VERIFICATION COMPLETE');
  console.log('================================================================');

  killEdge();
  process.exit(0);
}

runSpeechVerification().catch((err) => {
  console.error('Speech verification failed:', err);
  process.exit(1);
});
