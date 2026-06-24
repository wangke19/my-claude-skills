# 排版模板：绿色自然风装饰体（原文精确复刻版 v4）

> 从 https://mp.weixin.qq.com/s/aj-W-LCHPoHGJIeTxiqCuw 页面源码直接扒取。
> v3 = 全部 7 个组件完整 + 段落 margin:0 0 2px + 无空行。
> v4 = 正文默认字号从 16px 调至 17px + 段落标题从 17px 调至 18px + 新增组件8：音乐推荐列表。

## 八大组件

### 1. 开头绿色装饰框

结构：外层flex容器 → 绿色圆点 → 绿色边框文字区 → 底部叶子图标

```html
<section style="width:100%;display:flex;justify-content:center;align-items:center;padding:0px 12px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="display:flex;justify-content:flex-start;align-items:center;flex-direction:column;width:100%;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 绿色圆点 -->
<section style="width:38px;height:38px;background:rgb(238,251,219);border-radius:50%;align-self:flex-start;margin-left:-8px;margin-bottom:-26px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><span leaf=""><br></span></section>
<!-- 绿框文字区 -->
<section style="width:100%;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;border:1px solid rgb(123,202,112);padding:14px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 段落放这里 -->
</section>
</section>
<!-- 底部叶子图标 -->
<section style="width:70px;height:10px;margin-right:38px;margin-top:-5px;align-self:flex-end;background:rgb(255,255,255);padding:0px 4px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="LEAF_IMG_URL" style="display:block;width:100%;height:auto;max-width:100%;box-sizing:border-box"></section>
</section>
</section>
```

**框内段落样式：**
- 标题行：`font-size:18px; color:rgb(18,18,18); font-weight:bold`
- 正文行：`font-size:15.456px; color:rgb(43,43,43); letter-spacing:0.51px; line-height:1.8`
- 加粗强调：`color:rgb(26,26,26); font-weight:700`

**图片 URL：**
- 叶子图标：`https://mmbiz.qpic.cn/mmbiz_png/NibWoZibcsqUCMGC12VemUm73To91bHUIQwUTAfqX2D1uAhuKCqfM9BVaEt6hSicINnmYjczlrdbiaffPjaYFyHWhQ/640`

### 2. 段落标题（左右GIF + 绿色下划线）

结构：flex居中 → 左GIF(41px) + 绿色文字(带下划线背景) + 右GIF(33px)

```html
<section style="width:100%;padding:0px 10px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;display:flex;justify-content:center;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="display:inline-flex;align-items:flex-end;justify-content:center;row-gap:0px;column-gap:0px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 左GIF -->
<section style="width:41px;flex:0 0 auto;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="LEFT_GIF_URL" style="display:block;width:100%;height:auto;max-width:100%;box-sizing:border-box"></section>
<!-- 绿色文字+下划线 -->
<section style="min-width:82px;max-width:320px;padding:0px 0px 5px;color:rgb(101,147,107);font-size:18px;font-weight:600;line-height:26px;letter-spacing:0px;text-align:center;word-break:break-word;background-image:url('UNDERLINE_URL');background-repeat:no-repeat;background-position:left bottom;background-size:100% 4px;box-sizing:border-box;overflow-wrap:break-word">
<span leaf="">标题文字</span>
</section>
<!-- 右GIF -->
<section style="width:33px;flex:0 0 auto;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="RIGHT_GIF_URL" style="display:block;width:100%;height:auto;max-width:100%;box-sizing:border-box"></section>
</section>
</section>
</section>
```

**关键样式值：**
- 文字颜色：`rgb(101,147,107)`（橄榄绿）
- 字号：`18px`，`font-weight:600`
- 下划线：background-image，`background-size:100% 4px`，`background-position:left bottom`
- 左GIF：41px 宽
- 右GIF：33px 宽

