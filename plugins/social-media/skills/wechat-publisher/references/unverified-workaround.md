# Unverified Account Workarounds

## Problem

Unverified subscription accounts (未认证订阅号) get `errcode: 48001, api unauthorized` on nearly all write APIs. Only basic network APIs (`getcallbackip`, `get_api_domain_ip`) work.

Test command:
```bash
source <(grep WECHAT ~/.hermes/.env | sed 's/^/export /')
TOKEN=$(curl -s "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
curl -s -X POST "https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"articles": [{"title": "test", "content": "<p>test</p>"}]}'
# Returns: {"errcode":48001,"errmsg":"api unauthorized"}
```

## Option 1: WeChat Verification (Recommended)

- Cost: 300 RMB/year
- Path: mp.weixin.qq.com → 设置 → 微信认证
- Unlocks: All draft/media/user/template APIs
- After verification, wenyan-cli works out of the box

## Option 2: Playwright MCP (Browser Automation)

Use headless browser to simulate human operating mp.weixin.qq.com backend.

### Installation
```bash
npm install -g @playwright/mcp
npx playwright install chromium
```

### Hermes config (~/.hermes/config.yaml)
Add to MCP servers section:
```yaml
mcp_servers:
  - name: playwright
    command: npx
    args: ["@playwright/mcp@latest"]
```

### Workflow
1. Agent opens mp.weixin.qq.com via Playwright
2. First time: user scans QR code to login (session persists in cookies)
3. Agent navigates to draft editor, pastes formatted HTML, uploads images
4. Saves as draft — user publishes manually

### Resource Requirements
- Chromium headless: ~200-400MB RAM
- Not ideal for servers with <2GB RAM (this server has ~1.9GB)
- Consider running only during publish, then closing browser

### Limitations
- WeChat backend may detect automation (use stealth plugins)
- Session cookies expire, need periodic re-login
- UI changes on mp.weixin.qq.com break selectors

## Option 3: Manual Publish

AI does all content work (research, writing, formatting, preview). User copies final HTML to WeChat backend manually.

1. Agent writes article, saves as Markdown
2. Agent renders HTML: `wenyan render -f article.md -o article.html`
3. User opens article.html, copies content
4. User pastes into mp.weixin.qq.com draft editor
5. User publishes manually

This is the simplest approach with no extra dependencies.

## Option 4: Obscura (Rust Headless Browser) — Low-Resource Alternative

Obscura is a Rust-based headless browser purpose-built for AI agents. Only ~30MB RAM vs 200-400MB for Chromium. CDP-compatible (drop-in for Puppeteer/Playwright).

### Resource Comparison

| Metric | Obscura | Chromium headless |
|--------|---------|-------------------|
| Memory | ~30 MB | 200-400 MB |
| Binary | ~70 MB | 300+ MB |
| Page load | ~85 ms | ~500 ms |
| Stealth | Built-in | Requires plugins |

### Installation (ARM64 Linux — build from source)

Pre-built binaries only available for x86_64-linux, aarch64-macos, x86_64-windows. ARM64 Linux must compile:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# Clone and build
git clone --depth 1 https://github.com/h4ckf0r0day/obscura.git /tmp/obscura
cd /tmp/obscura
cargo build --release --features stealth    # ~20-40 min on ARM Cortex-A53

# Install
cp target/release/obscura ~/.local/bin/
```

### Usage

```bash
# Start CDP server
obscura serve --port 9222 --stealth

# Fetch a page
obscura fetch https://mp.weixin.qq.com --stealth

# Use with Puppeteer/Playwright
# Connect to: ws://127.0.0.1:9222
```

### Hermes Integration

Hermes has an open feature request (issue #15445) for Obscura as a browser provider. Until merged, use via:
- Obscura CDP server + Playwright MCP (`@playwright/mcp`) pointing to `ws://127.0.0.1:9222`
- Or direct CDP calls via Python/Node scripts

### Limitations
- ARM64 Linux requires source compilation (~40 min, 500MB+ disk)
- Not all CDP domains fully implemented (see GitHub for coverage)
- Build requires Rust toolchain (~1.5GB installed)

## Relevant Tools Found

| Tool | Type | API Required | RAM | Notes |
|------|------|:-:|-----|-------|
| wenyan-cli | CLI publisher | Yes (48001 without) | ~30MB | Already installed |
| wechat-official-account-mcp | MCP server | Yes (48001 without) | ~50MB | 15 tools, same API limit |
| wechat-publisher-mcp | MCP server | Yes (48001 without) | ~50MB | 2 tools, same API limit |
| **Obscura** | Headless browser | **No** | **~30MB** | **Best for low-resource servers** |
| Playwright MCP | Browser automation | No | 200-400MB | Best for powerful servers |
| social-auto-upload | Video uploader | No | 200-400MB | Video only, not articles |

## Decision Matrix

| Your Situation | Recommended Option |
|----------------|-------------------|
| Can afford 300 RMB/year | **Option 1** (WeChat verification) |
| Server has 2GB+ RAM | **Option 2** (Playwright MCP) |
| Server is low-resource (<2GB) | **Option 4** (Obscura) |
| Don't want any dependencies | **Option 3** (Manual publish) |
