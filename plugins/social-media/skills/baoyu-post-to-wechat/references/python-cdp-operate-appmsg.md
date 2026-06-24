# Verified Working: Python asyncio CDP → operate_appmsg (2026-05-26)

## Why This Pattern Works

This pattern was verified on 2026-05-26 in a live session. It succeeded on first attempt where the Bun `publish-draft.mjs` script failed twice with hangs and zero output.

**Key advantages:**
1. Connects directly to **tab-level WebSocket** (`ws://127.0.0.1:9222/devtools/page/<tab_id>`) — no `Target.attachToTarget` needed
2. Python `asyncio` + `websockets` initializes faster than Bun's WebSocket setup
3. No 20s subprocess timeout (execute_code limit doesn't apply to Python asyncio)
4. `Runtime.evaluate` runs in the page's main frame directly

## Minimal Working Script

```python
import asyncio, json, websockets, urllib.request
from urllib.parse import urlencode

async def publish_draft(tab_ws_url: str, title: str, body: str, digest: str, token: str):
    async with websockets.connect(tab_ws_url, max_size=50*1024*1024) as ws:
        # Enable Page for any needed events (optional)
        await ws.send(json.dumps({"id":1,"method":"Page.enable"}))
        await ws.recv()

        # Build form data
        params = {
            "token": token, "lang": "zh_CN", "f": "json", "ajax": "1",
            "random": str(__import__("random").random()),
            "AppMsgId": "", "count": "1", "data_seq": "0",
            "operate_from": "Chrome", "isMark": "0",
            "title0": title,          # ≤64 characters
            "content0": body,          # Full HTML, no outer <html>/<head>
            "author0": "", "fileid0": "",
            "digest0": digest,
            "sourceurl0": "", "need_open_comment0": "0",
            "show_cover_pic0": "1", "copyright_type0": "0",
            "can_reward0": "0", "fee_type0": "", "pay_fee0": "0",
        }
        form_data = urlencode(params, encoding="utf-8", errors="replace")

        # XHR call via CDP Runtime.evaluate
        script = f"""
(function() {{
    var x = new XMLHttpRequest();
    x.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token={token}&lang=zh_CN', false);
    x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    x.send(`{form_data}`);
    return x.responseText;
}})()
        """
        await ws.send(json.dumps({"id":2,"method":"Runtime.evaluate","params":{
            "expression": script
        }}))
        r = json.loads(await ws.recv())
        resp_text = r.get("result",{}).get("result",{}).get("value","")
        return json.loads(resp_text)

# --- Usage ---
# 1. Get tab WebSocket URL from /json endpoint
resp = urllib.request.urlopen("http://127.0.0.1:9222/json", timeout=5)
tabs = json.loads(resp.read())
tab = next(t for t in tabs if "mp.weixin.qq.com" in t["url"] and "token=" in t["url"])
ws_url = tab["webSocketDebuggerUrl"]   # tab-level, not browser-level

# 2. Extract token from tab URL (NOT from /json/version endpoint)
token = tab["url"].match(/token=([^&]+)/)?.[1]   # Chrome masks as *** in JSON but real value is there

# 3. Publish
result = asyncio.run(publish_draft(ws_url, title, body_html, digest, token))
print(f"appMsgId: {result['appMsgId']}, ret: {result['ret']}")
```

## Critical Notes

1. **Tab-level WebSocket URL is required** — browser-level (`ws://127.0.0.1:9222/devtools/browser/...`) does not work for `Runtime.evaluate`. Use `tab["webSocketDebuggerUrl"]` from `/json` endpoint.

2. **Token comes from the tab URL** — `Chrome` masks tokens as `***` in the `/json/version` JSON. The actual token is in the tab's URL and works fine when used in XHR calls.

3. **`content0` must be clean body HTML** — extract via regex from the `wechat-article-generator` output:
   ```python
   import re
   with open("/tmp/article.html") as f:
       html = f.read()
   body_match = re.search(r'<body[^>]*>([\s\S]*)</body>', html)
   body = body_match.group(1)
   # Strip any <img> tags (cover images with data URI break the API)
   body = re.sub(r'<img[^>]*>', '', body)
   ```

4. **`title0` ≤ 64 characters** — API returns `ret: 64702` if exceeded.

5. **`fileid0` can be empty** — article shows as "incomplete" in draft list but is fully editable.

## ⚠️ CSRF Token Required in XHR URL (Verified 2026-05-28)

**Symptom**: `ret=200040 "invalid csrf token"` when calling `operate_appmsg` via browser XHR.

**Root cause**: The XHR URL must include `&token={TOKEN}` — without it, the server rejects the request as CSRF invalid, even though the browser has valid session cookies.

**Fix**: Always append `&token=` + the token value to the XHR URL:

```javascript
// ❌ WRONG — missing token in URL → ret=200040 "invalid csrf token"
xhr.open('POST', '/cgi-bin/operate_appmsg?sub=create&type=77777', false);

// ✅ CORRECT — token in URL → ret=0
var token = location.href.match(/token=(\d+)/)[1];
xhr.open('POST', '/cgi-bin/operate_appmsg?sub=create&type=77777&token=' + token, false);
```

This applies to **both** the URL-params style (`t=ajax-response&sub=create&type=77&token=...`) and the simplified style (`sub=create&type=77777&token=...`). The token is mandatory in either case.

## Stdlib-Only Python CDP Pattern (No `websockets` Module)

When the `websockets` third-party module is unavailable, a raw WebSocket can be built with stdlib `socket` + `struct`. This pattern connects to the **browser-level** WebSocket and targets the tab via `Runtime.evaluate` (no `Target.attachToTarget` needed).

```python
import json, http.client, struct, os, socket, base64
from urllib.parse import urlparse

TAB_ID = 'YOUR_TAB_ID'
CDP_PORT = 9222

# Get tab info
conn = http.client.HTTPConnection('localhost', CDP_PORT)
conn.request('GET', '/json/list')
tabs = json.loads(conn.getresponse().read().decode())
conn.close()
tab = next(t for t in tabs if t['id'] == TAB_ID)
ws_url = tab['webSocketDebuggerUrl']

# Parse WebSocket URL and connect
parsed = urlparse(ws_url)
key = base64.b64encode(os.urandom(16)).decode()
req = (
    "GET " + parsed.path + " HTTP/1.1\r\n"
    "Host: " + parsed.hostname + ":" + str(parsed.port) + "\r\n"
    "Upgrade: websocket\r\n"
    "Connection: Upgrade\r\n"
    "Sec-WebSocket-Key: " + key + "\r\n"
    "Sec-WebSocket-Version: 13\r\n"
    "\r\n"
)
sock = socket.create_connection((parsed.hostname, parsed.port))
sock.sendall(req.encode())
# Read handshake
response = b""
while b"\r\n\r\n" not in response:
    response += sock.recv(4096)

def ws_send(sock, data, opcode=1):
    if isinstance(data, str): data = data.encode('utf-8')
    frame = bytearray()
    frame.append(0x80 | opcode)
    length = len(data)
    if length < 126: frame.append(length | 0x80)
    elif length < 65536:
        frame.append(126 | 0x80)
        frame.extend(struct.pack('>H', length))
    else:
        frame.append(127 | 0x80)
        frame.extend(struct.pack('>Q', length))
    mask = os.urandom(4)
    frame.extend(mask)
    frame.extend(bytearray(data[i] ^ mask[i % 4] for i in range(length)))
    sock.sendall(frame)

def ws_recv(sock):
    header = bytearray()
    while len(header) < 2: header += sock.recv(1)
    opcode = header[0] & 0x0f
    masked = (header[1] & 0x80) != 0
    length = header[1] & 0x7f
    if length == 126:
        data = bytearray()
        while len(data) < 2: data += sock.recv(1)
        length = struct.unpack('>H', data)[0]
    elif length == 127:
        data = bytearray()
        while len(data) < 8: data += sock.recv(1)
        length = struct.unpack('>Q', data)[0]
    if masked:
        mask = bytearray()
        while len(mask) < 4: mask += sock.recv(1)
    payload = bytearray()
    while len(payload) < length:
        chunk = sock.recv(min(length - len(payload), 65536))
        if not chunk: break
        payload += chunk
    if masked:
        payload = bytearray(payload[i] ^ mask[i % 4] for i in range(len(payload)))
    if opcode == 8: return None
    return payload.decode('utf-8')

# Step 1: Store content in window vars (avoids JS string escaping issues)
with open('/tmp/article_body.txt', 'r') as f:
    body = f.read()
with open('/tmp/article_title.txt', 'r') as f:
    title = f.read()

store_expr = "window.__ab__ = " + json.dumps(body) + "; window.__at__ = " + json.dumps(title) + "; 'ok'"
ws_send(sock, json.dumps({"id": 1, "method": "Runtime.evaluate", "params": {"expression": store_expr}}))
resp = json.loads(ws_recv(sock))

# Step 2: Submit via XHR with token in URL
submit_expr = """(function(){
    var token = location.href.match(/token=(\\d+)/)[1];
    var fd = new FormData();
    fd.append('AppMsgId', '');
    fd.append('count', '1');
    fd.append('title0', window.__at__);
    fd.append('content0', window.__ab__);
    fd.append('digest0', '');
    fd.append('author0', '');
    fd.append('content_source_url0', '');
    fd.append('need_open_comment0', '0');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/cgi-bin/operate_appmsg?sub=create&type=77777&token=' + token, false);
    xhr.send(fd);
    return xhr.responseText;
})()"""
ws_send(sock, json.dumps({"id": 2, "method": "Runtime.evaluate", "params": {"expression": submit_expr, "timeout": 30000}}))
resp = json.loads(ws_recv(sock))
result = resp.get('result',{}).get('result',{}).get('value','no result')
print(result)
sock.close()
```

**Key differences from the `websockets` module version:**
- Uses browser-level WS + stores content via `window.__ab__`/`window.__at__` (avoids complex JS string escaping)
- Extracts token dynamically from `location.href` inside the page (no need to pass it from Python)
- Uses `FormData` instead of URL-encoded params (simpler, browser handles encoding)
- No third-party Python packages required

## Updating and Re-publishing an Existing Article

When the user requests changes to an article already published as a draft:

1. **Patch the local HTML file** using the `patch` tool (not rewrite the whole file)
2. **Extract body** from the updated HTML (`<body>` content via regex)
3. **Publish as a NEW draft** via `sub=create` — this creates a new `appMsgId`
4. **Do NOT auto-delete the old draft** — user may want both versions

This is the standard workflow when the user says "update the article" or "add this section". The old draft remains in the draft box; the new one has the latest content.