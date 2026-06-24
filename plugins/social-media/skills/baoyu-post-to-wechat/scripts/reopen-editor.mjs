#!/usr/bin/env bun
// Close the tokenless editor tab, open a new one with token from home tab
import { CdpConnection, sleep } from "./cdp.ts";

const CDP_PORT = 9222;

async function main() {
  const { waitForChromeDebugPort } = await import('baoyu-chrome-cdp');
  const browserWsUrl = await waitForChromeDebugPort(CDP_PORT, 5000);
  const cdp = await CdpConnection.connect(browserWsUrl, 10_000);

  // Get all tabs
  const tabsResp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const tabs = await tabsResp.json();

  // Find home tab with token
  const homeTab = tabs.find(t => t.url.includes('token='));
  if (!homeTab) throw new Error("No home tab with token");

  // Extract token
  const url = homeTab.url;
  const tokenMatch = url.match(/[?&]token=([^&]+)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  console.error("[cdp] Token:", token.substring(0, 10) + "...");

  // Find editor tab (no token)
  const editorTab = tabs.find(t => t.url.includes('appmsg_edit') && !t.url.includes('token='));
  if (editorTab) {
    console.error("[cdp] Closing tokenless editor tab:", editorTab.id.substring(0, 16));
    await cdp.send("Target.closeTarget", { targetId: editorTab.id });
    await sleep(1000);
  }

  // Create new editor tab with token
  const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&token=${token}&lang=zh_CN`;
  console.error("[cdp] Opening:", editorUrl.substring(0, 80) + "...");
  const newTarget = await cdp.send("Target.createTarget", { url: editorUrl });
  console.error("[cdp] New editor tab:", newTarget.targetId);

  // Wait for it to load
  await sleep(8000);

  // Check if it loaded
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: newTarget.targetId, flatten: true });
  await cdp.send("Page.enable", {}, { sessionId });
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: "document.querySelector('#title') ? 'READY' : 'NOT READY: ' + document.title"
  }, { sessionId });
  console.error("[cdp] Check:", result);
  console.log("DONE");
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
