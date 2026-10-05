// Sincronização global de produtos — Firestore
(function () {
  const cfg = window.MTS_FIREBASE_CONFIG || {};
  const configured = cfg.projectId && !String(cfg.projectId).startsWith('COLE_');
  window.MTSCloud = { configured, ready: false };
  if (!configured || !window.firebase) {
    console.warn('[MTS] Firebase ainda não configurado. Produtos continuam em modo local/JSON.');
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const db = firebase.firestore();
    const ref = db.collection('mts').doc('catalogo');
    window.MTSCloud.ready = true;
    window.MTSCloud.getProducts = async function () {
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : null;
      return Array.isArray(data?.products) ? data.products : null;
    };
    window.MTSCloud.setProducts = async function (products) {
      await ref.set({ products, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      localStorage.setItem('mts_admin_products', JSON.stringify(products));
      return true;
    };
    window.MTSCloud.subscribeProducts = function (callback) {
      return ref.onSnapshot(snap => {
        const data = snap.exists ? snap.data() : null;
        if (Array.isArray(data?.products)) {
          localStorage.setItem('mts_admin_products', JSON.stringify(data.products));
          callback(data.products);
        }
      }, err => console.error('[MTS] Firestore:', err));
    };
  } catch (e) { console.error('[MTS] Falha ao iniciar Firebase:', e); }
})();
