# CDP Chrome 独立 Profile 账号隔离问题

## 问题描述

`scripts/publish-draft.py` 使用的 Chrome 无头浏览器通过 `--user-data-dir=/home/kewang/.hermes/chrome-profile` 启动，这是一个**独立的浏览器配置**，与用户个人浏览器完全隔离。

**关键风险**：
- CDP Chrome 登录的公众号账号 **可能与用户个人账号不同**
- 草稿创建成功但用户在自己的公众号后台找不到
- 即使看到 `mp.weixin.qq.com` 显示"公众号"主页，也可能登录的是另一个账号

## 验证方法

```bash
# 1. 检查 Chrome 9222 端口的登录状态
curl -s "http://127.0.0.1:9222/json" | python3 -c "import sys,json; tabs=json.load(sys.stdin); [print(f'{t[\"title\"]}: {t[\"url\"]}') for t in tabs]"

# 2. 确认 tab URL 中的 token 与用户预期账号一致
# 3. 发布后，让用户在自己的公众号后台确认草稿是否存在
```

## 解决方案

| 方案 | 适用场景 | 说明 |
|------|----------|------|
| **手动确认** | 单账号用户 | 发布后让用户登录自己的公众号后台，在草稿箱中搜索草稿 ID |
| **多账号支持** | 多公众号用户 | 参考 `references/multi-account.md` 配置不同账号的 Chrome profile |
| **浏览器粘贴方法** | 账号不匹配时 | 改用 `scripts/wechat-article.ts`，需要用户本地浏览器登录 |

## 发布前检查清单

- [ ] Chrome 9222 端口有已登录的 `mp.weixin.qq.com` tab
- [ ] 确认 tab URL 中的 token 与用户预期账号一致
- [ ] 发布后让用户在自己的公众号后台确认草稿是否存在
- [ ] 如果草稿箱找不到文章 → 说明创建在另一个公众号账号下

## 会话记录

**2026-06-05 验证**：
- 使用 `publish-draft.py` 成功创建草稿 ID `100000968`
- 用户反馈"草稿箱里没有发现文章"
- 原因：CDP Chrome 登录的公众号账号与用户个人账号不同
- 解决方案：改用 `wechat-article-generator` 生成 HTML，让用户手动复制粘贴到微信编辑器
