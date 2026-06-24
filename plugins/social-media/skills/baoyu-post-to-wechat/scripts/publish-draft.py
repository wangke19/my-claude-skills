#!/usr/bin/env python3
"""
WeChat draft publisher via CDP operate_appmsg API.

Key: must use type=77777 (new single-article draft), NOT type=77 (old material).
Old type=77 returns ret=0 but content goes to old material area, invisible in new draft box.

Usage:
  python publish-draft.py --title "标题" --file body.html [--digest "摘要"] [--del OLD_ID]

Requirements: pip install websockets
"""

import argparse, asyncio, json, os, sys, urllib.request

CDP_PORT = 9222


async def get_ws_url():
    """Get WeChat tab's WebSocket URL from Chrome DevTools."""
    try:
        tabs = json.loads(urllib.request.urlopen(f"http://127.0.0.1:{CDP_PORT}/json").read())
    except Exception as e:
        print(f"❌ Cannot connect to Chrome on port {CDP_PORT}: {e}", file=sys.stderr)
        sys.exit(1)

    wx_tab = None
    for t in tabs:
        if "mp.weixin.qq.com" in t.get("url", ""):
            wx_tab = t
            break

    if not wx_tab:
        print("❌ No WeChat tab found. Navigate to https://mp.weixin.qq.com first.", file=sys.stderr)
        sys.exit(1)

    return wx_tab["webSocketDebuggerUrl"]


async def cdp_eval(ws, js_expr, msg_id=1):
    """Execute JS in page context via CDP Runtime.evaluate, return result value."""
    await ws.send(json.dumps({
        "id": msg_id, "method": "Runtime.evaluate",
        "params": {"expression": js_expr, "returnByValue": True, "timeout": 30000}
    }))
    resp = json.loads(await ws.recv())
    return resp.get("result", {}).get("result", {}).get("value", "")


async def cdp_eval_raw(ws, js_expr, msg_id=1):
    """Execute JS in page context, return raw response dict."""
    await ws.send(json.dumps({
        "id": msg_id, "method": "Runtime.evaluate",
        "params": {"expression": js_expr, "returnByValue": True, "timeout": 30000}
    }))
    return json.loads(await ws.recv())


async def get_token(ws):
    """Get WeChat session token with multiple fallback sources."""
    js = """(function() {
        if (window.__token) return window.__token;
        var m = document.cookie.match(/token=([^;]+)/);
        if (m) return m[1];
        m = location.href.match(/token=([^&]+)/);
        if (m) return m[1];
        return '';
    })()"""
    token = await cdp_eval(ws, js, msg_id=1)
    if not token:
        print("❌ No token found. Need to scan QR code to login.", file=sys.stderr)
        sys.exit(1)
    return token


async def delete_draft(ws, token, draft_id):
    """Delete an existing draft by appMsgId."""
    js = f"""(function() {{
        var x = new XMLHttpRequest();
        x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=del&type=77&token={token}&lang=zh_CN', false);
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        x.send('token={token}&lang=zh_CN&f=json&ajax=1&AppMsgId={draft_id}&count=1&data_seq=0');
        return x.responseText;
    }})()"""
    await cdp_eval(ws, js, msg_id=10)
    print(f"Deleted draft {draft_id}")


async def create_draft(ws, token, title, body_html, digest=""):
    """Create a new draft via operate_appmsg API with type=77777 (new single-article).

    Critical: use FormData (multipart), NOT URL-encoded string.
    Must store body in window first to avoid JS string escaping issues.
    """
    # Step 1: Store body_html and title in window context
    store_js = f"window.__draft_body__ = {json.dumps(body_html)}; window.__draft_title__ = {json.dumps(title)}; window.__draft_digest__ = {json.dumps(digest)}; 'stored'"
    result = await cdp_eval(ws, store_js, msg_id=20)
    if result != "stored":
        print(f"❌ Failed to store content in page context: {result}", file=sys.stderr)
        return None

    # Step 2: Create draft via synchronous XHR + FormData + type=77777
    create_js = f"""(function() {{
        var x = new XMLHttpRequest();
        x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=create&type=77777&token={token}', false);
        var fd = new FormData();
        fd.append('token', '{token}');
        fd.append('lang', 'zh_CN');
        fd.append('f', 'json');
        fd.append('ajax', '1');
        fd.append('AppMsgId', '');
        fd.append('count', '1');
        fd.append('data_seq', '0');
        fd.append('title0', window.__draft_title__);
        fd.append('content0', window.__draft_body__);
        fd.append('digest0', window.__draft_digest__);
        fd.append('author0', '');
        fd.append('content_source_url0', '');
        fd.append('need_open_comment0', '0');
        fd.append('show_cover_pic0', '1');
        fd.append('copyright_type0', '0');
        fd.append('can_reward0', '0');
        fd.append('mediaapi_publish_status0', '0');
        fd.append('fee_type0', '');
        fd.append('pay_fee0', '0');
        fd.append('pay_album_info0', '');
        fd.append('is_set_sync_to_finder0', '0');
        x.send(fd);
        return x.responseText;
    }})()"""

    result_str = await cdp_eval(ws, create_js, msg_id=21)
    return result_str


async def main():
    parser = argparse.ArgumentParser(description="Publish WeChat draft via CDP")
    parser.add_argument("--title", required=True, help="Article title (≤64 chars)")
    parser.add_argument("--file", required=True, help="Path to body HTML file")
    parser.add_argument("--digest", default="", help="Article digest (≤120 chars)")
    parser.add_argument("--del", dest="delete_id", help="Draft appMsgId to delete before creating")
    args = parser.parse_args()

    # Read body HTML
    if not os.path.exists(args.file):
        print(f"❌ File not found: {args.file}", file=sys.stderr)
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        body_html = f.read().strip()

    print(f"body: {len(body_html)}")

    # Install websockets if needed
    try:
        import websockets
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
        import websockets

    # Connect to Chrome
    ws_url = await get_ws_url()

    async with websockets.connect(ws_url, max_size=50 * 1024 * 1024) as ws:
        # Get token
        token = await get_token(ws)
        print(f"token: {token}")

        # Delete old draft if requested
        if args.delete_id:
            print(f"Deleting draft {args.delete_id}...")
            await delete_draft(ws, token, args.delete_id)

        # Create draft
        print("Creating draft...")
        result_str = await create_draft(ws, token, args.title, body_html, args.digest)

        if not result_str:
            print("❌ Empty response from API", file=sys.stderr)
            sys.exit(1)

        try:
            data = json.loads(result_str)
        except json.JSONDecodeError as e:
            print(f"❌ Cannot parse API response: {e}", file=sys.stderr)
            print(f"   Raw: {result_str[:300]}", file=sys.stderr)
            sys.exit(1)

        ret = data.get("ret")
        base_ret = data.get("base_resp", {}).get("ret")
        app_msg_id = data.get("appMsgId") or data.get("appmsgid")
        err_msg = data.get("base_resp", {}).get("err_msg", "")

        if ret == 0 or ret == "0" or base_ret == 0 or base_ret == "0":
            content_len = 0
            filtered = data.get("filter_content_html", [])
            if filtered and filtered[0].get("content"):
                content_len = len(filtered[0]["content"])
            print(f"✅ {app_msg_id} content: {content_len}")
        else:
            print(f"❌ ret={ret} base_ret={base_ret} msg={err_msg}")
            sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
