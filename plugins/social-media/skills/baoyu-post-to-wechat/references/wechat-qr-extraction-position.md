# WeChat QR Code Extraction — Position Pitfalls

## Problem
When extracting the QR code from the WeChat Official Accounts Platform login page, naive coordinate estimates often land on the wrong area — showing the "登录" label or blank space instead of the actual QR code.

## Root Cause
The WeChat login page has a cosmic-space themed banner with a white login panel on the RIGHT side. The QR code is inside that panel. Early attempts cropped from the wrong x-coordinate, landing on the left portion of the panel (which shows the "登录" text).

## Correct Coordinates (tested 2026-06-14)

For a 780×503 page:
- **Full page**: `img.crop((0, 0, 780, 503))`
- **Login panel**: `img.crop((int(w*0.50), int(h*0.10), int(w*0.82), int(h*0.55)))`
- **QR code only**: `img.crop((int(w*0.55), int(h*0.12), int(w*0.78), int(h*0.52)))`

Then scale up 2-3x for scanability.

## Verification Step
Before sending QR to user, ALWAYS verify with `vision_analyze` on the cropped image:
1. Check the full page screenshot first — confirm the login panel is visible
2. Check the cropped QR — confirm it's a scannable QR code (not text or blank)
3. Only then send to user

## Common Mistakes
- Cropping from x < 50% — lands on banner text or left side
- Using hardcoded pixel values instead of percentage-based — breaks on different screen sizes
- Not scaling up — QR codes need to be at least 300px wide to scan reliably