**图片 URL：**
- 左GIF：`https://mmbiz.qpic.cn/sz_mmbiz_gif/fMWwrTjiaSPnLhuaujuNkMpK0qaJL2dzbsAgiaWMFQcwKxicx2X0kLrLUOicBicevCxiaN4bpP0Gtmed5LtyHowk79wdiaFKMfBR8odzFsEsdptufY/640?from=appmsg`
- 右GIF：`https://mmbiz.qpic.cn/sz_mmbiz_gif/2PQIgQuy5xd1jUomOw3V3yptPYnrTcUt36HCO78Re4hkMW9jpAo56QdNszZ0VwHgVynE2jz3tL5ibicMxa09UiaOsrLDkzB5HXlBg9UeABhPy4/640?from=appmsg`
- 绿色下划线：`https://mmbiz.qpic.cn/sz_mmbiz_png/WbtS0spCgnWLicuWFiasCcIz3aicpPCArYnlt8U6Xnf2ZAqXmianlYIYxeLurnAwpqw6y6qcAs6jDLZmBEF7fymzLpOnpPHrlc8GiaAQcvibrF8tk/640?from=appmsg`

### 3. 正文区（左侧叶子装饰栏 + 虚线 + 段落文字）⭐ v3 新增

⚠️ 这是 v2 缺失的组件。原文正文不是裸 `<p>`，而是 flex 两栏布局：
- 左栏 10px：上叶子图标 → 绿色虚线 → 下叶子图标
- 右栏：文字段落
- 外层有右上角装饰背景图（188px 188px）

```html
<section style="max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;padding:0px 26px;background:url('BG_DECOR_URL') right top / 188px 188px no-repeat;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;padding:26px 0px 0px;display:flex;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 左侧装饰栏：上叶子+虚线+下叶子 -->
<section style="display:flex;flex-direction:column;justify-content:space-between;width:10px;flex-shrink:0;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="display:flex;justify-content:center;align-items:center;width:10px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="LEAF_SMALL_URL" style="background-color:transparent;max-width:100%;width:10px;height:10px;box-sizing:border-box"></section>
<section style="width:1px;height:100%;margin:5px auto;border-left-width:1.3px;border-left-style:dashed;border-left-color:rgb(155,201,95);max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><span leaf=""><br></span></section>
<section style="display:flex;justify-content:center;align-items:center;width:10px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="LEAF_SMALL_URL" style="background-color:transparent;max-width:100%;width:10px;height:10px;box-sizing:border-box"></section>
</section>
<!-- 右侧文字内容 -->
<section style="width:100%;text-align:left;padding:0px 0px 0px 15px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 段落放这里 -->
</section>
</section>
</section>
</section>
</section>
```

**左侧装饰栏关键样式：**
- 宽度：`10px`，`flex-shrink:0`
- 叶子图标：`10px × 10px`
- 虚线：`1.3px dashed rgb(155,201,95)`
- 布局：`flex-direction:column; justify-content:space-between`

**图片 URL：**
- 右上角装饰背景：`https://mmbiz.qpic.cn/sz_mmbiz_png/VFIIYQSBHXbIxWsMGqQpTN5V4ribM5Mj1dHUGMkPjVpzINpR4AIRoNS61go8ticIhAG1Qy5XD5Hg0nmYicgSXJicmjd0XI2Pic0Nrp7nEOYCsbQ0/640?from=appmsg`
- 左栏叶子图标：`https://mmbiz.qpic.cn/mmbiz_png/5upuicN3ZIJhMgib1c6hRSgEdDFr66LraibKj0miarOT0lSohPSqlobdp4WBEw2wABvrTtiaqDkCCpaiaiaYuZfKvtB6Vu7iaJnd6TIpVbEnicZtlQHc/640?from=appmsg`

### 4. 正文段落（放在正文区右栏内）⭐ v4 — 默认字号 16px

⚠️ **关键：`<p>` 必须加 `margin:0 0 2px 0`**（压到极紧，浏览器默认 ~16px 太松）。
⚠️ **段落之间不要放空行**（用户明确要求删除全部空行段落）。

```html
<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:start;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf="">正文内容</span></span>
</p>
```

加粗强调在 span 内加 `<strong>`。引用句/金句用 `font-size:18px`（同样加 `margin:0 0 2px 0`）。

### 5. 分割线装饰 ⭐ v3 新增

⚠️ 这是 v2 缺失的组件。章节之间的装饰性分割图，居中显示。

