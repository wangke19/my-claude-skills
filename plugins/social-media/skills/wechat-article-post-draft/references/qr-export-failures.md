# QR 码导出失败模式（2026-06-14 验证）

## 问题：`fetch(img.src)` 返回空

在 CDP Chrome 中尝试通过 `fetch(img.src)` 获取原始 QR 码 JPEG 时，返回 `NO_IMG`。

**原因**：CDP Chrome 的 `fetch` 在 headless 模式下可能无法正确加载 `<img>` 标签的 `src` 属性（DOM 渲染不完整）。

**替代方案**：CDP `Page.captureScreenshot` → 用 Pillow 裁剪 QR 区域 → 发送。虽然图片较大但可靠性更高。

## 问题：CDP Chrome 裁剪的 QR 码用户无法扫描

CDP Chrome 截图中的 QR 码可能被压缩或裁剪不当，导致用户微信扫描失败。

**根本原因**：CDP Chrome 的 `--headless=new` 模式渲染的页面可能与真实浏览器不同，QR 码的像素精度受影响。

## 问题：CDP Chrome `--headless=new` 模式下 DOM 为空，QR 码完全不渲染（2026-06-14 验证）

- **现象**：`document.body.innerHTML` 为空字符串，页面加载后无任何 DOM 内容
- **根因**：WeChat 登录页依赖 JS 动态渲染 QR 码，`--headless=new` 不执行 JS
- **修复**：必须用 Xvfb 虚拟显示器启动 Chromium：
  ```bash
  xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" \
    chromium --remote-debugging-port=9222 --no-first-run \
    --no-default-browser-check --disable-gpu \
    --user-data-dir=/home/kewang/.hermes/chrome-profile
  ```
- **前提**：`dpkg -l | grep xvfb` 确认已安装，未安装则 `apt install xvfb`
- **验证**：`curl http://127.0.0.1:9222/json/version` 确认 CDP 响应
- **注意**：`--disable-headless` 在无显示器环境会启动 GUI 报错，Xvfb 是唯一可行方案

## 问题：用户反馈裁剪位置不对，反复修正

- **现象**：用户说"QR 码偏左""偏右""只看到一角"，需要多次调整坐标
- **修复**：先发送**完整页面截图**让用户确认 QR 码位置，确认后再裁剪。不要直接发裁剪图让用户猜坐标
- **流程**：完整页面截图 → 用户确认"位置对的"/"往左X像素" → 发送裁剪版 QR 码 → 用户扫描

## 建议**：如果 QR 码扫描失败超过 2 次，切换到备选方案：
1. 让用户手动登录 CDP Chrome profile（通过 `--user-data-dir` 指定的目录）
2. 或者让用户在本地浏览器登录后，提供 token 和 cookie 供脚本直接使用
