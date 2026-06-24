#!/usr/bin/env python3 -u
"""
Atomic QR-login + auto-publish script for headless WeChat draft creation.

Polls CDP Chrome (port 9222) for QR scan login, then immediately publishes
a draft via operate_appmsg (type=77777). Designed to run as a background
process with notify_on_complete=true.

Usage:
  venv/bin/python3 -u scripts/poll-login-and-publish.py \
    --title "文章标题" \
    --file /tmp/body.html \
    [--digest "摘要"] \
    [--max-polls 80]

Requirements: websockets package in venv.
"""

import asyncio, json, re, sys, os, websockets

CDP_PORT = 9222
DEFAULT_MAX_POLLS = 80  # ~4 minutes at 3s intervals

def parse_args():
    args = {}
    i = 1
    while i < len(sys.argv):
        if sys.argv[i] in ("--title", "--file", "--digest", "--max-polls"):
            key = sys.argv[i].lstrip("-").replace("-", "_")
            args[key] = sys.argv[i + 1]
            i += 2
        else:
            i += 1
    return args

async def cdp_eval(ws, expr, await_promise=False):
    await ws.send(json.dumps({
        "id": 1, "method": "Runtime.evaluate",
        "params": {"expression": expr, "awaitPromise": await_promise, "returnByValue": True}
    }))
    resp = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
    return resp.get("result", {}).get("result", {}).get("value")

async def get_ws_url():
    """Find the mp.weixin.qq.com tab, or the first available tab."""
    import urllib.request
    tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json").read())
    # Prefer mp.weixin.qq.com tab
    for t in tabs:
        if "mp.weixin.qq.com" in t.get("url", ""):
            return t["webSocketDebuggerUrl"]
    # Fallback: first tab
    return tabs[0]["webSocketDebuggerUrl"] if tabs else None

async def main():
    args = parse_args()
    title = args.get("title", "")
    body_file = args.get("file", "")
    digest = args.get("digest", "")
    max_polls = int(args.get("max_polls", DEFAULT_MAX_POLLS))

    if not title or not body_file:
        print("❌ --title and --file are required", flush=True)
        sys.exit(1)

    if not os.path.exists(body_file):
        print(f"❌ File not found: {body_file}", flush=True)
        sys.exit(1)

    with open(body_file, "r") as f:
        body_html = f.read()

    print(f"Title: {title}", flush=True)
    print(f"Body: {len(body_html)} chars", flush=True)

    ws_url = await get_ws_url()
    if not ws_url:
        print("❌ No Chrome tabs found on port 9222", flush=True)
        sys.exit(1)

    print(f"Connecting to: {ws_url}", flush=True)

    async with websockets.connect(ws_url, max_size=50 * 1024 * 1024) as ws:
        token = None

        # --- Phase 1: Poll for login ---
        print("Polling for login...", flush=True)
        for i in range(max_polls):
            # Check URL for token
            url = await cdp_eval(ws, "location.href")
            if url and "token=" in str(url):
                m = re.search(r"token=([^&]+)", str(url))
                if m and len(m.group(1)) >= 6:
                    token = m.group(1)
                    print(f"✅ Logged in! Token: {token}", flush=True)
                    break

            # Check QR scan status
            status = await cdp_eval(ws, """
            (async()=>{
                try {
                    var r = await fetch('/cgi-bin/scanloginqrcode?action=ask&token=&lang=zh_CN&f=json&ajax=1');
                    return await r.text();
                } catch(e) { return '{}'; }
            })()
            """, await_promise=True)
            try:
                sj = json.loads(status or "{}")
                if sj.get("status") == 2:
                    print("Scan confirmed! Waiting for redirect...", flush=True)
                    await asyncio.sleep(3)
                    url2 = await cdp_eval(ws, "location.href")
                    if url2 and "token=" in str(url2):
                        m2 = re.search(r"token=([^&]+)", str(url2))
                        if m2:
                            token = m2.group(1)
                            print(f"✅ Token: {token}", flush=True)
                            break
            except (json.JSONDecodeError, TypeError):
                pass

            if i % 10 == 0:
                print(f"  poll {i}/{max_polls}...", flush=True)
            await asyncio.sleep(3)

        if not token:
            print("❌ Login timeout — please try again with a fresh QR", flush=True)
            sys.exit(1)

        # --- Phase 2: Store data and publish ---
        print("Storing draft data in browser context...", flush=True)
        await cdp_eval(ws, f"window.__draft_body__ = {json.dumps(body_html)}")
        await cdp_eval(ws, f"window.__draft_title__ = {json.dumps(title)}")
        await cdp_eval(ws, f"window.__draft_digest__ = {json.dumps(digest)}")

        print("Creating draft via operate_appmsg (type=77777)...", flush=True)
        result = await cdp_eval(ws, f"""
        (function() {{
            var x = new XMLHttpRequest();
            x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=create&type=77777&token={token}', false);
            var fd = new FormData();
            fd.append('token', '{token}');
            fd.append('title0', window.__draft_title__);
            fd.append('content0', window.__draft_body__);
            fd.append('digest0', window.__draft_digest__ || '');
            fd.append('fileid0', '');
            fd.append('count', '1');
            fd.append('xct', '1');
            fd.append('isneedcheck', '0');
            fd.append('appmsgundigest', '1');
            fd.append('ct', '1');
            fd.append('isadj', '1');
            fd.append('tagidlist', '');
            fd.append('request_confirm', '0');
            fd.append('send_type', '0');
            fd.append('cdntime', String(Math.floor(Date.now()/1000)));
            fd.append('t', String(Date.now()));
            x.send(fd);
            return x.responseText;
        }})()
        """)

        print(f"API Response: {result[:500]}", flush=True)

        if result:
            try:
                data = json.loads(result)
                ret = data.get("ret") or data.get("base_ret")
                app_msg_id = data.get("appMsgId") or data.get("appmsg_id")
                if str(ret) == "0":
                    content_len = 0
                    fc = data.get("filter_content_html")
                    if isinstance(fc, list) and fc:
                        content_len = len(fc[0].get("content", ""))
                    print(f"✅ Draft created! ID: {app_msg_id}, content: {content_len}", flush=True)
                else:
                    print(f"❌ ret={ret} msg={data.get('msg', '')[:200]}", flush=True)
                    sys.exit(1)
            except json.JSONDecodeError:
                print(f"❌ Invalid JSON response", flush=True)
                sys.exit(1)

asyncio.run(main())
