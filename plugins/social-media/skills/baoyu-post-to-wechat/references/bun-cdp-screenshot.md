# Bun CDP Screenshot Pattern (Verified 2026-05-18)

## Problem

`execute_code` has a ~30s hard timeout. BunCdp WebSocket scripts that need to:
1. Connect to Chrome CDP (~10-15s)
2. Take a screenshot (~5s)
total ~20-25s+ and often hit the timeout.

## Working Pattern

Use `terminal(background:true)` to launch the Bun script, then poll for the output file.

```javascript
// /tmp/cdp-screenshot.mjs
#!/usr/bin/env bun
const {writeFileSync} = await import("fs");

async function main() {
  var ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
  var cdp = new BunCdp();
  await cdp.connect(ver.webSocketDebuggerUrl);
  var tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
  var wxTab = tabs.find(function(t){return t.url.includes("mp.weixin.qq.com")});
  if (!wxTab) { console.error("No WeChat tab"); process.exit(1); }
  var sid = (await cdp.send("Target.attachToTarget",{targetId:wxTab.id,flatten:true})).sessionId;
  var screenshot = await cdp.send("Page.captureScreenshot",{format:"png",quality:80},{sessionId:sid});
  var buf = Buffer.from(screenshot.data, 'base64');
  writeFileSync("/tmp/wechat-login.png", buf);
  console.log("Screenshot saved:", buf.length, "bytes");
}

class BunCdp {
  ws=null; pending=new Map(); nextId=1;
  connect(wsUrl) {
    const self=this;
    return new Promise(function(res,rej) {
      const t=setTimeout(function(){rej(new Error('timeout'))},15000);
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

main().catch(function(e){console.error(e);process.exit(1)});
```

## Invocation

```bash
# Launch
terminal(background=true, command="/home/kewang/.bun/bin/bun run --bun /tmp/cdp-screenshot.mjs")

# Poll for result (~20-25s)
ls -la /tmp/wechat-login.png
```

## Verified Result

- Chromium started separately via `subprocess.Popen` (Python)
- Bun script via `terminal(background:true)`: ~20s, screenshot saved 316KB at `/tmp/wechat-login.png`
- WeChat mp.weixin.qq.com tab confirmed present via `curl -s http://127.0.0.1:9222/json`
