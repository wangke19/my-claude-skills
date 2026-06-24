# BunCdp + operate_appmsg 最小工作脚本（2026-05 验证）

## 核心教训

- **`execute_code` 对 Bun 子进程有 ~20s 硬超时**，BunCdp WebSocket 建立就要 10-15s，加上 CDP 调用必然超时 → 改用 `terminal()` 直接运行
- **`exit code 124` 是假失败**：draft 已在超时前创建成功（`ret: 0, appMsgId` 已返回），进程被强制杀死但草稿已落盘
- **Token 提取**：Chrome CDP JSON API 的 tab URL 中 `token=***` 是显示掩码，`***` 不是占位符，实际值就藏在 URL 里
- **不需要 DELETE + RECREATE**：用 `sub=create` 直接创建新草稿即可，草稿箱会保留历史
- **Token 长度判断陷阱**：轮询 `location.href.match(/token=([^&]+)/)` 时，判断条件 `v.length > 10` 对 10 位数字 token 永远不匹配。改为 `v.length >= 6`

## 最小工作脚本（已验证）

路径：`/tmp/wp-final.mjs`

```javascript
#!/usr/bin/env bun
// WeChat draft publisher via CDP — flatten-session + operate_appmsg
// 运行方式: terminal() 直接调用，不用 execute_code（避免 20s 超时）

class BunCdp {
  ws=null; pending=new Map(); nextId=1;
  connect(wsUrl) {
    const self=this;
    return new Promise(function(res,rej) {
      const t=setTimeout(function(){rej(new Error('connect timeout'))},15000);
      self.ws=new WebSocket(wsUrl);
      self.ws.addEventListener('open',function(){clearTimeout(t);res()});
      self.ws.addEventListener('message',function(evt){
        try{var msg=JSON.parse(evt.data);
          if(msg.id){var p=self.pending.get(msg.id);if(p){self.pending.delete(msg.id);clearTimeout(p.t);p.res(msg.result);}}
        }catch{}
      });
      self.ws.addEventListener('error',function(){clearTimeout(t);rej(new Error('WS error'))});
    });
  }
  send(m,params,opts) {
    const self=this; params=params||{};
    var sid = opts&&opts.sessionId;
    return new Promise(function(res,rej) {
      if(!self.ws){rej(new Error('not connected'));return;}
      const id=self.nextId++;
      const t=setTimeout(function(){self.pending.delete(id);rej(new Error(m+' timeout'))},120000);
      self.pending.set(id,{res:res,rej:rej,t:t});
      self.ws.send(JSON.stringify(sid?{id:id,method:m,params:params,sessionId:sid}:{id:id,method:m,params:params}));
    });
  }
}

async function ev(cdp,expr,sid) {
  var r = await cdp.send("Runtime.evaluate",{expression:expr,returnByValue:true},{sessionId:sid});
  return r.result?r.result.value:undefined;
}

async function main() {
  var ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
  var cdp = new BunCdp();
  await cdp.connect(ver.webSocketDebuggerUrl);

  var tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
  var wxTab = tabs.find(function(t){return t.url&&t.url.includes("mp.weixin.qq.com")});
  if (!wxTab) { console.error("No WeChat tab found"); process.exit(1); }

  // Token 提取：URL 中 token=*** 是掩码，实际值就藏在 URL 里
  var tokenMatch = wxTab.url.match(/token=([^&]+)/);
  if (!tokenMatch) { console.error("No token in URL"); process.exit(1); }
  var token = tokenMatch[1];

  var sid = (await cdp.send("Target.attachToTarget",{targetId:wxTab.id,flatten:true})).sessionId;

  // 读取正文（Bun 环境不用 readFileSync，用 Bun.file()）
  var body = await Bun.file("/tmp/article-body.html").text();
  body = body.trim();
  console.log("Body length:", body.length);

  // 创建草稿 — form data 用对象 + encodeURIComponent 构建
  var TITLE = "运营商的\"生死转型\"：从卖流量到卖算力";
  var DIGEST = "2025年三大运营商总营收约1.97万亿几乎零增长，净利润负增长——流量业务彻底见顶。";

  var r = await ev(cdp, `(function(){
    var x=new XMLHttpRequest();
    x.open('POST','https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN',false);
    x.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
    var p={
      token:'${token}',lang:'zh_CN',f:'json',ajax:'1',
      random:Math.random().toString(),AppMsgId:'',count:'1',
      data_seq:'0',operate_from:'Chrome',isMark:'0'
    };
    p['title0']=${JSON.stringify(TITLE)};
    p['content0']=${JSON.stringify(body)};
    p['author0']='';p['fileid0']='';
    p['digest0']=${JSON.stringify(DIGEST)};
    p['sourceurl0']='';p['need_open_comment0']='0';p['show_cover_pic0']='1';
    p['copyright_type0']='0';p['can_reward0']='0';
    p['mediaapi_publish_status0']='0';p['fee_type0']='';
    p['pay_fee0']='0';p['pay_album_info0']='';p['is_set_sync_to_finder0']='0';
    var fd=Object.keys(p).map(function(k){
      return encodeURIComponent(k)+'='+encodeURIComponent(p[k]);
    }).join('&');
    x.send(fd);
    return x.responseText;
  })()`, sid);

  console.log("Response:", r);
  var resp = JSON.parse(r);
  console.log("ret:", resp.ret, "appMsgId:", resp.appMsgId);
}

main().catch(function(e){console.error(e);process.exit(1)});
```

