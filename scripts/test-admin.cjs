'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http'),{once}=require('node:events'),vm=require('node:vm');
const {createHandler,fileStore,redisStore,taiwanDate}=require('../server/admin.cjs');
const scope={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('assets/site-settings.js','utf8'),scope);const S=scope.module.exports;
async function main(){
 assert.equal(taiwanDate(Date.parse('2026-11-01T15:59:59Z')),'20261101');assert.equal(taiwanDate(Date.parse('2026-11-01T16:00:00Z')),'20261102');
 assert.throws(()=>redisStore({}),/儲存/);assert.throws(()=>S.validate({...S.defaults(),games:[]}),/清單/);
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'small3-admin-')),store=fileStore(directory);let now=Date.parse('2026-11-01T12:00:00Z');
 const handler=createHandler({store,now:()=>now});
 const server=http.createServer(async(req,res)=>{if(req.headers['x-test-parsed-body']){let raw='';for await(const chunk of req)raw+=chunk;req.body=JSON.parse(raw);}return handler(req,res);});server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
 async function call(action,body,cookie='',headers={}){return fetch(origin+'/api/site?action='+action,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json','X-Small3-Admin':'1',Cookie:cookie,...headers},body:body?JSON.stringify(body):undefined});}
 try{
  assert.equal((await call('settings')).status,401);assert.equal((await call('save',{config:S.defaults()})).status,401);
  assert.equal((await call('login',{password:'20261031'})).status,401);
  assert.equal((await call('login',{password:'20261101'},'',{Origin:'https://evil.example'})).status,403);
  assert.equal((await call('login',{password:'20261101'},'',{'X-Small3-Admin':''})).status,403);
  const login=await call('login',{password:'20261101'},'',{'x-test-parsed-body':'1'});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal((await(await call('session',null,cookie)).json()).authenticated,true);
  assert.equal((await call('settings',null,cookie.slice(0,-1)+'x')).status,401);
  const initial=(await(await call('public')).json()).config;assert.equal(initial.revision,0);
  const draft=structuredClone(initial);draft.home.title='孩子的學習樂園';draft.games.reverse();draft.games[1].visible=false;draft.games[0].isNew=true;
  const response=await call('save',{config:draft},cookie);assert.equal(response.status,200);const saved=(await response.json()).config;assert.equal(saved.revision,1);
  assert.equal((await call('save',{config:draft},cookie)).status,409,'Stale tab cannot overwrite');
  const publicSaved=(await(await call('public')).json()).config;assert.deepEqual(publicSaved,saved);assert.equal(JSON.parse(JSON.stringify(await fileStore(directory).read())).home.title,draft.home.title,'Survives server restart');
  const invalid=structuredClone(saved);invalid.games.forEach(g=>g.visible=false);assert.equal((await call('save',{config:invalid},cookie)).status,400);assert.equal((await(await call('public')).json()).config.revision,1);
  assert.equal((await call('save',{config:{...saved,home:{title:'x'.repeat(25),intro:''}}},cookie)).status,400);
  assert.equal((await call('save',{config:{...saved,games:saved.games.map(g=>({...g,id:'length'}))}},cookie)).status,400);
  const invalidBody=await fetch(origin+'/api/site?action=save',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Small3-Admin':'1',Cookie:cookie},body:'null'});assert.equal(invalidBody.status,400);
  const both=await Promise.all([store.write(saved),store.write(saved)]);assert.equal(both.filter(Boolean).length,1,'Concurrent writes cannot overwrite');
  now=Date.parse('2026-11-01T16:00:00Z');assert.equal((await call('settings',null,cookie)).status,401,'Midnight invalidates old session');
  assert.equal((await call('login',{password:'20261101'})).status,401);assert.equal((await call('login',{password:'20261102'})).status,200);
  now+=600001;
  for(let i=0;i<10;i++)assert.equal((await call('login',{password:'00000000'})).status,401);
  assert.equal((await call('login',{password:'20261102'})).status,429);now+=600001;assert.equal((await call('login',{password:'20261102'})).status,200);
  assert.equal((await call('logout',{},cookie)).headers.get('set-cookie').includes('Max-Age=0'),true);
  console.log('PASS admin: Taiwan midnight password/session rollover, server auth, tampered cookie/CSRF rejection, rate limit, durable local save, shared public read, validation, stale-tab and concurrent write protection.');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));if(path.dirname(directory)!==os.tmpdir()||!path.basename(directory).startsWith('small3-admin-'))throw Error('Unexpected cleanup');fs.rmSync(directory,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
