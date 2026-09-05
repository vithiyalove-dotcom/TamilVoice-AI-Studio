import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const USER_DATA_DIR = path.join(os.tmpdir(), 'edge_studio_test_' + Date.now());

async function runTestSuite() {
  console.log('--- Starting TamilVoice-AI-Studio Full Verification Suite ---');

  // Launch Edge with remote debugging
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

  // Wait for CDP endpoint to become ready
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
    console.error('Failed to connect to Edge CDP endpoint.');
    killEdge();
    process.exit(1);
  }

  const pageTarget = targets.find((t) => t.type === 'page' && t.url.includes('3000')) || targets[0];
  console.log('Connected to target page:', pageTarget.url);

  // Connect WebSocket to page
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

  // Enable CDP domains
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

  // Wait for React to render
  console.log('Waiting for React root to mount...');
  let mounted = false;
  for (let i = 0; i < 20; i++) {
    const text = await evaluate('document.body.innerText');
    if (text && text.includes('TamilVoice')) {
      mounted = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!mounted) {
    console.error('React root did not mount!');
    killEdge();
    process.exit(1);
  }
  console.log('React Studio successfully mounted.');

  const results = [];

  // Helper to click sidebar nav
  const navigateTo = async (pageName) => {
    await evaluate(`(() => {
      const buttons = Array.from(document.querySelectorAll('aside nav button'));
      const target = buttons.find(b => b.innerText.includes('${pageName}'));
      if (target) { target.click(); return true; }
      return false;
    })()`);
    await new Promise((r) => setTimeout(r, 600));
  };

  // TEST 1: Dashboard
  console.log('\n--- Test 1: Dashboard Inspection ---');
  const dashInfo = await evaluate(`(() => {
    const h1 = document.querySelector('header h1')?.innerText;
    const body = document.body.innerText.toLowerCase();
    return {
      header: h1,
      hasHero: body.includes('bring words to life'),
      hasMetrics: body.includes('available voices') && body.includes('audio synthesized'),
      hasFeatured: body.includes('featured neural voices'),
      hasArunKumar: body.includes('arun kumar'),
      hasTamilScript: document.body.innerText.includes('அருண் குமார்') || document.body.innerText.includes('தமிழ்'),
    };
  })()`);
  console.log('Dashboard checks:', dashInfo);
  results.push({ test: 'Dashboard', passed: dashInfo.hasHero && dashInfo.hasMetrics && dashInfo.hasFeatured });

  // TEST 2: Text to Speech
  console.log('\n--- Test 2: Text to Speech Inspection & Audio Generation ---');
  await navigateTo('Text to Speech');
  const ttsInfo = await evaluate(`(() => {
    const textarea = document.querySelector('textarea');
    const hasTamilScript = textarea?.value?.includes('தமிழ்');
    const charCount = document.body.innerText.includes('Characters:');
    const hasSampleButtons = document.body.innerText.includes('தமிழ் உரை') && document.body.innerText.includes('English Text');
    const bodyLower = document.body.innerText.toLowerCase();
    const hasAcousticFineTuning = bodyLower.includes('acoustic fine-tuning') && bodyLower.includes('speaking speed');
    return {
      hasTextarea: !!textarea,
      hasTamilScript,
      charCount,
      hasSampleButtons,
      hasAcousticFineTuning,
    };
  })()`);
  console.log('TTS Page checks:', ttsInfo);

  // Test Translation toggle
  await evaluate(`(() => {
    const checkbox = document.querySelector('input[type="checkbox"]');
    if (checkbox) { checkbox.click(); }
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  const translationCheck = await evaluate(`document.body.innerText.includes('Cross-Lingual Translation Mode')`);
  console.log('Translation toggle check:', translationCheck);

  // Trigger Audio Generation
  console.log('Triggering "Generate Audio" in TTS...');
  await evaluate(`(() => {
    const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Generate Audio'));
    if (genBtn) genBtn.click();
  })()`);

  // Wait for generation to complete
  let audioPlayerReady = false;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const isReady = await evaluate(`(() => {
      const player = document.querySelector('audio');
      return !!player && !!player.src && player.src.startsWith('blob:');
    })()`);
    if (isReady) {
      audioPlayerReady = true;
      break;
    }
  }
  console.log('Audio Generation completed and AudioPlayer mounted with Blob URL:', audioPlayerReady);

  // Verify AudioPlayer controls
  const audioControls = await evaluate(`(() => {
    const audio = document.querySelector('audio');
    const hasDownloadBtn = Array.from(document.querySelectorAll('a')).some(a => a.innerText.includes('Download'));
    const hasCanvasWaveform = !!document.querySelector('canvas');
    return {
      audioSrc: audio?.src ? 'Valid Blob' : 'None',
      hasDownloadBtn,
      hasCanvasWaveform
    };
  })()`);
  console.log('AudioPlayer details:', audioControls);
  results.push({ test: 'Text to Speech', passed: ttsInfo.hasTextarea && audioPlayerReady && audioControls.hasDownloadBtn });

  // TEST 3: Voice Library
  console.log('\n--- Test 3: Voice Library Inspection & Filtering ---');
  await navigateTo('Voice Library');
  const voiceLibInfo = await evaluate(`(() => {
    const body = document.body.innerText;
    return {
      hasTamilMaleCount: body.includes('Tamil Male Voices'),
      hasTamilFemaleCount: body.includes('Tamil Female Voices'),
      hasEnglishMaleCount: body.includes('English Male Voices'),
      hasEnglishFemaleCount: body.includes('English Female Voices'),
      totalCards: Array.from(document.querySelectorAll('h3')).filter(h => !h.innerText.includes('Voice')).length,
    };
  })()`);
  console.log('Voice Library checks:', voiceLibInfo);

  // Test search in Voice Library
  await evaluate(`(() => {
    const search = document.querySelector('input[placeholder*="Search"]');
    if (search) {
      search.value = 'Arun';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  const searchResultCount = await evaluate(`(() => {
    return Array.from(document.querySelectorAll('h3')).filter(h => h.innerText === 'Arun Kumar').length;
  })()`);
  console.log('Search filter for "Arun Kumar" match count:', searchResultCount);

  // Test "Play Preview"
  const previewClicked = await evaluate(`(() => {
    const previewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Play Preview'));
    if (previewBtn) {
      previewBtn.click();
      return true;
    }
    return false;
  })()`);
  console.log('Play Preview button clicked:', previewClicked);
  results.push({ test: 'Voice Library', passed: voiceLibInfo.hasTamilMaleCount && searchResultCount >= 1 });

  // TEST 4: Voice Cloning
  console.log('\n--- Test 4: Voice Cloning Workflow ---');
  await navigateTo('Voice Cloning');
  const clonePageInfo = await evaluate(`(() => {
    const body = document.body.innerText;
    return {
      hasUploadOption: body.includes('Upload File'),
      hasRecordOption: body.includes('Record Mic'),
      hasEthicalConsent: body.includes('Ethical AI'),
      hasVoiceTrainingBtn: body.includes('Start Neural Voice Training'),
    };
  })()`);
  console.log('Voice Cloning Page checks:', clonePageInfo);

  // Click Load Demo Sample button
  console.log('Clicking "Load Demo Sample" to load audio sample into state...');
  await evaluate(`(() => {
    const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Load Demo Sample'));
    if (demoBtn) demoBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 500));

  // Click Start Neural Voice Training
  console.log('Starting Voice Cloning Pipeline...');
  await evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Neural Voice Training'));
    if (btn) btn.click();
  })()`);

  // Wait for cloning pipeline to complete
  let cloningCompleted = false;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 600));
    const isComplete = await evaluate(`document.body.innerText.includes('Voice Cloned Successfully!')`);
    if (isComplete) {
      cloningCompleted = true;
      break;
    }
  }
  console.log('Voice Cloning Pipeline completed successfully:', cloningCompleted);
  results.push({ test: 'Voice Cloning', passed: clonePageInfo.hasUploadOption && cloningCompleted });

  // TEST 5: My Voices
  console.log('\n--- Test 5: My Voices Verification ---');
  await navigateTo('My Voices');
  const myVoicesInfo = await evaluate(`(() => {
    const body = document.body.innerText;
    return {
      hasClonedVoice: body.includes('Tamil Neural Clone'),
      hasReadyBadge: body.includes('Ready'),
      hasUseInTtsBtn: body.includes('Use in TTS'),
      hasPreviewBtn: body.includes('Preview'),
    };
  })()`);
  console.log('My Voices checks:', myVoicesInfo);
  results.push({ test: 'My Voices', passed: myVoicesInfo.hasClonedVoice && myVoicesInfo.hasReadyBadge });

  // TEST 6: My Projects
  console.log('\n--- Test 6: My Projects Verification ---');
  await navigateTo('My Projects');
  const myProjectsInfo = await evaluate(`(() => {
    const bodyLower = document.body.innerText.toLowerCase();
    return {
      hasSavedRecordings: bodyLower.includes('saved recordings') || bodyLower.includes('my audio projects'),
      hasInspector: bodyLower.includes('project preview & inspector'),
      hasScriptText: bodyLower.includes('source text script'),
      hasDownload: document.body.innerText.includes('Download File'),
      hasAudioPlayer: !!document.querySelector('audio'),
    };
  })()`);
  console.log('My Projects checks:', myProjectsInfo);
  results.push({ test: 'My Projects', passed: myProjectsInfo.hasInspector && myProjectsInfo.hasScriptText });

  // TEST 7: Settings
  console.log('\n--- Test 7: Settings Verification ---');
  await navigateTo('Settings');
  const settingsInfo = await evaluate(`(() => {
    const body = document.body.innerText;
    return {
      hasEngineOptions: body.includes('Browser Demo Engine') && body.includes('IndicTTS') && body.includes('ElevenLabs'),
      hasFormatOptions: body.includes('MP3') && body.includes('WAV'),
      hasSampleRates: body.includes('44.1 kHz'),
      hasSaveBtn: body.includes('Save Settings'),
    };
  })()`);
  console.log('Settings checks:', settingsInfo);

  // Test clicking IndicTTS engine and saving
  await evaluate(`(() => {
    const cards = Array.from(document.querySelectorAll('h4'));
    const indicCard = cards.find(h => h.innerText.includes('IndicTTS'));
    if (indicCard) indicCard.click();
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Settings'));
    if (saveBtn) saveBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 400));
  const saveIndicator = await evaluate(`document.body.innerText.includes('Saved!')`);
  console.log('Settings Save confirmation indicator:', saveIndicator);
  results.push({ test: 'Settings', passed: settingsInfo.hasEngineOptions && saveIndicator });

  // Check for any runtime errors captured in console
  console.log('\n--- Runtime Error Check ---');
  console.log('Console Errors caught:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e) => console.log('Console error:', e));
  }

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY:');
  results.forEach((r) => {
    console.log(`[${r.passed ? 'PASSED' : 'FAILED'}] ${r.test}`);
  });
  console.log('========================================');

  killEdge();
  process.exit(results.every((r) => r.passed) && consoleErrors.length === 0 ? 0 : 1);
}

runTestSuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
