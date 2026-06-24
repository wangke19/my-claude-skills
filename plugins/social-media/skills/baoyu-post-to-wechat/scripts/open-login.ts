#!/usr/bin/env bun
// Step 1: Open WeChat login page
// Step 2: Screenshot
// Step 3: Save to /tmp/wechat-login.png
import { CdpConnection, sleep } from "./scripts/cdp.ts";

const CDP_HOST = "127.0.0.1";
const CDP_PORT = 9222;

async function main() {
  const cdp = new CdpConnection(`ws://${CDP_HOST}:${CDP_PORT}`);
  await cdp.connect();
  console.error("[cdp] Connected");

  // Get existing tabs
  const tabsResp = await fetch(`http://${CDP_HOST}:${CDP_PORT}/json`);
  const tabs = await tabsResp.json();
  console.error(`[cdp] ${tabs.length} tabs`);

  // Close all existing tabs
  for (const t of tabs) {
    await cdp.send("Target.closeTarget", { targetId: t.id });
  }
  console.error("[cdp] Closed all tabs");

  // Create new tab with WeChat URL
  const newTarget = await cdp.send("Target.createTarget", {
    url: "https://mp.weixin.qq.com/",
  });
  console.log(`[cdp] Created tab: ${newTarget.targetId}`);
  const targetId = newTarget.targetId;

  // Wait for page to load
  await sleep(6000);

  // Attach to the new tab
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await cdp.send("Page.enable", {}, { sessionId });
  await cdp.send("Runtime.enable", {}, { sessionId });

  // Screenshot
  const { data } = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
  }, { sessionId });

  require("fs").writeFileSync("/tmp/wechat-login.png", Buffer.from(data, "base64"));
  console.log("/tmp/wechat-login.png");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
