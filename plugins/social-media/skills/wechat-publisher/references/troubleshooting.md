# Troubleshooting Guide

## 1. IP not in whitelist

**Error:** `ip not in whitelist`

**Fix:**
1. Get your public IP: `curl ifconfig.me`
2. Login to https://mp.weixin.qq.com/
3. Development > Basic Config > IP Whitelist > Add your IP
4. Retry

## 2. wenyan-cli not installed

**Error:** `wenyan: command not found`

**Fix:** `npm install -g @wenyan-md/cli`

## 3. Environment variables not set

**Error:** `WECHAT_APP_ID is required`

**Fix:** Add to ~/.hermes/.env:
```
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

Or run: `source scripts/setup.sh`

## 4. Missing frontmatter (most common!)

**Error:** `未能找到文章封面`

**Fix:** Add frontmatter at the very top:
```markdown
---
title: Article Title
---
```

- `title` is **required**
- `cover` is optional (first inline image used automatically)

## 5. Image upload failed

**Error:** `Failed to upload image`

**Check:**
- Path is correct: `ls -lh /path/to/image.jpg`
- Format is jpg/png/gif
- Size < 10MB
- Network images are accessible

## 6. Invalid credentials

**Error:** `invalid credential`

**Fix:** Verify AppID/AppSecret at https://mp.weixin.qq.com/ > Development > Basic Config

## 7. Node.js too old

**Error:** `Requires Node.js >= 14.0.0`

**Fix:** `brew upgrade node` or `nvm install stable`

## 8. Network timeout

**Error:** `connect ETIMEDOUT`

**Fix:** Check `curl -I https://api.weixin.qq.com`, set proxy if needed

## 9. Debug mode

```bash
export DEBUG=wenyan:*
wenyan publish -f article.md -t lapis -h solarized-light
```

## 10. API returns 48001 (api unauthorized)

**Error:** `{"errcode":48001,"errmsg":"api unauthorized"}`

**Cause:** Unverified subscription account (未认证订阅号). Most write APIs require account verification.

**Fix:** Complete WeChat verification (300 RMB/year) at mp.weixin.qq.com → 设置 → 微信认证. Alternatively, use Playwright MCP for browser automation or manual publish. See `references/unverified-workaround.md`.

## 11. Node.js too old for wenyan-cli

**Error:** `SyntaxError: Unexpected token 'with'` when running wenyan

**Fix:** wenyan-cli v2.0+ requires Node >= 20. Node v18 does not support `import ... with { type: "json" }` syntax.
```bash
# Upgrade Node.js (ARM64 example)
cd /tmp && curl -sL https://registry.npmmirror.com/-/binary/node/v22.16.0/node-v22.16.0-linux-arm64.tar.xz -o node-v22.tar.xz
sudo tar -xJf node-v22.tar.xz -C /opt/
# Create symlinks in ~/.local/bin/
for cmd in node npm npx wenyan; do ln -sf /opt/node-v22.16.0-linux-arm64/bin/$cmd ~/.local/bin/$cmd; done
```

## 12. Dynamic IP breaks whitelist

**Symptom:** Works one day, `ip not in whitelist` the next.

**Cause:** Home broadband has dynamic IPv4 (changes on router restart).

**Fix:** Re-check IP and update whitelist:
```bash
python3 -c "import urllib.request; print(urllib.request.urlopen('http://ipv4.icanhazip.com',timeout=10).read().decode().strip())"
```
Then add new IP at mp.weixin.qq.com → 开发 → 基本配置 → IP白名单.

Note: `curl ifconfig.me` may return IPv6 on dual-stack networks. Use the python3 command or `curl -4` to force IPv4.

## 13. npm global bin not in PATH

**Symptom:** Package installed globally but `command not found`.

**Cause:** Node.js installed to `/opt/node-vXX/` but its `bin/` not in PATH.

**Fix:** Symlink to `~/.local/bin/` (which is in PATH):
```bash
ln -sf /opt/node-v22.16.0-linux-arm64/bin/wenyan ~/.local/bin/wenyan
```

## Best Practices

1. Always add frontmatter with `title`
2. Include at least one image (auto-used as cover)
3. Test with `wenyan render` before publishing
4. Checklist: frontmatter title, image, env vars, IP whitelist
5. For unverified accounts: verify first, or use Playwright/browser automation
6. After router restart: re-check IPv4 and update WeChat IP whitelist
