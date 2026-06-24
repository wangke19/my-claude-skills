#!/usr/bin/env python3
"""
微信公众号草稿发布脚本 (Python CDP)

通过 Chrome DevTools Protocol 连接本地 Chromium，
调用微信公众平台 operate_appmsg API 创建草稿。

用法:
  venv/bin/python publish-draft.py --title "标题" --file body.html [--digest "摘要"] [--del OLD_ID]

依赖: websockets (pip install websockets)
"""

import argparse
import json
import os
import re
import subprocess
import sys
import time

try:
    import websockets
except ImportError:
    print("错误: 缺少 websockets 依赖")
    print("安装: ~/.hermes/hermes-agent/venv/bin/pip install websockets")
    sys.exit(1)

CDP_PORT = 9222
CDP_HOST = "127.0.0.1"
WS_BASE = f"ws://{CDP_HOST}:{CDP_PORT}"


def get_ws_url():
    """获取 CDP WebSocket 调试 URL"""
    try:
        result = subprocess.run(
            ["curl", "-s", f"http://{CDP_HOST}:{CDP_PORT}/json/version"],
            capture_output=True, text=True, timeout=5
        )
        data = json.loads(result.stdout)
        return data["webSocketDebuggerUrl"]
    except Exception as e:
        print(f"错误: 无法连接 Chromium CDP ({CDP_HOST}:{CDP_PORT})")
        print(f"  详情: {e}")
        print(f"  确认 Chromium 正在运行: chromium --remote-debugging-port={CDP_PORT}")
        sys.exit(1)


def get_target_page():
    """获取微信公众号后台页面"""
    try:
        result = subprocess.run(
            ["curl", "-s", f"http://{CDP_HOST}:{CDP_PORT}/json"],
            capture_output=True, text=True, timeout=5
        )
        tabs = json.loads(result.stdout)
    except Exception:
        print("错误: 无法获取 Chrome 标签页列表")
        sys.exit(1)

    # 优先找公众号后台页面
    for tab in tabs:
        url = tab.get("url", "")
        if "mp.weixin.qq.com" in url:
            return tab

    # fallback: 用第一个非空白页
    for tab in tabs:
        url = tab.get("url", "")
        if url and not url.startswith("chrome") and "devtools" not in url:
            return tab

    print("错误: 没有找到可用的 Chrome 标签页")
    sys.exit(1)


