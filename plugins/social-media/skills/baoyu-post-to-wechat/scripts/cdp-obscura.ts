import { type ChildProcess } from 'node:child_process';
import { execSync } from 'node:child_process';
import process from 'node:process';
import {
  CdpConnection,
  sleep,
  waitForChromeDebugPort,
} from 'baoyu-chrome-cdp';

export { CdpConnection, sleep, waitForChromeDebugPort };

// ─── Obscura adapter ────────────────────────────────────────────────────
// Replaces Chrome launch with Obscura headless browser (Rust-based, CDP compatible)
// Obscura implements: Target, Page, Runtime, DOM, Network, Fetch, Input, Storage, LP

const OBSCURA_BIN = process.env.OBSCURA_PATH || 'obscura';
const OBSCURA_DEFAULT_PORT = 9222;

export interface ChromeSession {
  cdp: CdpConnection;
  sessionId: string;
  targetId: string;
}

export async function getFreePort(): Promise<number> {
  const envPort = process.env.WECHAT_BROWSER_DEBUG_PORT;
  if (envPort) return parseInt(envPort, 10);
  return OBSCURA_DEFAULT_PORT;
}

export function findChromeExecutable(_override?: string): string | undefined {
  // Not needed for Obscura, but kept for API compatibility
  return OBSCURA_BIN;
}

export function getDefaultProfileDir(): string {
  const { homedir } = require('node:os');
  const { join } = require('node:path');
  return process.env.BAOYU_CHROME_PROFILE_DIR
    || process.env.WECHAT_BROWSER_PROFILE_DIR
    || join(homedir(), '.cache', 'obscura-wechat-profile');
}

export function getAccountProfileDir(alias: string): string {
  const { dirname, join } = require('node:path');
  return join(dirname(getDefaultProfileDir()), `wechat-${alias}`);
}

export async function tryConnectExisting(port: number): Promise<CdpConnection | null> {
  try {
    const wsUrl = await waitForChromeDebugPort(port, 5_000, { includeLastError: true });
    return await CdpConnection.connect(wsUrl, 5_000);
  } catch {
    return null;
  }
}

export async function findExistingChromeDebugPort(_profileDir?: string): Promise<number | null> {
  // Check if Obscura is already running
  const port = await getFreePort();
  const existing = await tryConnectExisting(port);
  if (existing) {
    existing.close();
    return port;
  }
  return null;
}

/**
 * Launch Obscura as a CDP server instead of Chrome.
 * Obscura supports the same CDP protocol (Target, Page, Runtime, DOM, Network, Fetch, Input, Storage).
 */
export async function launchChrome(
  url: string,
  _profileDir?: string,
  _chromePathOverride?: string,
): Promise<{ cdp: CdpConnection; chrome: ChildProcess }> {
  const port = await getFreePort();
  console.log(`[obscura] Launching Obscura CDP server on port ${port}...`);

  // Start Obscura in background
  const { spawn } = require('node:child_process');
  const chrome = spawn(OBSCURA_BIN, [
    'serve',
    '-p', String(port),
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  chrome.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.log(`[obscura] ${msg}`);
  });
  chrome.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) console.error(`[obscura:err] ${msg}`);
  });

  // Wait for Obscura to be ready and connect
  console.log(`[obscura] Waiting for CDP endpoint on port ${port}...`);
  const wsUrl = await waitForChromeDebugPort(port, 30_000, { includeLastError: true });
  const cdp = await CdpConnection.connect(wsUrl, 30_000);
  console.log(`[obscura] Connected via ${wsUrl}`);

  // Navigate the initial blank page to the target URL
  const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
  const pageTarget = targets.targetInfos.find(t => t.type === 'page');
  if (pageTarget) {
    const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId: pageTarget.targetId,
      flatten: true,
    });
    await cdp.send('Page.enable', {}, { sessionId });
    await cdp.send('Page.navigate', { url }, { sessionId });
    // Wait for navigation to complete
    await sleep(5000);
  }

  return { cdp, chrome };
}

// ─── Session helpers (unchanged from original) ──────────────────────────

export async function getPageSession(cdp: CdpConnection, urlPattern: string): Promise<ChromeSession> {
  const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
  const pageTarget = targets.targetInfos.find((target) => target.type === 'page' && target.url.includes(urlPattern));

  if (!pageTarget) throw new Error(`Page not found: ${urlPattern}`);

  const { sessionId } = await cdp.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId: pageTarget.targetId,
    flatten: true,
  });

  await cdp.send('Page.enable', {}, { sessionId });
  await cdp.send('Runtime.enable', {}, { sessionId });
  await cdp.send('DOM.enable', {}, { sessionId });

  return { cdp, sessionId, targetId: pageTarget.targetId };
}

export async function waitForNewTab(
  cdp: CdpConnection,
  initialIds: Set<string>,
  urlPattern: string,
  timeoutMs = 30_000,
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; url: string; type: string }> }>('Target.getTargets');
    const newTab = targets.targetInfos.find((target) => (
      target.type === 'page' &&
      !initialIds.has(target.targetId) &&
      target.url.includes(urlPattern)
    ));
    if (newTab) return newTab.targetId;
    await sleep(500);
  }
  throw new Error(`New tab not found: ${urlPattern}`);
}

export async function clickElement(session: ChromeSession, selector: string): Promise<void> {
  const position = await session.cdp.send<{ result: { value: string } }>('Runtime.evaluate', {
    expression: `
      (function() {
        const el = document.querySelector('${selector}');
        if (!el) return 'null';
        el.scrollIntoView({ block: 'center' });
        const rect = el.getBoundingClientRect();
        return JSON.stringify({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
      })()
    `,
    returnByValue: true,
  }, { sessionId: session.sessionId });

  if (position.result.value === 'null') throw new Error(`Element not found: ${selector}`);
  const pos = JSON.parse(position.result.value);

  await session.cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x: pos.x,
    y: pos.y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: session.sessionId });
  await sleep(50);
  await session.cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x: pos.x,
    y: pos.y,
    button: 'left',
    clickCount: 1,
  }, { sessionId: session.sessionId });
}

export async function typeText(session: ChromeSession, text: string): Promise<void> {
  const lines = text.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.length > 0) {
      await session.cdp.send('Input.insertText', { text: line }, { sessionId: session.sessionId });
    }
    if (index < lines.length - 1) {
      await session.cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      }, { sessionId: session.sessionId });
      await session.cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'Enter',
        code: 'Enter',
        windowsVirtualKeyCode: 13,
      }, { sessionId: session.sessionId });
    }
    await sleep(30);
  }
}

export async function pasteFromClipboard(session: ChromeSession): Promise<void> {
  const modifiers = process.platform === 'darwin' ? 4 : 2;
  await session.cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'v',
    code: 'KeyV',
    modifiers,
    windowsVirtualKeyCode: 86,
  }, { sessionId: session.sessionId });
  await session.cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'v',
    code: 'KeyV',
    modifiers,
    windowsVirtualKeyCode: 86,
  }, { sessionId: session.sessionId });
}

export async function evaluate<T = unknown>(session: ChromeSession, expression: string): Promise<T> {
  const result = await session.cdp.send<{ result: { value: T } }>('Runtime.evaluate', {
    expression,
    returnByValue: true,
  }, { sessionId: session.sessionId });
  return result.result.value;
}
