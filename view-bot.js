/**
 * YTBoost - View Retention Controller v3.0
 *
 * KEY FIXES for view drops:
 * 1. Organic navigation: YouTube homepage → search → click video (not direct URL)
 * 2. Audio NOT muted by default (muted views are discounted by YouTube)
 * 3. Like button interaction (strong engagement signal)
 * 4. Scroll comments section after watching (retention signal)
 * 5. Proxy validation against neutral host (not YouTube) to avoid false negatives
 * 6. Multiple free proxy sources for larger pool
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

// ==================== CONFIGURATION ====================
const CONFIG = {
  // Your YouTube video URL:
  videoUrl: 'https://www.youtube.com/shorts/k2XsFU_r5dY',

  // Search term to use for organic discovery (match your video title/topic):
  searchQuery: 'k2XsFU_r5dY shorts',

  // Total view sessions to run:
  totalViews: 50,

  // Watch time range in seconds (Shorts are ~60s, watch as much as possible):
  minWatchTime: 40,
  maxWatchTime: 58,

  // true = show browser window, false = hidden (headless)
  showBrowser: false,

  // Add paid residential proxies here for best results.
  // Format: 'http://user:pass@ip:port' or 'http://ip:port'
  // Leave empty [] to use free proxies (or local IP if all fail).
  proxies: []
};
// ========================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDelay = () => delay(getRandomInt(800, 2500));

// ==================== PROXY MANAGEMENT ====================

const deadProxies = new Set();

async function fetchFreeProxies() {
  const sources = [
    'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=anonymous',
    'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=US,GB,CA,DE,FR&ssl=all&anonymity=all',
  ];

  const all = new Set();
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      text.split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 4 && p.includes(':'))
        .forEach(p => all.add(`http://${p}`));
    } catch {}
  }

  const list = [...all];
  console.log(`[Proxy Scraper] Loaded ${list.length} raw proxies from ${sources.length} sources.`);
  return list;
}

/**
 * Validate proxy by navigating to httpbin.org/ip (neutral, no bot detection).
 * Uses headless Chrome so the TLS stack is identical to real sessions.
 */
