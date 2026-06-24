/**
 * CDP ProseMirror Content Injector for WeChat MP Editor
 * 
 * Usage: bun run cdp-prosemirror-inject.js [--title TITLE] [--summary SUMMARY] [--save]
 * 
 * Prerequisites:
 * - Chromium headless running with --remote-debugging-port=9222
 * - WeChat MP editor tab open (appmsg_edit URL)
 * - Rendered HTML available (from baoyu-md or manual extraction)
 * 
 * This script:
 * 1. Extracts body content from the latest rendered temp-article.html
 * 2. Clears the ProseMirror editor
 * 3. Injects HTML via ClipboardEvent paste
 * 4. Optionally sets title, summary, and saves as draft
 */

const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CDP_PORT = parseInt(process.env.CDP_PORT || "9222");

// Parse args
const args = process.argv.slice(2);
let title = null, summary = null, shouldSave = false, htmlFile = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--title" && args[i + 1]) title = args[++i];
  if (args[i] === "--summary" && args[i + 1]) summary = args[++i];
  if (args[i] === "--save") shouldSave = true;
  if (args[i] === "--html" && args[i + 1]) htmlFile = args[++i];
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(JSON.parse(d)));
    }).on("error", reject);
  });
}

function send(ws, method, params) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 999999);
    const timeout = setTimeout(() => reject(new Error("timeout: " + method)), 20000);
    ws.on("message", function handler(data) {
      const msg = JSON.parse(data);
      if (msg.id === id) { clearTimeout(timeout); ws.off("message", handler); resolve(msg); }
    });
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  if (!bodyMatch) return html;
  const outputMatch = bodyMatch[1].match(/<div id="output"[^>]*>([\s\S]*)<\/div>\s*(?:<script|<\/body>)/);
  return outputMatch ? outputMatch[1].trim() : bodyMatch[1].trim();
}

