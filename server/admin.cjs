'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const sandbox={module:{exports:{}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/site-settings.js'),'utf8'),sandbox);
const Settings=sandbox.module.exports,CONFIG_KEY='small3:site-settings:v1';
function taiwanDate(time=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time)).replace(/-/g,'');}
function equal(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y);}
function fileStore(dir){fs.mkdirSync(dir,{recursive:true});const filename=path.join(dir,'settings.json'),secretFile=path.join(dir,'session-key');
 try{fs.writeFileSync(secretFile,crypto.randomBytes(48).toString('hex'),{flag:'wx',mode:0o600});}catch(e){if(e.code!=='EEXIST')throw e;}
 let queue=Promise.resolve();const hits=new Map();return {secret:fs.readFileSync(secretFile,'utf8'),kind:'local',async read(){try{return Settings.validate(JSON.parse(fs.readFileSync(filename,'utf8')));}catch(e){if(e.code==='ENOENT')return Settings.defaults();throw e;}},write(config){const task=queue.then(async()=>{const current=await this.read();if(current.revision!==config.revision)return false;const next={...config,revision:current.revision+1,updatedAt:new Date().toISOString()};const temp=filename+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(next),{mode:0o600});fs.renameSync(temp,filename);return next;});queue=task.catch(()=>{});return task;},async attempt(key,now){for(const [id,h] of hits)if(h.until<=now)hits.delete(id);const hit=hits.get(key)||{count:0,until:now+600000};hit.count++;hits.set(key,hit);return hit.count;}};
}
function redisStore(env){const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN,secret=env.ADMIN_SESSION_SECRET;
 if(!url||!token||!secret||secret.length<32)throw Error('後台尚未連接正式儲存空間。');
 const configKey=env.VERCEL_ENV==='preview'?CONFIG_KEY+':preview':CONFIG_KEY;
 if(!url.startsWith('https://'))throw Error('儲存連線設定不正確。');
 async function command(args){const response=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error('儲存服務暫時無法連線。');const data=await response.json();if(data.error)throw Error('儲存服務暫時無法連線。');return data.result;}
 return {secret,kind:env.VERCEL_ENV==='preview'?'preview':'shared',async read(){const raw=await command(['GET',configKey]);return raw?Settings.validate(JSON.parse(raw)):Settings.defaults();},async write(config){const next={...config,revision:config.revision+1,updatedAt:new Date().toISOString()};const ok=await command(['EVAL',"local raw=redis.call('GET',KEYS[1]); local rev=0; if raw then rev=cjson.decode(raw).revision end; if rev~=tonumber(ARGV[1]) then return 0 end; redis.call('SET',KEYS[1],ARGV[2]); return 1",1,configKey,config.revision,JSON.stringify(next)]);return ok===1?next:false;},async attempt(key){return command(['EVAL',"local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n",1,configKey+':attempt:'+key]);}};
}
function createHandler({store,now=()=>Date.now(),production=false}={}){
 function signature(payload){return crypto.createHmac('sha256',store.secret).update(payload).digest('base64url');}
 function session(req){try{const raw=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('small3_admin='))?.slice(13);if(!raw)return false;const [payload,sig,...extra]=raw.split('.');if(extra.length||!sig||!equal(sig,signature(payload)))return false;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.day===taiwanDate(now())&&Number.isFinite(data.exp)&&data.exp>now();}catch{return false;}}
 const cookie=(value,age)=>`small3_admin=${value}; HttpOnly; SameSite=Strict; Path=/api/site; Max-Age=${age}${production?'; Secure':''}`;
 function send(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
 return async function(req,res){
  const action=new URL(req.url,'http://localhost').searchParams.get('action')||'public';
  try{
   if(req.method==='GET'&&action==='public')return send(res,200,{config:await store.read()});
   if(req.method==='GET'&&action==='session')return send(res,200,{authenticated:session(req),storage:store.kind});
   if(req.method==='GET'&&action==='settings'){if(!session(req))return send(res,401,{error:'請先登入後台。'});return send(res,200,{config:await store.read(),storage:store.kind});}
   if(req.method!=='POST')return send(res,405,{error:'不支援此操作。'});
   const origin=req.headers.origin,expected=(production?'https://':'http://')+req.headers.host;
   if(origin!==expected||req.headers['x-small3-admin']!=='1'||!String(req.headers['content-type']).startsWith('application/json'))return send(res,403,{error:'請從本站後台操作。'});
   if(action==='logout'){res.setHeader('Set-Cookie',cookie('',0));return send(res,200,{ok:true});}
   if(action!=='login'&&!session(req))return send(res,401,{error:'登入已到期，請重新輸入今天的密碼。'});
   if(action==='login'){
    const ip=production?String(req.headers['x-vercel-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim():req.socket?.remoteAddress||'local';
    const key=crypto.createHash('sha256').update(ip).digest('hex').slice(0,32);
    if(await store.attempt(key,now())>10)return send(res,429,{error:'嘗試次數過多，請 10 分鐘後再試。'});
   }
   let raw='';if(req.body!==undefined){raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);}else for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>16000)return send(res,413,{error:'設定內容太大。'});}if(Buffer.byteLength(raw)>16000)return send(res,413,{error:'設定內容太大。'});
   let body;try{body=JSON.parse(raw);}catch{return send(res,400,{error:'資料格式不正確。'});}
   if(!body||typeof body!=='object'||Array.isArray(body))return send(res,400,{error:'資料格式不正確。'});
   if(action==='login'){
    if(typeof body.password!=='string'||!equal(body.password,taiwanDate(now())))return send(res,401,{error:'密碼不正確，請再試一次。'});
    const payload=Buffer.from(JSON.stringify({day:taiwanDate(now()),exp:now()+8*60*60*1000,nonce:crypto.randomBytes(16).toString('hex')})).toString('base64url');
    res.setHeader('Set-Cookie',cookie(payload+'.'+signature(payload),28800));return send(res,200,{ok:true,storage:store.kind});
   }
   if(action==='save'){
    let config;try{config=Settings.validate(body.config);}catch(e){return send(res,400,{error:e.message});}
    const saved=await store.write(config);if(!saved)return send(res,409,{error:'其他視窗已更新設定。請先重新載入，再修改。'});
    return send(res,200,{config:saved});
   }
   return send(res,404,{error:'找不到這個操作。'});
  }catch{return send(res,503,{error:'目前無法讀取或儲存設定，請稍後再試。'});}
 };
}
module.exports={createHandler,fileStore,redisStore,taiwanDate};