## 关键细节

### Token 提取
```javascript
// ✅ 正确：从 tab URL 中用正则提取（token=*** 中的 *** 是显示掩码，实际值就藏在 URL 里）
var token = wxTab.url.match(/token=([^&]+)/)?.[1];

// ✅ 然后在模板字符串中插值（不用字符串拼接，避免掩码问题）
x.open('POST', `https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN`, false);
```

**⚠️ Token 长度判断陷阱**：轮询 `location.href.match(/token=([^&]+)/)` 时，判断条件 `v.length > 10` 对 10 位数字 token（如 `1252627710`）永远为 `false`。改为 `v.length >= 6`：

```javascript
// ❌ 错误：10 位 token（长度=10）不满足 > 10
if (v.length > 10) { token = v; break; }

// ✅ 正确：>= 6 覆盖所有已知微信 token 长度
if (v.length >= 6) { token = v; break; }
```

### Form Data 构建（避免字符串拼接错误）
```javascript
// ✅ 正确：先建对象，再 map + encodeURIComponent
var p = { token:'${token}', lang:'zh_CN', ... };
p['title0'] = JSON.stringify(TITLE);      // 标题含特殊字符，用 JSON.stringify 转义
p['content0'] = JSON.stringify(body);     // 正文含 HTML，用 JSON.stringify 转义
var fd = Object.keys(p).map(function(k){
  return encodeURIComponent(k)+'='+encodeURIComponent(p[k]);
}).join('&');
x.send(fd);
```

### 验证草稿内容
```javascript
// operate_appmsg 返回的 filter_content_html[0].content 包含完整正文
// 可用它验证内容是否完整写入
var ct = resp.filter_content_html && resp.filter_content_html[0] && resp.filter_content_html[0].content;
console.log("Content length:", ct ? ct.length : 0);
```

## 调试技巧

### 检查 Chrome 端口是否有可用 tab
```bash
curl -s 'http://127.0.0.1:9222/json' | python3 -c "import sys,json; [print(t['id'],t['url']) for t in json.load(sys.stdin)]"
```

### 检查草稿是否创建成功
```javascript
// 草稿列表 API（不返回 content，是正常行为）
// 用 create 返回的 filter_content_html 验证内容
```

## 相关参考
- `buncdp-flatten-session.md` — flatten-session 模式基础
- `operate-appmsg-api.md` — operate_appmsg API 字段说明
- `cdp-troubleshooting.md` — Session 过期、QR 登录流程
