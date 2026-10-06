const crypto=require('crypto'); const {MP_API,cors,catalog}=require('./_common');
module.exports=async(req,res)=>{cors(res);if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='POST')return res.status(405).json({error:'Método inválido'});
 try{
  if(!process.env.MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN não configurado no servidor.');
  const {items,customer}=req.body||{}; if(!Array.isArray(items)||!items.length)return res.status(400).json({error:'Carrinho vazio.'});
  if(!customer?.email)return res.status(400).json({error:'E-mail obrigatório.'});
  const products=await catalog(); let total=0; const clean=[];
  for(const it of items){const p=products.find(x=>String(x.id)===String(it.id));const qty=Math.max(1,Math.min(99,Number(it.qty)||1));if(!p)throw new Error('Produto não encontrado no catálogo.');if(Number(p.stock||0)<qty)throw new Error(`Estoque insuficiente: ${p.name}`);const price=Number(p.price);if(!Number.isFinite(price)||price<=0)throw new Error('Preço inválido no catálogo.');total+=price*qty;clean.push({title:String(p.name).slice(0,120),quantity:qty,unit_price:price.toFixed(2),unit_measure:'unit',total_amount:(price*qty).toFixed(2)});}
  total=Math.round(total*100)/100; const external=`MTS_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const body={type:'online',total_amount:total.toFixed(2),external_reference:external,processing_mode:'automatic',payer:{email:customer.email},items:clean,transactions:{payments:[{amount:total.toFixed(2),payment_method:{id:'pix',type:'bank_transfer'},expiration_time:'PT30M'}]}};
  const r=await fetch(MP_API+'/v1/orders',{method:'POST',headers:{'Authorization':'Bearer '+process.env.MP_ACCESS_TOKEN,'Content-Type':'application/json','Accept':'application/json','X-Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)});
  const d=await r.json(); if(!r.ok){console.error(d);return res.status(r.status).json({error:'Mercado Pago recusou a criação do Pix.',details:d});}
  const pay=d.transactions?.payments?.[0]||{}; const pm=pay.payment_method||{};
  return res.status(201).json({orderId:d.id,externalReference:external,amount:total,status:d.status,statusDetail:d.status_detail,qrCode:pm.qr_code||'',qrCodeBase64:pm.qr_code_base64||'',ticketUrl:pm.ticket_url||''});
 }catch(e){console.error(e);return res.status(500).json({error:e.message||'Erro interno.'});}
};
