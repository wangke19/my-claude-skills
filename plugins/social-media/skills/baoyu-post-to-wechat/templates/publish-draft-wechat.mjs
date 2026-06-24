#!/usr/bin/env bun
// publish-draft-wechat.mjs
// 用途：从 wechat-article-generator 生成的 HTML 文件发布草稿到微信公众号
// 依赖：Chrome 运行在 9222 端口，已登录 mp.weixin.qq.com
// 用法：bun publish-draft-wechat.mjs --title "标题" --file /path/to/body.html [--digest "摘要"]
//
// 工作流程：
// 1. 连接 Chrome CDP (ws)
// 2. 找已登录的 mp.weixin.qq.com tab，提取 token
// 3. 读取 body HTML
// 4. 调用 operate_appmsg API (sub=create)
// 5. 验证 ret=0，打印 appMsgId
//
// 注意事项：
// - title 必须 ≤64 字符，否则 ret: 64702
// - content0 接受完整 inline HTML（含 <svg>），不需要封面图 fileid
// - 草稿列表 API 不返回 content，用 filter_content_html 验证

const {readFileSync} = await import("fs");

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

const TITLE = args.title || "无标题";
const BODY_FILE = args.file;
const DIGEST = args.digest || TITLE;

// Validate
if (!BODY_FILE) { console.error("Usage: bun publish-draft-wechat.mjs --title=标题 --file=/path/to/body.html [--digest=摘要]"); process.exit(1); }
if (TITLE.length > 64) { console.error(`标题超长: ${TITLE.length} > 64 字符，请修改后重试`); process.exit(1); }

// Token extraction from Chrome
const getToken = async () => {
  const resp = await fetch("http://127.0.0.1:9222/json");
  const tabs = await resp.json();
  for (const t of tabs) {
    const m = t.url.match(/[?&]token=([^&]+)/);
    if (m) return { token: m[1], tabId: t.id, wsUrl: t.webSocketDebuggerUrl };
  }
  throw new Error("No logged-in WeChat tab found on port 9222. Please open mp.weixin.qq.com and log in first.");
};

// BunCdp - Bun-native WebSocket CDP client (NOT CdpConnection from baoyu-chrome-cdp)
class BunCdp {
  ws=null; pending=new Map(); eventHandlers=new Map(); nextId=1;
  connect(wsUrl) {
    const self=this;
    return new Promise((res,rej) => {
      const t=setTimeout(()=>rej(new Error('CDP connect timeout')),15000);
      self.ws=new WebSocket(wsUrl);
      self.ws.addEventListener('open',()=>{clearTimeout(t);res()});
      self.ws.addEventListener('message',evt=>{
        try {
          const msg=JSON.parse(evt.data);
          if(msg.method){const h=self.eventHandlers.get(msg.method);h&&h.forEach(x=>x(msg.params));}
          if(msg.id){const p=self.pending.get(msg.id);if(p){self.pending.delete(msg.id);clearTimeout(p.t);p.res(msg.result);}}
        }catch{}
      });
      self.ws.addEventListener('error',()=>{clearTimeout(t);rej(new Error('WS error'))});
    });
  }
  send(m,params,opts) {
    const self=this; params=params||{};
    const sid=opts?.sessionId;
    return new Promise((res,rej)=>{
      if(!self.ws){rej(new Error('not connected'));return;}
      const id=self.nextId++;
      const t=setTimeout(()=>{self.pending.delete(id);rej(new Error(m+' timeout'))},120000);
      self.pending.set(id,{res,rej,t});
      self.ws.send(JSON.stringify(sid?{id,method:m,params,sessionId:sid}:{id,method:m,params}));
    });
  }
}
const ev = async(cdp,expr,sid) => {
  const r = await cdp.send("Runtime.evaluate",{expression:expr,returnByValue:true},{sessionId:sid});
  return r.result?.value;
};

// Main
const {token, tabId, wsUrl} = await getToken();
const cdp = new BunCdp();
await cdp.connect(wsUrl);
const sid = (await cdp.send("Target.attachToTarget",{targetId:tabId,flatten:true})).sessionId;

const bodyHtml = readFileSync(BODY_FILE, "utf-8").trim();

const result = await ev(cdp, `(function(){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token=${token}&lang=zh_CN', false);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
  var params = {
    token:'${token}', lang:'zh_CN', f:'json', ajax:'1',
    random:Math.random().toString(), AppMsgId:'', count:'1',
    data_seq:'0', operate_from:'Chrome', isMark:'0'
  };
  params['title0'] = ${JSON.stringify(TITLE)};
  params['content0'] = ${JSON.stringify(bodyHtml)};
  params['author0'] = '';
  params['fileid0'] = '';
  params['digest0'] = ${JSON.stringify(DIGEST)};
  params['sourceurl0'] = '';
  params['need_open_comment0'] = '1';
  params['show_cover_pic0'] = '0';
  params['copyright_type0'] = '0';
  params['can_reward0'] = '0';
  params['mediaapi_publish_status0'] = '0';
  params['fee_type0'] = '';
  params['pay_fee0'] = '0';
  params['pay_album_info0'] = '';
  params['is_set_sync_to_finder0'] = '0';
  var formData = Object.keys(params).map(k => encodeURIComponent(k)+'='+encodeURIComponent(params[k])).join('&');
  xhr.send(formData);
  return xhr.responseText;
})()`, sid);

const resp = JSON.parse(result);
if (resp.ret === 0 || resp.ret === "0") {
  console.log("SUCCESS! appMsgId:", resp.appMsgId);
  process.exit(0);
} else {
  console.error("FAILED, ret:", resp.ret, "err:", resp.base_resp?.err_msg || resp.err_msg);
  process.exit(1);
}