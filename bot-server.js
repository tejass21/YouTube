/**
 * YTBoost - Proxy Bot Server v1.0
 * 
 * Express + WebSocket server to manage N Puppeteer sessions,
 * each running on a separate proxy IP.
 * 
 * Run: node bot-server.js
 * Port: 3001
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cors from 'cors';

puppeteer.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// ==================== STATE ====================

const sessions = new Map(); // sessionId -> { browser, page, status, ... }
let globalClients = new Set(); // All connected WebSocket clients

// ==================== UTILS ====================

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

const VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1536, height: 864 },
];

// ==================== BROADCAST ====================

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of globalClients) {
    if (client.readyState === 1) {
      client.send(data);
    }
  }
}

function updateSession(id, updates) {
  const existing = sessions.get(id) || {};
  const updated = { ...existing, ...updates };
  sessions.set(id, updated);

  broadcast({
    type: 'session_update',
    session: { id, ...updated }
  });
}

function sessionLog(id, message) {
  const session = sessions.get(id);
  const logs = session?.logs || [];
  const newLogs = [message, ...logs].slice(0, 20);
  updateSession(id, { logs: newLogs });
  console.log(`[Session #${id}] ${message}`);
}

// ==================== PROXY IP DETECTION ====================

async function detectProxyIp(page) {
  try {
    await page.goto('https://api.ipify.org?format=json', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });
    const body = await page.evaluate(() => document.body.innerText);
    const parsed = JSON.parse(body);
    return parsed.ip || 'Unknown';
  } catch {
    try {
      await page.goto('https://httpbin.org/ip', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      const body = await page.evaluate(() => document.body.innerText);
      const parsed = JSON.parse(body);
      return parsed.origin || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
}

// ==================== HUMAN SIMULATION ====================

async function simulateMouseMovement(page) {
  try {
    const vp = page.viewport();
    if (!vp) return;
    const x = getRandomInt(100, vp.width - 100);
    const y = getRandomInt(100, vp.height - 100);
    await page.mouse.move(x, y, { steps: getRandomInt(8, 18) });
  } catch {}
}

async function simulateScroll(page) {
  try {
    const dist = getRandomInt(150, 400);
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), dist);
    await delay(getRandomInt(800, 1800));
  } catch {}
}

// ==================== ORGANIC NAVIGATION ====================

async function navigateOrganically(page, videoUrl, searchQuery, sessionId) {
  try {
    sessionLog(sessionId, 'Loading YouTube homepage...');
    await page.goto('https://www.youtube.com', {
      waitUntil: 'domcontentloaded',
      timeout: 25000
    });
    await delay(getRandomInt(2000, 4000));

    // Accept cookie consent if shown
    try {
      const consent = await page.$('button[aria-label*="Accept"], button[aria-label*="Agree"], .eom-button-row button:last-child');
      if (consent) { await consent.click(); await delay(1500); }
    } catch {}

    // Find search box
    const searchBox = await page.$('input#search');
    if (!searchBox) {
      sessionLog(sessionId, 'Search box not found, going direct...');
      await page.goto(videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      return;
    }

    // Type search query with human delays
    await searchBox.click();
    await delay(getRandomInt(500, 1200));

    const query = searchQuery || videoUrl.split('v=')[1]?.slice(0, 11) || 'youtube video';
    for (const char of query) {
      await page.keyboard.type(char, { delay: getRandomInt(60, 180) });
    }

    await delay(getRandomInt(800, 1500));
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
    sessionLog(sessionId, 'Search results loaded, looking for video...');
    await delay(getRandomInt(1500, 3000));

    // Try to click the target video
    const videoId = videoUrl.split('/').pop()?.split('?')[0] || videoUrl.split('v=')[1]?.slice(0, 11);
    const found = await page.evaluate((id) => {
      const links = Array.from(document.querySelectorAll('a'));
      const match = links.find(a => a.href && a.href.includes(id));
      if (match) { match.click(); return true; }
      return false;
    }, videoId);

    if (found) {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      sessionLog(sessionId, 'Clicked video from search results ✓');
    } else {
      sessionLog(sessionId, 'Video not found in results, going direct...');
      await page.goto(videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    }

  } catch (err) {
    sessionLog(sessionId, `Organic nav failed: ${err.message}. Using direct URL...`);
    await page.goto(videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  }
}

// ==================== WATCH SESSION ====================

async function runWatchSession(sessionId, videoUrl, searchQuery, proxyUrl, minWatch, maxWatch) {
  const vp = VIEWPORTS[getRandomInt(0, VIEWPORTS.length - 1)];
  const ua = USER_AGENTS[getRandomInt(0, USER_AGENTS.length - 1)];

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--lang=en-US,en;q=0.9',
    '--disable-dev-shm-usage',
    '--disable-gpu',
  ];

  if (proxyUrl && proxyUrl.trim()) {
    args.push(`--proxy-server=${proxyUrl.trim()}`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: vp,
      args,
    });

    // Store browser ref for cleanup
    const sessionData = sessions.get(sessionId) || {};
    sessionData.browser = browser;
    sessions.set(sessionId, sessionData);

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(15000);
    await page.setUserAgent(ua);

    // Fingerprint masking
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'en-GB'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 4) });
      window.chrome = { runtime: {} };
    });

    // Detect actual IP being used
    updateSession(sessionId, { status: 'detecting_ip', proxyIp: 'Detecting...' });
    const ip = await detectProxyIp(page);
    updateSession(sessionId, { proxyIp: ip, status: 'navigating' });
    sessionLog(sessionId, `IP confirmed: ${ip}`);

    // Organic navigation
    await navigateOrganically(page, videoUrl, searchQuery, sessionId);
    await delay(getRandomInt(1500, 3000));

    // Force play if paused
    try {
      await page.waitForSelector('video', { timeout: 8000 });
      const isPaused = await page.evaluate(() => {
        const v = document.querySelector('video');
        return v ? v.paused : true;
      });
      if (isPaused) {
        await page.evaluate(() => {
          const v = document.querySelector('video');
          if (v) v.play().catch(() => {});
        });
        await delay(1000);
      }
    } catch {}

    const targetWatch = getRandomInt(minWatch, maxWatch);
    updateSession(sessionId, { status: 'watching', elapsed: 0, target: targetWatch });
    sessionLog(sessionId, `Watching for ${targetWatch}s...`);

    // Watch loop
    let elapsed = 0;
    let lastVideoTime = -1;
    let stuckCount = 0;
    let likedAlready = false;

    const session = sessions.get(sessionId);
    while (elapsed < targetWatch && session?.running) {
      const currentSession = sessions.get(sessionId);
      if (!currentSession?.running) break;

      // Skip ad
      try {
        const skipBtn = await page.$('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
        if (skipBtn) { await skipBtn.click(); await delay(800); }
      } catch {}

      // Check video state
      let playing = false;
      let currentTime = 0;
      try {
        const state = await page.evaluate(() => {
          const v = document.querySelector('video');
          if (!v) return { playing: false, currentTime: 0 };
          return { playing: !v.paused && !v.ended && v.readyState >= 2, currentTime: v.currentTime };
        });
        playing = state.playing;
        currentTime = state.currentTime;
      } catch {}

      if (playing && currentTime > lastVideoTime) {
        elapsed++;
        stuckCount = 0;

        // Like ~15s in
        if (!likedAlready && elapsed >= 15) {
          try {
            const likeBtn = await page.$('button[aria-label*="like this video"], like-button-view-model button');
            if (likeBtn) {
              await likeBtn.click();
              likedAlready = true;
              sessionLog(sessionId, 'Liked the video ♥');
            }
          } catch {}
        }
      } else {
        stuckCount++;
        if (stuckCount === 8) {
          try {
            const player = await page.$('.html5-video-player, video');
            if (player) await player.click();
          } catch {}
        }
        if (stuckCount > 25) {
          sessionLog(sessionId, 'Video stuck. Aborting watch.');
          break;
        }
      }
      lastVideoTime = currentTime;

      // Human interactions
      if (elapsed > 0 && elapsed % 20 === 0) {
        if (Math.random() > 0.5) await simulateMouseMovement(page);
        else await simulateScroll(page);
      }

      updateSession(sessionId, { elapsed, target: targetWatch });
      await delay(1000);
    }

    // Post-watch scroll
    try {
      await simulateScroll(page);
      await delay(getRandomInt(1000, 2000));
    } catch {}

    const pct = Math.min(100, Math.round((elapsed / targetWatch) * 100));
    sessionLog(sessionId, `Done. ${elapsed}/${targetWatch}s (${pct}%) watched ✓`);
    return true;

  } catch (err) {
    sessionLog(sessionId, `Error: ${err.message}`);
    return false;
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}

// ==================== SESSION LOOP ====================

async function sessionLoop(sessionId, config) {
  const { videoUrl, searchQuery, proxyUrl, targetViews, minWatch, maxWatch } = config;
  let viewCount = 0;

  updateSession(sessionId, {
    status: 'starting',
    viewCount: 0,
    elapsed: 0,
    target: 0,
    proxyIp: proxyUrl ? 'Connecting...' : 'Local IP',
    proxyUrl: proxyUrl || 'None (Local IP)',
    logs: [],
    running: true,
  });

  sessionLog(sessionId, `Session started. Proxy: ${proxyUrl || 'Local IP'}`);

  while (sessions.get(sessionId)?.running && viewCount < targetViews) {
    const success = await runWatchSession(sessionId, videoUrl, searchQuery, proxyUrl, minWatch, maxWatch);
    if (success) {
      viewCount++;
      updateSession(sessionId, { viewCount });
      sessionLog(sessionId, `View #${viewCount}/${targetViews} complete ✓`);
    }

    const currentSession = sessions.get(sessionId);
    if (!currentSession?.running) break;
    if (viewCount < targetViews) {
      const cooldown = getRandomInt(10, 25);
      sessionLog(sessionId, `Cooldown ${cooldown}s before next view...`);
      updateSession(sessionId, { status: 'cooldown' });
      await delay(cooldown * 1000);
    }
  }

  updateSession(sessionId, { status: 'complete', running: false });
  sessionLog(sessionId, `All ${targetViews} views done. Session complete.`);
}

// ==================== API ROUTES ====================

// Start sessions
app.post('/api/start', async (req, res) => {
  const { videoUrl, searchQuery, proxies, targetViews, minWatch, maxWatch } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: 'videoUrl is required' });
  }

  const count = proxies?.length || 1;
  const views = targetViews || 10;
  const minW = minWatch || 30;
  const maxW = maxWatch || 58;

  // Stop any running sessions first
  for (const [id, session] of sessions) {
    session.running = false;
    if (session.browser) {
      try { await session.browser.close(); } catch {}
    }
  }
  sessions.clear();

  // Start a session for each proxy
  const sessionIds = [];
  for (let i = 0; i < count; i++) {
    const sessionId = i + 1;
    const proxyUrl = proxies?.[i] || null;
    sessionIds.push(sessionId);

    // Run asynchronously (non-blocking)
    sessionLoop(sessionId, {
      videoUrl,
      searchQuery: searchQuery || '',
      proxyUrl,
      targetViews: views,
      minWatch: minW,
      maxWatch: maxW,
    });
  }

  res.json({ success: true, sessionIds, count });
});

// Stop all sessions
app.post('/api/stop', async (req, res) => {
  for (const [id, session] of sessions) {
    session.running = false;
    updateSession(id, { status: 'stopped', running: false });
    if (session.browser) {
      try { await session.browser.close(); } catch {}
    }
  }
  sessions.clear();
  res.json({ success: true });
});

// Stop a single session
app.post('/api/stop/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const session = sessions.get(id);
  if (session) {
    session.running = false;
    updateSession(id, { status: 'stopped', running: false });
    if (session.browser) {
      try { await session.browser.close(); } catch {}
    }
  }
  res.json({ success: true });
});

// Reload a single session (restart it)
app.post('/api/reload/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const session = sessions.get(id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  // Kill current browser
  session.running = false;
  if (session.browser) {
    try { await session.browser.close(); } catch {}
  }

  // Restart
  const config = session.config;
  if (config) {
    updateSession(id, { status: 'restarting', elapsed: 0 });
    sessionLoop(id, config);
  }

  res.json({ success: true });
});

// Get all session states
app.get('/api/sessions', (req, res) => {
  const data = {};
  for (const [id, session] of sessions) {
    data[id] = {
      id,
      status: session.status,
      proxyIp: session.proxyIp,
      proxyUrl: session.proxyUrl,
      viewCount: session.viewCount,
      elapsed: session.elapsed,
      target: session.target,
      running: session.running,
      logs: session.logs,
    };
  }
  res.json(data);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeSessions: sessions.size });
});

// ==================== WEBSOCKET ====================

wss.on('connection', (ws) => {
  globalClients.add(ws);
  console.log('[WS] Client connected. Total:', globalClients.size);

  // Send current state on connect
  const data = {};
  for (const [id, session] of sessions) {
    data[id] = { id, ...session };
  }
  ws.send(JSON.stringify({ type: 'init', sessions: data }));

  ws.on('close', () => {
    globalClients.delete(ws);
    console.log('[WS] Client disconnected. Total:', globalClients.size);
  });
});

// ==================== START SERVER ====================

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log('==============================================');
  console.log('  YTBoost Bot Server v1.0 — Running!');
  console.log(`  API:  http://localhost:${PORT}/api`);
  console.log(`  WS:   ws://localhost:${PORT}`);
  console.log('==============================================');
});
