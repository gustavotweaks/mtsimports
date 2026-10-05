// Sincronização global MTS via Cloud Firestore.
(function(){
  const cfg=window.MTS_FIREBASE_CONFIG||{};
  const configured=cfg.apiKey && cfg.apiKey!=="COLE_AQUI" && cfg.projectId && cfg.projectId!=="COLE_AQUI";
  window.MTS_FIREBASE_READY=false;
  if(!configured || !window.firebase){ console.warn('[MTS] Firebase ainda não configurado.'); return; }
  try{
    if(!firebase.apps.length) firebase.initializeApp(cfg);
    const db=firebase.firestore();
    window.MTS_DB=db; window.MTS_FIREBASE_READY=true;
    window.MTSCloud={
      async getProducts(){ const d=await db.collection('store').doc('catalog').get(); return d.exists?(d.data().products||[]):null; },
      async setProducts(products){ await db.collection('store').doc('catalog').set({products,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}); },
      watchProducts(cb){ return db.collection('store').doc('catalog').onSnapshot(d=>{ if(d.exists && Array.isArray(d.data().products)) cb(d.data().products); }); },
      async saveOrder(id,data){ await db.collection('orders').doc(id).set(data,{merge:true}); },
      watchOrder(id,cb){ return db.collection('orders').doc(id).onSnapshot(d=>{if(d.exists) cb(d.data());}); }
    };
    window.dispatchEvent(new Event('mts:firebase-ready'));
  }catch(e){ console.error('[MTS] Firebase:',e); }
})();
