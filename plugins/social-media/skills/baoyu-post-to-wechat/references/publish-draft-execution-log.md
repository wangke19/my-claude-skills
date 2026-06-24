# 微信公众号发布：bun publish-draft.mjs 执行实录

## 典型执行时序（2026-05-22 验证）

```
背景进程启动（session_id=proc_xxx）
  ↓
~0-60s:   进程运行中，stdout 完全为空（无任何输出）
  ↓ 60s 强制中断（process(wait) 被 clamp 到 60s）
→ 返回 timeout，但进程仍在运行
  ↓
~60-138s: 进程继续运行，stdout 仍为空
  ↓
~138s:    进程结束，stdout 突然打印所有缓冲输出
          stty: 'standard input': Inappropriate ioctl for device
          body: 10010
          Creating draft...
          ret: 0 id: 100000701
          ✅ 100000701 content: 10126
          exit_code: -15 (SIGTERM 来自 process(kill) 主动终止)
```

**注意**：即使调用了 `process(action="kill")` 终止进程，stdout 仍可能被 flush 出来。

## 判断规则

| 症状 | 结论 | 操作 |
|------|------|------|
| 进程 running + stdout 空，< 90s | 正常执行中 | 等，不要 kill |
| 进程 running + stdout 空，> 120s | **可能是 flush 延迟**，非真正挂起 | 等 |
| exit code 124（超时），但有 `ret: 0` + `appMsgId` | **已成功**，草稿已创建 | 查草稿箱确认 |
| exit code -15（SIGTERM） | 被主动 kill，需检查是否有 `ret: 0` | 确认草稿是否已创建 |
| 进程完全消失 + 无 ret 输出 | 可能失败 | 重跑 |

## 为什么 stdout 长时间为空？

`publish-draft.mjs` 使用 Chrome CDP（WebSocket）操作，是 I/O 密集型的异步流程：
1. 连接 WebSocket
2. 操作 DOM（表单填写、点击）
3. 截图/截图校验
4. 调用 API

每一步都可能静默等待（页面加载、API 响应），stdout 被缓冲，直到进程结束才一起 flush。

**不要以"有没有输出"判断进程是否存活。**

## Chrome 必须就绪

确认 Chrome 已启动且已扫码登录（登录 mp.weixin.qq.com）：

```bash
curl http://127.0.0.1:9222/json/version
# 应返回 WebSocket URL，说明 Chrome 在运行
```

登录二维码获取方式：用 CDP 的 `Page.captureScreenshot` 截图，通过飞书发给你扫码。

## 草稿箱验证

`operate_appmsg` 返回 `ret: 0` 即表示草稿创建成功，appMsgId 就是草稿 ID。草稿箱 API（`draft_list`）的 `content` 字段永远为空，不要用它验证。