```html
<section style="display:flex;flex-direction:column;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="align-self:center;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:269px;height:13px;display:flex;justify-content:center;align-items:center;max-width:100%;overflow-wrap:break-word;box-sizing:border-box"><img src="DIVIDER_URL" style="max-width:100%;width:100%;height:auto;box-sizing:border-box"></section>
</section>
</section>
```

**图片 URL：**
- 分割线装饰图：`https://mmbiz.qpic.cn/mmbiz_png/qfxqqiaNXpPRg0pC1SWFx8QH9uMTFaGwOeyIFxMZTHgTc5gsU76iajaUE44Q0EHc0klY16YN8yzRSnqnlkqhGaOg/640`

### 6. 结语绿色装饰框

结构：浅绿背景圆角 → 绿色虚线边框 → 内容

```html
<section style="width:100%;padding:0px 10px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;display:flex;flex-direction:column;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 浅绿背景 + 圆角 -->
<section style="width:100%;padding:4px;display:flex;flex-direction:column;background-color:rgb(239,247,236);border-radius:14px;box-sizing:border-box;max-width:100%;overflow-wrap:break-word">
<!-- 绿色虚线边框 -->
<section style="width:100%;padding:12px;border:1px dashed rgb(168,217,154);border-radius:10px;display:flex;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="z-index:3;line-height:28px;letter-spacing:1px;text-align:justify;word-break:break-word;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<!-- 内容放这里 -->
</section>
</section>
</section>
</section>
</section>
```

**框内文字样式：**
- 正文：`color:rgb(51,51,51); font-size:17px; font-family:Optima-Regular,PingFangTC-light`
- 强调金句：`color:rgb(0,0,0); font-size:16px; font-weight:bold`

**关键色值：**
- 背景色：`rgb(239,247,236)`（极浅绿）
- 虚线色：`rgb(168,217,154)`（浅绿）
- 圆角：外14px，内10px

### 8. 音乐推荐列表 ⭐ v4 新增

结语框和 CTA 之间可插入音乐推荐区，用于嵌入音频文件。段落格式为独立可编辑的 `<p>`，占位符清晰，方便直接替换。

```html
<!-- 🎵 音乐推荐区 - 在此插入音乐文件 -->
<section style="max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;padding:0px 26px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;padding:16px 0px 12px;display:flex;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="width:100%;text-align:left;padding:0px 0px 0px 0px;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:center;white-space:normal;margin:0 0 6px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light;color:rgb(101,147,107)"><span leaf=""><strong>🎶 本周新歌速递 | 畅听华语佳作 🎧</strong></span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:center;white-space:normal;margin:0 0 2px 0">
<span style="font-size:15px;font-family:Optima-Regular,PingFangTC-light;color:rgb(119,119,119)"><span leaf="">━━━━━━━━━━━━━━━━</span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:left;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf=""><strong>🎵 歌曲 1：</strong>______________（在此插入音频）</span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:left;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf=""><strong>🎵 歌曲 2：</strong>______________（在此插入音频）</span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:left;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf=""><strong>🎵 歌曲 3：</strong>______________（在此插入音频）</span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:left;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf=""><strong>🎵 歌曲 4：</strong>______________（在此插入音频）</span></span>
</p>

<p style="caret-color:rgb(0,0,0);color:rgb(0,0,0);text-align:left;white-space:normal;margin:0 0 2px 0">
<span style="font-size:17px;font-family:Optima-Regular,PingFangTC-light"><span leaf=""><strong>🎵 歌曲 5：</strong>______________（在此插入音频）</span></span>
</p>

</section>
</section>
</section>
</section>
</section>
<!-- 音乐推荐区结束 -->
```

**使用说明：**
- 标题行居中绿色加粗，分隔线灰色居中
- 每首歌独立段落，`______________` 是占位符
- 插入音频时替换占位符为音频链接或 MEDIA 路径
- 增减歌曲：直接复制或删除 `<p>...</p>` 整行

### 7. 结尾CTA

```html
<section style="width:100%;display:flex;justify-content:center;align-items:center;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<section style="text-align:center;max-width:100%;overflow-wrap:break-word;box-sizing:border-box">
<span style="font-size:15px;font-family:Optima-Regular,PingFangTC-light;color:rgb(101,147,107)">
<span leaf="">喜欢就</span><strong><span leaf="">点击关注</span></strong><span leaf="">我哦～</span>
</span>
</section>
</section>
```

