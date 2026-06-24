#!/usr/bin/env bun
// Open WeChat login page and screenshot it
import { CdpConnection, sleep } from "./cdp.ts";

const CDP_HOST = "127.0.0.1";
const CDP_PORT = 9222;

async function main() {
  const { waitForChromeDebugPort } = await import('baoyu-chrome-cdp');
  const browserWsUrl = await waitForChromeDebugPort(CDP_PORT, 5000);
  const cdp = await CdpConnection.connect(browserWsUrl, 10_000);
  console.error("[cdp] Connected to:", browserWsUrl.substring(0, 60));
  console.error("[cdp] Connected");

  // Close all existing tabs
  const tabsResp = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json`);
  const tabs = await tabsResp.json();
  for (const t of tabs) {
    await cdp.send("Target.closeTarget", { targetId: t.id });
  }
  console.error("[cdp] Closed all tabs");

  // Create WeChat login tab
  const newTarget = await cdp.send("Target.createTarget", {
    url: "https://mp.weixin.qq.com/",
  });
  const targetId = newTarget.targetId;
  console.error(`[cdp] Created tab: ${targetId}`);

  // Wait for login page to render
  await sleep(5000);

  // Attach and screenshot
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  await cdp.send("Page.enable", {}, { sessionId });

  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  }, { sessionId });

  require("fs").writeFileSync("/tmp/wechat-login.png", Buffer.from(data, "base64"));
  console.log("/tmp/wechat-login.png");
}

main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