async function isProxyAlive(proxyUrl, timeoutMs = 10000) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        `--proxy-server=${proxyUrl}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
      ]
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(timeoutMs);

    // Use a neutral endpoint — YouTube itself blocks headless validation hits
    const res = await page.goto('https://httpbin.org/ip', { waitUntil: 'domcontentloaded' });
    if (!res || res.status() !== 200) return false;

    const body = await page.evaluate(() => document.body.innerText);
    // Response should be JSON like {"origin": "x.x.x.x"}
    return body.includes('origin');
  } catch {
    return false;
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
  }
}

async function filterWorkingProxies(proxyList, batchSize = 5) {
  console.log(`[Proxy Validator] Validating ${proxyList.length} proxies using Chrome → httpbin.org...`);
  const working = [];

  for (let i = 0; i < proxyList.length; i += batchSize) {
    const batch = proxyList.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (proxy) => {
        const alive = await isProxyAlive(proxy);
        return alive ? proxy : null;
      })
    );
    working.push(...results.filter(Boolean));
    process.stdout.write(`\r[Proxy Validator] ${Math.min(i + batchSize, proxyList.length)}/${proxyList.length} tested — ${working.length} alive...`);
    if (working.length >= 15) break;
  }

  console.log(`\n[Proxy Validator] ${working.length} proxies verified and ready.`);
  return working;
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

async function simulateScroll(page, distance = null) {
  try {
    const dist = distance || getRandomInt(150, 400);
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: 'smooth' }), dist);
    await delay(getRandomInt(1000, 2000));
  } catch {}
}

// ==================== ORGANIC NAVIGATION ====================

/**
 * Navigate organically: YouTube homepage → search bar → type query → click video.
 * This creates a real discovery path that YouTube's algorithm trusts.
 */
async function navigateOrganically(page, sessionIndex) {
  try {
    console.log(`[Session #${sessionIndex}] Loading YouTube homepage...`);
    await page.goto('https://www.youtube.com', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await delay(getRandomInt(2000, 4000));

    // Accept cookie consent if shown
    try {
      const consent = await page.$('button[aria-label*="Accept"], button[aria-label*="Agree"], .eom-button-row button:last-child');
      if (consent) {
        await consent.click();
        await delay(1500);
      }
    } catch {}

    // Type into search bar
    const searchBox = await page.$('input#search');
    if (!searchBox) {
      console.log(`[Session #${sessionIndex}] Search box not found, going direct.`);
      await page.goto(CONFIG.videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      return true;
    }

    await searchBox.click();
    await delay(getRandomInt(500, 1200));

    // Type query with human-like delays between keystrokes
    for (const char of CONFIG.searchQuery) {
      await page.keyboard.type(char, { delay: getRandomInt(60, 180) });
    }
    await delay(getRandomInt(800, 1500));
    await page.keyboard.press('Enter');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log(`[Session #${sessionIndex}] Search results loaded.`);
    await delay(getRandomInt(1500, 3000));

    // Try to find and click the target video in results
    const videoId = CONFIG.videoUrl.split('/').pop().split('?')[0];
    const found = await page.evaluate((id) => {
      const links = Array.from(document.querySelectorAll('a'));
      const match = links.find(a => a.href && a.href.includes(id));
      if (match) { match.click(); return true; }
      return false;
    }, videoId);

    if (found) {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      console.log(`[Session #${sessionIndex}] Clicked video from search results.`);
    } else {
      // Fallback: click first video result
      const firstResult = await page.$('ytd-video-renderer a#video-title, ytd-short-shelf-renderer a');
      if (firstResult) {
        await firstResult.click();
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
      } else {
        await page.goto(CONFIG.videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      }
    }

    return true;
  } catch (err) {
    // Hard fallback to direct URL
    console.log(`[Session #${sessionIndex}] Organic nav failed (${err.message}), using direct URL.`);
    await page.goto(CONFIG.videoUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    return false;
  }
}

// ==================== WATCH PROGRESS ====================

async function handleWatchProgress(page, targetWatchTime, sessionIndex) {
  let elapsed = 0;
  let lastTime = -1;
  let stuckCount = 0;
  let likedAlready = false;

  console.log(`[Session #${sessionIndex}] Watching for ${targetWatchTime}s...`);

  while (elapsed < targetWatchTime) {
    // Skip ad if present
    try {
      const skipBtn = await page.$('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
      if (skipBtn) { await skipBtn.click(); await delay(800); }
    } catch {}

    // Check ad playing
    let isAd = false;
    try {
      isAd = await page.evaluate(() =>
        !!document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay')
      );
    } catch {}

    // Get video state
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

    if (!isAd) {
      if (playing && currentTime > lastTime) {
        elapsed++;
        stuckCount = 0;

        // Like the video ~15s in (strong engagement signal)
        if (!likedAlready && elapsed >= 15) {
          try {
            const likeBtn = await page.$('button[aria-label*="like this video"], like-button-view-model button');
            if (likeBtn) {
              await likeBtn.click();
              likedAlready = true;
              console.log(`[Session #${sessionIndex}] Liked the video.`);
            }
          } catch {}
        }
      } else if (playing) {
        stuckCount++;
        if (stuckCount > 12) { console.log(`[Session #${sessionIndex}] Playback stalled. Stopping.`); break; }
      } else {
        stuckCount++;
        if (stuckCount === 8) {
          try {
            const player = await page.$('.html5-video-player, video');
            if (player) await player.click();
          } catch {}
        }
        if (stuckCount > 25) { console.log(`[Session #${sessionIndex}] Video never played. Aborting.`); break; }
      }
      lastTime = currentTime;
    }

    // Human interactions every ~20s
    if (elapsed > 0 && elapsed % 20 === 0) {
      if (Math.random() > 0.5) await simulateMouseMovement(page);
      else await simulateScroll(page, getRandomInt(50, 150));
    }

    await delay(1000);
  }

  // Post-watch: scroll comments (engagement signal YouTube measures)
  try {
    await simulateScroll(page, getRandomInt(300, 600));
    await delay(getRandomInt(1500, 3000));
    await simulateScroll(page, getRandomInt(200, 400));
    console.log(`[Session #${sessionIndex}] Post-watch scroll complete.`);
  } catch {}

  const pct = Math.min(100, Math.round((elapsed / targetWatchTime) * 100));
  console.log(`[Session #${sessionIndex}] Done. ${elapsed}/${targetWatchTime}s watched (${pct}%).`);
  return elapsed > 10;
}

// ==================== SESSION RUNNER ====================

const PROXY_FATAL_ERRORS = [
  'ERR_EMPTY_RESPONSE', 'ERR_TUNNEL_CONNECTION_FAILED', 'ERR_PROXY_CONNECTION_FAILED',
  'ERR_TIMED_OUT', 'ERR_CONNECTION_REFUSED', 'ERR_CONNECTION_CLOSED',
  'ERR_CONNECTION_RESET', 'ERR_SOCKET_NOT_CONNECTED', 'frame was detached', 'net::ERR_'
];

async function runViewSession(sessionIndex, proxyUrl = null) {
  const vp = VIEWPORTS[getRandomInt(0, VIEWPORTS.length - 1)];
  const ua = USER_AGENTS[getRandomInt(0, USER_AGENTS.length - 1)];

  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-features=IsolateOrigins,site-per-process',
    '--lang=en-US,en;q=0.9',
    '--disable-dev-shm-usage',
  ];

  if (proxyUrl) {
    args.push(`--proxy-server=${proxyUrl}`);
    console.log(`\n[Session #${sessionIndex}] Proxy: ${proxyUrl}`);
  } else {
    console.log(`\n[Session #${sessionIndex}] Local IP`);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: CONFIG.showBrowser ? false : 'new',
      defaultViewport: vp,
      args,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(15000);

    await page.setUserAgent(ua);

    // Stronger fingerprint masking
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en', 'en-GB'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 + Math.floor(Math.random() * 4) });
      Object.defineProperty(screen, 'colorDepth', { get: () => 24 });
      window.chrome = { runtime: {} };
    });

    // Organic navigation (search → click) for real traffic signal
    await navigateOrganically(page, sessionIndex);
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

    const watchSecs = getRandomInt(CONFIG.minWatchTime, CONFIG.maxWatchTime);
    const success = await handleWatchProgress(page, watchSecs, sessionIndex);

    return { success, proxyDied: false };

  } catch (error) {
    const msg = error.message || '';
    const isProxyError = PROXY_FATAL_ERRORS.some(e => msg.includes(e));

    if (isProxyError && proxyUrl) {
      deadProxies.add(proxyUrl);
      CONFIG.proxies = CONFIG.proxies.filter(p => !deadProxies.has(p));
      console.warn(`[Session #${sessionIndex}] Proxy blacklisted: ${proxyUrl} (${CONFIG.proxies.length} left)`);
      return { success: false, proxyDied: true };
    }

    console.error(`[Session #${sessionIndex}] Error: ${msg}`);
    return { success: false, proxyDied: false };
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    console.log(`[Session #${sessionIndex}] Browser closed.`);
  }
}

// ==================== CONTROLLER ====================

async function startController() {
  console.log('===================================================');
  console.log('    YTBoost - View Retention Controller v3.0      ');
  console.log('===================================================');
  console.log(`Video: ${CONFIG.videoUrl}`);
  console.log(`Search Query: "${CONFIG.searchQuery}"`);
  console.log(`Target Views: ${CONFIG.totalViews}`);
  console.log(`Browser: ${CONFIG.showBrowser ? 'Visible' : 'Headless'}`);
  console.log('---------------------------------------------------\n');

  if (CONFIG.proxies.length === 0) {
    const raw = await fetchFreeProxies();
    if (raw.length > 0) {
      CONFIG.proxies = await filterWorkingProxies(raw);
    }
    if (CONFIG.proxies.length === 0) {
      console.warn('[Controller] No proxies available — using local IP for all sessions.');
      console.warn('[Controller] Views from a single IP are likely to be dropped by YouTube!');
    }
  }

  let successCount = 0;
  const MAX_RETRIES = 4;

  for (let i = 1; i <= CONFIG.totalViews; i++) {
    const start = Date.now();
    let result = { success: false, proxyDied: true };
    let attempt = 0;
    const tried = new Set();

    while (result.proxyDied && attempt < MAX_RETRIES) {
      attempt++;

      const available = CONFIG.proxies.filter(p => !deadProxies.has(p) && !tried.has(p));
      let proxy = null;

      if (available.length > 0) {
        proxy = available[((i - 1) + attempt - 1) % available.length];
        tried.add(proxy);
      } else if (attempt > 1) {
        console.warn(`[Session #${i}] No more proxies. Skipping.`);
        break;
      }

      if (attempt > 1) console.log(`[Session #${i}] Retry ${attempt}/${MAX_RETRIES}...`);
      result = await runViewSession(i, proxy) || { success: false, proxyDied: false };
      if (!proxy) break;
    }

    const duration = Math.round((Date.now() - start) / 1000);
    if (result.success) successCount++;

    const coolDown = getRandomInt(15, 35);
    console.log(`✓ Session #${i} done (${duration}s, ${attempt} attempt(s)). Waiting ${coolDown}s...\n`);
    await delay(coolDown * 1000);
  }

  console.log('\n===================================================');
  console.log(`  Complete! ${successCount}/${CONFIG.totalViews} sessions succeeded.`);
  console.log('===================================================');
}

startController();
