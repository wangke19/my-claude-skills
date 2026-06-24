#!/usr/bin/env bun
// Open WeChat editor in a new tab and screenshot it
import { CdpConnection, sleep } from "./cdp.ts";

const CDP_PORT = 9222;

async function main() {
  const { waitForChromeDebugPort } = await import('baoyu-chrome-cdp');
  const browserWsUrl = await waitForChromeDebugPort(CDP_PORT, 5000);
  const cdp = await CdpConnection.connect(browserWsUrl, 10_000);
  console.error("[cdp] Connected");

  // Check existing tabs - we should have the logged-in home tab
  const tabsResp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const tabs = await tabsResp.json();
  console.error(`[cdp] ${tabs.length} tabs`);
  for (const t of tabs) {
    console.error("  Tab:", t.id.substring(0,16), t.url.substring(0, 80));
  }

  // Get token from existing tab
  const homeTab = tabs.find(t => t.url.includes('token='));
  if (!homeTab) {
    // Navigate existing tab to home first
    console.error("[cdp] No token found, navigating home tab to mp.weixin.qq.com...");
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: tabs[0].id, flatten: true });
    await cdp.send("Page.enable", {}, { sessionId });
    await cdp.send("Page.navigate", { url: "https://mp.weixin.qq.com/" }, { sessionId });
    await sleep(8000);
  }

  // Re-fetch tabs
  const tabs2Resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const tabs2 = await tabs2Resp.json();
  const targetTab = tabs2.find(t => t.url.includes('token='));
  if (!targetTab) throw new Error("No logged-in tab found");

  // Parse token from URL
  const url = targetTab.url;
  const tokenMatch = url.match(/[?&]token=([^&]+)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  console.error("[cdp] Token found:", token.substring(0, 10) + "...");

  // Create editor tab with token
  const editorUrl = `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77&token=${token}&lang=zh_CN`;
  const newTarget = await cdp.send("Target.createTarget", { url: editorUrl });
  console.error(`[cdp] Created editor tab: ${newTarget.targetId}`);

  // Wait for editor to load
  await sleep(8000);

  // Get new tab info
  const tabs3Resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
  const tabs3 = await tabs3Resp.json();
  const editorTab = tabs3.find(t => t.targetId === newTarget.targetId || t.url.includes('appmsg_edit'));
  console.error("[cdp] Editor tab URL:", editorTab?.url?.substring(0, 100));

  // Attach to editor tab
  const editorTargetId = newTarget.targetId;
  const { sessionId: editorSid } = await cdp.send("Target.attachToTarget", { targetId: editorTargetId, flatten: true });
  await cdp.send("Page.enable", {}, { sessionId: editorSid });
  await cdp.send("Runtime.enable", {}, { sessionId: editorSid });
  await cdp.send("DOM.enable", {}, { sessionId: editorSid });

  // Check if #title exists
  await sleep(3000);
  const { result: titleCheck } = await cdp.send("Runtime.evaluate", {
    expression: "document.querySelector('#title') ? 'found' : 'not found: ' + document.title",
  }, { sessionId: editorSid });
  console.error("[cdp] Title check:", titleCheck);

  // Take screenshot
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true }, { sessionId: editorSid });
  require("fs").writeFileSync("/tmp/wechat-editor.png", Buffer.from(data, "base64"));
  console.log("/tmp/wechat-editor.png");
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