async def run_publish(title, body_content, digest="", delete_id=""):
    """执行发布流程"""
    import asyncio

    ws_url = get_ws_url()
    target = get_target_page()
    target_id = target["id"]

    async with websockets.connect(ws_url, max_size=10 * 1024 * 1024) as ws:
        # Step 1: 获取 token (三级 fallback)
        token_js = """
        (function() {
            // 1. 全局变量
            if (window.__token) return window.__token;
            // 2. Cookie
            var m = document.cookie.match(/sl_gw_upload_token=([^;]+)/);
            if (m && m[1]) return m[1];
            // 3. URL 参数
            var p = new URLSearchParams(location.search);
            var t = p.get('token');
            if (t) return t;
            return '';
        })()
        """

        token_result = await send_cdp(ws, target_id, "Runtime.evaluate", {
            "expression": token_js,
            "returnByValue": True
        })
        token = token_result.get("result", {}).get("value", "")

        if not token:
            print("错误: 获取微信 token 失败")
            print("  可能需要重新扫码登录微信公众平台")
            return False

        # Step 2: 删除旧草稿（可选）
        if delete_id:
            delete_js = f"""
            new Promise((resolve) => {{
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/cgi-bin/operate_appmsg?t=ajax-response&sub=del&type=77&token=' + '{token}', false);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.send('token={token}&lang=zh_CN&f=json&ajax=1&AppMsgId={delete_id}');
                resolve(xhr.responseText);
            }})
            """
            del_result = await send_cdp(ws, target_id, "Runtime.evaluate", {
                "expression": delete_js,
                "returnByValue": True,
                "awaitPromise": True
            })
            print(f"删除旧草稿 {delete_id}: {del_result.get('result', {}).get('value', 'N/A')[:200]}")

        # Step 3: 创建新草稿
        if digest:
            auto_digest = "0"
        else:
            auto_digest = "1"
            digest = body_content.replace("<[^>]+>", "", 10)[:120]

        # 转义内容中的特殊字符
        escaped_content = json.dumps(body_content)
        escaped_title = json.dumps(title[:64])
        escaped_digest = json.dumps(digest[:120])

        create_js = f"""
        new Promise((resolve) => {{
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token={token}', false);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
            var params = 'token={token}&lang=zh_CN&f=json&ajax=1&AppMsgId=&count=1&data_seq=0'
                + '&title0=' + encodeURIComponent({escaped_title})
                + '&content0=' + encodeURIComponent({escaped_content})
                + '&digest0=' + encodeURIComponent({escaped_digest})
                + '&author0='
                + '&fileindex0='
                + '&sourceurl0='
                + '&need_open_comment0=0'
                + '&auto_gen_digest={auto_digest}';
            xhr.send(params);
            resolve(xhr.responseText);
        }})
        """

        create_result = await send_cdp(ws, target_id, "Runtime.evaluate", {
            "expression": create_js,
            "returnByValue": True,
            "awaitPromise": True
        })

        response_text = create_result.get("result", {}).get("value", "")

        if not response_text:
            print("错误: API 返回空响应")
            print("  可能 token 已过期，请重新扫码登录")
            return False

        try:
            resp_data = json.loads(response_text)
        except json.JSONDecodeError:
            print(f"错误: 无法解析 API 响应: {response_text[:500]}")
            return False

        ret = resp_data.get("ret", -1)

        if ret == 0:
            app_msg_id = resp_data.get("appMsgInfo", [{}])[0].get("id", resp_data.get("id", "unknown"))
            content_len = len(body_content)
            print(f"✅ {app_msg_id} content: {content_len}")
            return True
        elif ret == 200003:
            print(f"错误: token 无效或已过期 (ret={ret})")
            print("  请重新扫码登录微信公众平台")
            return False
        elif ret == 444002:
            print(f"错误: 旧版图文素材不可再保存 (ret={ret})")
            return False
        else:
            print(f"错误: API 返回 ret={ret}")
            print(f"  响应: {response_text[:500]}")
            return False


async def send_cdp(ws, target_id, method, params):
    """发送 CDP 命令到指定 target"""
    import asyncio

    # 连接到 page target
    page_ws_url = f"{WS_BASE}/page/{target_id}"

    # 直接用主 session 发送
    msg_id = int(time.time() * 1000) % 100000

    payload = {
        "id": msg_id,
        "method": method,
        "params": params
    }

    await ws.send(json.dumps(payload))

    # 等待响应
    while True:
        response = await asyncio.wait_for(ws.recv(), timeout=30)
        data = json.loads(response)

        if data.get("id") == msg_id:
            return data.get("result", {})


def main():
    parser = argparse.ArgumentParser(description="微信公众号草稿发布")
    parser.add_argument("--title", required=True, help="文章标题")
    parser.add_argument("--file", required=True, help="body HTML 文件路径")
    parser.add_argument("--digest", default="", help="摘要（可选）")
    parser.add_argument("--del", dest="delete_id", default="", help="删除旧草稿 ID")

    args = parser.parse_args()

    # 读取 body HTML
    if not os.path.exists(args.file):
        print(f"错误: 文件不存在: {args.file}")
        sys.exit(1)

    with open(args.file, "r", encoding="utf-8") as f:
        body_content = f.read().strip()

    if not body_content:
        print("错误: 文件内容为空")
        sys.exit(1)

    print(f"body: {len(body_content)}, title: {len(args.title)}")

    import asyncio
    success = asyncio.run(run_publish(
        title=args.title,
        body_content=body_content,
        digest=args.digest,
        delete_id=args.delete_id
    ))

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