## 完整文章结构

⚠️ 章节之间**不要**放 `<p><span leaf=""><br></span></p>` 空行段落——用户要求删除全部空行，各组件直接紧挨。

```
|1. 开头绿色装饰框（标题+2-3段引入）
2. 段落标题① + 正文区①（左侧装饰栏+段落）
3. 分割线装饰
4. 段落标题② + 正文区②
5. 分割线装饰
6. ...（重复 3-5）
7. 段落标题"结语"
8. 结语绿色装饰框（总结+金句）
9. 音乐推荐列表（可选，在结语框和CTA之间）
10. CTA结尾
```

各组件（装饰框、标题、分割线、结语框）之间直接相连，靠组件自身的 padding/margin 提供间距，不额外添加空行。

## 如何扒取其他文章的完整结构

```bash
# 1. 用微信内置浏览器 UA 抓取（绕过验证）
curl -sL 'https://mp.weixin.qq.com/s/XXXXX' \
  -H 'User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49' \
  -o article.html

# 2. 提取 section 结构和图片 URL
python3 -c "
import re
html = open('article.html').read()
start = html.find('id=\"js_content\"')
content = html[start:]

# section 样式
for m in re.findall(r'<section[^>]*style=\"([^\"]+)\"', content[:50000]):
    if 'border' in m or 'background' in m or 'color' in m:
        print(f'SECTION: {m[:200]}')

# 图片 URL
for m in re.findall(r'data-src=\"([^\"]+)\"', content[:50000]):
    print(f'IMG: {m}')
"
```

## 常见错误（v1 → v4 的教训）

### ❌ 只扒文字 CSS，漏掉装饰结构
v1 只提取了 `p > span` 的 font-family/font-size/color，忽略了原文的 section 嵌套、绿框、GIF图标。
用户连续纠正 5+ 次。**必须扒完整 HTML 结构，不只是文字样式。**

### ❌ 用 Unicode emoji 替代原图标
v1 用 🌿 代替原文的叶子图片 URL。效果完全不同。
**必须用原文的 WeChat CDN 图片 URL。**

### ❌ 段落标题只加粗
v1 段落标题只是 `<strong><span style="font-size:17px">`，缺少两侧 GIF 和绿色下划线背景。
**原文的标题是三栏 flex 布局：左GIF + 绿色文字(带下划线) + 右GIF。**

### ❌ 结语没有装饰框
v1 结语就是普通段落。原文结语有浅绿背景 + 绿色虚线边框的装饰框。
**必须用双层 section 嵌套：外层背景色，内层虚线边框。**

### ❌ 漏掉分割线装饰（v2 教训）
v2 章节之间没有任何分隔，直接从正文跳到下一个标题。原文每个章节之间有 269px 宽的装饰性分割图。
**必须在每个章节的正文区和下一个标题之间插入分割线装饰。**

### ❌ 漏掉正文左侧叶子装饰栏（v2 教训）
v2 正文直接用裸 `<p>` 标签，没有左侧的装饰栏。原文正文是 flex 两栏布局：左栏 10px 宽（上叶子+虚线+下叶子），右栏文字。
**正文必须包裹在完整的 section 嵌套结构中，不是裸 `<p>`。**

### ❌ 段落间距太松 + 空行太多（v2 → v3 教训）

v2 的 `<p>` 标签没有写 margin，浏览器默认上下各 ~16px，导致段落间间距很大。用户连续纠正 3 次：
1. "缩小段落间距" → 加 `margin:0 0 6px 0`
2. "间距还能再小些吗？尤其是末尾" → 从 6px 压到 2px
3. "删除段落之间的空行" → 删掉全部 `<p><span leaf=""><br></span></p>` 空行段落

**最终正确做法（v4）**：
- 每个 `<p>` 必须有 `margin:0 0 2px 0`
- 绝不添加 `<p><span leaf=""><br></span></p>` 空行段落
- 各 section 组件之间直接紧挨，不加空行
