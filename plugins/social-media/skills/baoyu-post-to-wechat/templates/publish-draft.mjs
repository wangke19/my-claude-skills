#!/usr/bin/env bun
// WeChat draft publisher via CDP operate_appmsg API
// Usage: bun publish-draft.mjs --title "标题" --file body.html [--digest "摘要"] [--del OLD_ID]
//
// Usage:
//   bun /tmp/publish-draft.mjs --title "My Title" --file /path/to/body.html
//   bun /tmp/publish-draft.mjs --title "My Title" --file /path/to/body.html --del 100000123

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf('--' + name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
}

const BODY_FILE = getArg('file');
const TITLE = getArg('title');
const DIGEST = getArg('digest') || '';
const DEL_ID = getArg('del'); // optional: draft ID to delete before creating

if (!BODY_FILE || !TITLE) {
  console.error('Usage: bun publish-draft.mjs --title "标题" --file body.html [--digest "摘要"] [--del OLD_ID]');
  process.exit(1);
}

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
  const {readFileSync} = await import("fs");

  // 1. Connect to Chrome
  var ver = await (await fetch("http://127.0.0.1:9222/json/version")).json();
  var cdp = new BunCdp();
  await cdp.connect(ver.webSocketDebuggerUrl);

  // 2. Find WeChat tab
  var tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
  var wxTab = tabs.find(function(t){return t.url.includes("mp.weixin.qq.com")});
  if (!wxTab) { console.error("No WeChat tab found"); process.exit(1); }
  var sid = (await cdp.send("Target.attachToTarget",{targetId:wxTab.id,flatten:true})).sessionId;
  // Get real token from page context (Chrome strips token=*** from debugger URL)
  var token = await ev(cdp, "(window.__token || document.cookie.match(/token=([^;]+)/)?.[1] || location.href.match(/token=([^&]+)/)?.[1])", sid);
  if (!token) { console.error("Could not get token from page"); process.exit(1); }
  console.log("token obtained from page context");

  // 3. Optionally delete old draft
  if (DEL_ID) {
    console.log("[1] Del " + DEL_ID + "...");
    await ev(cdp, "(function(){var x=new XMLHttpRequest();x.open('POST','https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=del&type=77&token="+token+"&lang=zh_CN',false);x.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');x.send('token="+token+"&lang=zh_CN&f=json&ajax=1&AppMsgId="+DEL_ID+"&count=1&data_seq=0')})()", sid).catch(function(){});
  }

  // 4. Read body HTML
  var body = readFileSync(BODY_FILE,"utf-8").trim();
  console.log("body:",body.length);

  // 5. Create draft
  console.log("Creating draft...");
  var r = await ev(cdp, "(function(){var x=new XMLHttpRequest();x.open('POST','https://mp.weixin.qq.com/cgi-bin/operate_appmsg?t=ajax-response&sub=create&type=77&token="+token+"&lang=zh_CN',false);x.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');var p={token:'"+token+"',lang:'zh_CN',f:'json',ajax:'1',random:Math.random().toString(),AppMsgId:'',count:'1',data_seq:'0',operate_from:'Chrome',isMark:'0'};p['title0']="+JSON.stringify(TITLE)+";p['content0']="+JSON.stringify(body)+";p['author0']='';p['fileid0']='';p['digest0']="+JSON.stringify(DIGEST)+";p['sourceurl0']='';p['need_open_comment0']='0';p['show_cover_pic0']='1';p['copyright_type0']='0';p['can_reward0']='0';p['mediaapi_publish_status0']='0';p['fee_type0']='';p['pay_fee0']='0';p['pay_album_info0']='';p['is_set_sync_to_finder0']='0';var fd=Object.keys(p).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(p[k])}).join('&');x.send(fd);return x.responseText})()", sid);

  var resp = JSON.parse(r);
  console.log("ret:",resp.ret,"id:",resp.appMsgId);
  if(resp.ret==0||resp.ret=="0"){
    var ct=resp.filter_content_html&&resp.filter_content_html[0]&&resp.filter_content_html[0].content;
    console.log("✅",resp.appMsgId,"content:",ct?ct.length:0);
  } else {
    console.log("❌",JSON.stringify(resp).substring(0,200));
  }
}
main().catch(function(e){console.error(e);process.exit(1)});
