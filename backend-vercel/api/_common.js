const MP_API='https://api.mercadopago.com';
const PROJECT='importsmts-d0495';
function cors(res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');}
async function catalog(){
 const u=`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/store/catalog`;
 const r=await fetch(u,{headers:{'Cache-Control':'no-cache'}}); if(!r.ok)throw new Error('Não foi possível consultar o catálogo da MTS.');
 const j=await r.json(); const raw=j.fields?.products?.arrayValue?.values||[];
 const val=v=>v?.stringValue ?? (v?.integerValue!==undefined?Number(v.integerValue):(v?.doubleValue!==undefined?Number(v.doubleValue):(v?.booleanValue??null)));
 return raw.map(x=>{const f=x.mapValue?.fields||{};return Object.fromEntries(Object.entries(f).map(([k,v])=>[k,val(v)]));});
}
module.exports={MP_API,cors,catalog};