function cleanContent(html) {
  return html
    .replace(/WECHATIMGPH_\d+/g, "")
    .replace(/data:image\/[^"'>\s]+/g, "");
}

(async () => {
  // Step 1: Get HTML content
  console.log("[1] Loading HTML content...");
  let html;
  if (htmlFile) {
    html = extractBodyContent(fs.readFileSync(htmlFile, "utf-8"));
  } else {
    // Find latest rendered HTML
    const tmpDir = "/tmp";
    const dirs = fs.readdirSync(tmpDir)
      .filter(d => d.startsWith("wechat-article-images-"))
      .map(d => ({ name: d, mtime: fs.statSync(path.join(tmpDir, d)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    let found = null;
    for (const dir of dirs) {
      const p = path.join(tmpDir, dir.name, "temp-article.html");
      if (fs.existsSync(p)) { found = p; break; }
    }
    if (!found) { console.error("No rendered HTML found. Run wechat-article.ts first or use --html."); process.exit(1); }
    html = extractBodyContent(fs.readFileSync(found, "utf-8"));
  }
  html = cleanContent(html);
  console.log("  Content:", html.length, "bytes");

  // Step 2: Connect to editor
  console.log("[2] Connecting to editor...");
  const tabs = await get("http://127.0.0.1:" + CDP_PORT + "/json/list");
  const editorTab = tabs.find(t => t.url.includes("appmsg_edit"));
  if (!editorTab) { console.error("No editor tab found."); process.exit(1); }
  const ws = new WebSocket(editorTab.webSocketDebuggerUrl);
  await new Promise(r => ws.on("open", r));
  console.log("  Connected");

  try {
    // Step 3: Set title (if provided)
    if (title) {
      console.log("[3] Setting title...");
      const r = await send(ws, "Runtime.evaluate", { expression:
        "(function() {" +
        "var input = document.querySelector('#title');" +
        "if (!input) { var inputs = document.querySelectorAll('input'); for (var i = 0; i < inputs.length; i++) { if (inputs[i].placeholder && inputs[i].placeholder.indexOf('标题') >= 0) { input = inputs[i]; break; } } }" +
        "if (!input) return 'no title input';" +
        "var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;" +
        "nativeSetter.call(input, " + JSON.stringify(title) + ");" +
        "input.dispatchEvent(new Event('input', {bubbles: true}));" +
        "input.dispatchEvent(new Event('change', {bubbles: true}));" +
        "return 'title set: ' + input.value;" +
        "})()"
      });
      console.log("  ", r.result && r.result.result ? r.result.result.value : "done");
    }

    // Step 4: Clear ProseMirror
    console.log("[4] Clearing editor...");
    await send(ws, "Runtime.evaluate", { expression:
      "(function() {" +
      "var pm = document.querySelector('.ProseMirror');" +
      "if (!pm) return 'no pm';" +
      "pm.focus();" +
      "var range = document.createRange();" +
      "range.selectNodeContents(pm);" +
      "var sel = window.getSelection();" +
      "sel.removeAllRanges();" +
      "sel.addRange(range);" +
      "document.execCommand('delete');" +
      "return 'cleared';" +
      "})()"
    });
    await delay(1000);

    // Step 5: Chunk and inject content
    console.log("[5] Injecting content...");
    const json = JSON.stringify(html);
    const CHUNK = 50000;
    const chunks = [];
    for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.substring(i, i + CHUNK));

    await send(ws, "Runtime.evaluate", { expression: "window.__htmlParts = [];" });
    for (const chunk of chunks) {
      await send(ws, "Runtime.evaluate", { expression: "window.__htmlParts.push(" + JSON.stringify(chunk) + ");" });
    }
    await send(ws, "Runtime.evaluate", { expression: "window.__htmlContent = JSON.parse(window.__htmlParts.join(''));" });

    const injectResult = await send(ws, "Runtime.evaluate", { expression:
      "(function() {" +
      "var pm = document.querySelector('.ProseMirror');" +
      "if (!pm) return 'no pm';" +
      "pm.focus();" +
      "var clipboardData = new DataTransfer();" +
      "clipboardData.setData('text/html', window.__htmlContent);" +
      "pm.dispatchEvent(new ClipboardEvent('paste', {bubbles: true, cancelable: true, clipboardData: clipboardData}));" +
      "return 'injected. textLen=' + pm.innerText.trim().length;" +
      "})()"
    });
    console.log("  ", injectResult.result && injectResult.result.result ? injectResult.result.result.value : "done");
    await delay(2000);

    // Step 6: Set summary (if provided)
    if (summary) {
      console.log("[6] Setting summary...");
      const r = await send(ws, "Runtime.evaluate", { expression:
        "(function() {" +
        "var ta = document.querySelector('#digest');" +
        "if (!ta) { var tas = document.querySelectorAll('textarea'); for (var i = 0; i < tas.length; i++) { if (tas[i].placeholder && tas[i].placeholder.indexOf('摘要') >= 0) { ta = tas[i]; break; } } }" +
        "if (!ta) return 'no summary textarea';" +
        "var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;" +
        "nativeSetter.call(ta, " + JSON.stringify(summary) + ");" +
        "ta.dispatchEvent(new Event('input', {bubbles: true}));" +
        "return 'summary set';" +
        "})()"
      });
      console.log("  ", r.result && r.result.result ? r.result.result.value : "done");
      await delay(1000);
    }

    // Step 7: Save (if requested)
    if (shouldSave) {
      console.log("[7] Saving draft...");
      await send(ws, "Runtime.evaluate", { expression:
        "(function() {" +
        "var spans = document.querySelectorAll('span.btn');" +
        "for (var i = 0; i < spans.length; i++) {" +
        "  if (spans[i].textContent.trim() === '保存为草稿') { spans[i].click(); return 'clicked'; }" +
        "}" +
        "return 'no save btn';" +
        "})()"
      });
      await delay(5000);

      const status = await send(ws, "Runtime.evaluate", { expression:
        "(function() {" +
        "var toasts = document.querySelectorAll('.page_tips');" +
        "var msgs = [];" +
        "for (var i = 0; i < toasts.length; i++) { var t = toasts[i].innerText.trim(); if (t) msgs.push(t); }" +
        "return msgs.join(' | ') || 'no toast';" +
        "})()"
      });
      console.log("[8] Status:", status.result && status.result.result ? status.result.result.value : "unknown");
    }

    console.log("[Done]");
    ws.close();
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    ws.close();
    process.exit(1);
  }
})();
