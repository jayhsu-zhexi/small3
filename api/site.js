import admin from '../server/admin.cjs';
let handler;
export default async function(req,res){
 if(!handler)try{handler=admin.createHandler({store:admin.redisStore(process.env),production:true});}catch{res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify({error:'後台尚未連接正式儲存空間，前台維持原設定。'}));return;}
 return handler(req,res);
}
