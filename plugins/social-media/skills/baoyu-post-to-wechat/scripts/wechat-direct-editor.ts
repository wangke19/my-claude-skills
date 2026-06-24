#!/usr/bin/env bun
// Direct WeChat editor publisher - works within the baoyu-post-to-wechat skill context
import { CdpConnection, sleep } from "./scripts/cdp.ts";
import { readFileSync } from "fs";

const HTML_FILE = "/tmp/claude-ban-wechat.html";
const TITLE = "开放两周就封杀：Claude Desktop 为何对第三方大模型翻脸？";
const AUTHOR = "宝玉";
const htmlContent = readFileSync(HTML_FILE, "utf-8");

async function main() {
  console.log("[1] Finding Chrome debug port...");
  const port = 9222;

  // Use the cdp.ts helper to connect
  const cdp = await CdpConnection.connect(`ws://127.0.0.1:${port}`, 5000);
  console.log("[1] Connected");

  // Find home tab
  const targets = await cdp.send("Target.getTargets");
  const homeTab = targets.targetInfos.find(
    (t) => t.url.includes("/cgi-bin/home") && t.url.includes("token=")
  ) || targets.targetInfos.find(t => t.url.includes("/cgi-bin/home"));
  
  if (!homeTab) throw new Error("No home tab found");
  console.log(`[2] Using home tab: ${homeTab.targetId}`);

  const session = cdp.withSession(homeTab.targetId);
  await session.send("Page.enable", {});
  await session.send("Runtime.enable", {});
  await session.send("DOM.enable", {});

  // Check menu element
  const menuCheck = await session.evaluate(`
    !!document.querySelector('.new-creation__menu')
  `);
  console.log(`[2] Menu exists: ${menuCheck}`);

  // Navigate to editor
  console.log("[3] Navigating to editor...");
  await session.send("Page.navigate", {
    url: "https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=77"
  });
  await sleep(6000);

  const newUrl = await session.evaluate("window.location.href");
  console.log(`[3] URL: ${newUrl}`);

  // Wait for #title
  let titleFound = false;
  for (let i = 0; i < 10; i++) {
    titleFound = await session.evaluate("!!document.querySelector('#title')");
    if (titleFound) break;
    await sleep(2000);
  }
  console.log(`[4] Title found: ${titleFound}`);

  if (!titleFound) {
    const debug = await session.evaluate(`JSON.stringify({
      ready: document.readyState,
      bodyLen: document.body.innerHTML.length,
      hasInputs: Array.from(document.querySelectorAll('input')).slice(0,3).map(e=>({id:e.id,placeholder:e.placeholder})),
    })`);
    console.log(`[4] Debug: ${debug}`);
    throw new Error("#title not found");
  }

  await sleep(2000);

  // Set title
  console.log("[5] Setting title...");
  await session.evaluate(`
    (() => {
      const el = document.querySelector('#title');
      el.focus();
      el.value = ${JSON.stringify(TITLE)};
      el.dispatchEvent(new Event('input', {bubbles: true}));
      el.dispatchEvent(new Event('change', {bubbles: true}));
    })()
  `);
  console.log("[5] Title set");

  // Inject HTML
  console.log("[6] Injecting content...");
  const injectResult = await session.evaluate(`
    (() => {
      const editor = document.querySelector('#js_content') || document.querySelector('.ProseMirror') || document.body;
      const dt = new DataTransfer();
      dt.setData('text/html', ${JSON.stringify(htmlContent)});
      const evt = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
      editor.dispatchEvent(evt);
      return 'pasted to ' + editor.tagName + (editor.id ? '#' + editor.id : '');
    })()
  `);
  console.log(`[6] ${injectResult}`);
  await sleep(3000);

  // Save
  console.log("[7] Saving...");
  const saveResult = await session.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('*')).filter(el => {
        const txt = (el.textContent || '').trim();
        return (txt === '保存' || txt === '存草稿') && el.children.length === 0;
      });
      if (btns.length > 0) {
        btns[0].click();
        return 'clicked: ' + btns[0].textContent.trim();
      }
      return 'not found';
    })()
  `);
  console.log(`[7] ${saveResult}`);
  await sleep(5000);

  console.log("\n[OK] Done!");
  cdp.disconnect();
}

main().catch(e => {
  console.error("[ERROR]", e.message);
  process.exit(1);
});
