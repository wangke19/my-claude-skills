# QR Code Extraction Failure — 2026-06-14

## Problem

Attempting to extract WeChat login QR code from CDP Chrome for `publish-draft.py`.

### Attempted Methods (All Failed)

1. **`fetch(img.src)` raw JPEG** — `document.querySelector('img[src*="scanloginqrcode"]')` returned null. WeChat's login page uses `<canvas>` to render the QR code, not an `<img>` element. The fetch approach silently returns NO_IMG.

2. **`Page.captureScreenshot` + Pillow crop** — Full page screenshot (780x503, 13KB) saved, then cropped to QR area (218x176). Sent via Feishu but user reported they couldn't see/scan the QR code. Issues:
   - Hardcoded crop coordinates don't adapt to page layout changes
   - Feishu compresses the image further
   - QR code becomes too small/blurry to scan

3. **`browser_vision`** — Can visually confirm QR exists but cannot extract or send it as a scannable image.

## Root Cause

WeChat's login page renders QR as a `<canvas>` element, not an `<img>`. The skill's QR extraction code assumed an `<img>` element, which is incorrect for the current version of the WeChat login page.

## Workaround

- Have user manually open `https://mp.weixin.qq.com/` in their own browser and log in
- Or: extract `token=` value from user's browser URL and use it directly in XHR calls (bypassing CDP Chrome entirely)

## Files Referenced

- `../../SKILL.md` — updated with this failure pattern
