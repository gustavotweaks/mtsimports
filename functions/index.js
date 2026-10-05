const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
admin.initializeApp();
const db=admin.firestore();
const PICPAY_CLIENT_ID=defineSecret('PICPAY_CLIENT_ID');
const PICPAY_CLIENT_SECRET=defineSecret('PICPAY_CLIENT_SECRET');
const PICPAY_WEBHOOK_TOKEN=defineSecret('PICPAY_WEBHOOK_TOKEN');
const API='https://ecommerce-api.svcp.picpay.com';
function cors(res){res.set('Access-Control-Allow-Origin','*');res.set('Access-Control-Allow-Headers','Content-Type');res.set('Access-Control-Allow-Methods','POST,OPTIONS');}
async function token(){const r=await fetch(API+'/oauth2/token',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:PICPAY_CLIENT_ID.value(),client_secret:PICPAY_CLIENT_SECRET.value()})});if(!r.ok)throw new Error('Falha OAuth PicPay: '+await r.text());return (await r.json()).access_token;}
exports.createPix=onRequest({secrets:[PICPAY_CLIENT_ID,PICPAY_CLIENT_SECRET]},async(req,res)=>{cors(res);if(req.method==='OPTIONS')return res.status(204).send('');if(req.method!=='POST')return res.status(405).json({error:'Método inválido'});try{
 const {items,customer}=req.body||{}; if(!Array.isArray(items)||!items.length) return res.status(400).json({error:'Carrinho vazio'});
 const snap=await db.collection('store').doc('catalog').get(); const products=snap.data()?.products||[]; let cents=0; const clean=[];
 for(const it of items){const p=products.find(x=>String(x.id)===String(it.id));const qty=Math.max(1,Math.min(99,Number(it.qty)||1));if(!p||Number(p.stock)<qty)throw new Error('Produto indisponível: '+(p?.name||it.id));cents+=Math.round(Number(p.price)*100)*qty;clean.push({id:p.id,name:p.name,qty,unitPrice:p.price});}
 const merchantChargeId=('MTS-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)).slice(0,36);
 const digits=String(customer.phone||'').replace(/\D/g,''); const phone=digits.startsWith('55')?digits.slice(2):digits; const area=phone.slice(0,2),number=phone.slice(2);
 const body={paymentSource:'GATEWAY',merchantChargeId,customer:{name:customer.name,email:customer.email,documentType:'CPF',document:String(customer.document||'').replace(/\D/g,''),phone:{countryCode:'55',areaCode:area,number,type:'MOBILE'}},transactions:[{amount:cents,pix:{expiration:900}}]};
 const access=await token(); const r=await fetch(API+'/v1/charge/pix',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json','Accept':'application/json','caller-origin':'mts-store'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok) return res.status(r.status).json({error:'PicPay recusou a cobrança',details:data});
 const tx=(data.transactions||[]).find(x=>x.paymentType==='PIX')||data.transactions?.[0]; await db.collection('orders').doc(merchantChargeId).set({merchantChargeId,status:tx?.transactionStatus||data.chargeStatus||'PENDING',amount:cents,items:clean,customer:{name:customer.name,email:customer.email},createdAt:admin.firestore.FieldValue.serverTimestamp()});
 return res.json({merchantChargeId,amount:cents,status:tx?.transactionStatus||'PENDING',qrCode:tx?.pix?.qrCode,qrCodeBase64:tx?.pix?.qrCodeBase64});
 }catch(e){console.error(e);return res.status(500).json({error:e.message});}});
exports.picpayWebhook=onRequest({secrets:[PICPAY_WEBHOOK_TOKEN]},async(req,res)=>{try{const auth=req.get('authorization')||'';if(PICPAY_WEBHOOK_TOKEN.value()&&auth!==PICPAY_WEBHOOK_TOKEN.value()&&auth!==`Bearer ${PICPAY_WEBHOOK_TOKEN.value()}`)return res.status(401).send('unauthorized');const d=req.body?.data||{};const id=d.merchantChargeId;if(id)await db.collection('orders').doc(id).set({status:d.status||'UNKNOWN',updatedAt:admin.firestore.FieldValue.serverTimestamp(),picpayEvent:req.body},{merge:true});return res.status(200).send('ok');}catch(e){console.error(e);return res.status(500).send('error');}});
