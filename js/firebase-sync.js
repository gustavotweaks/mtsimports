// MTS — sincronização global via Cloud Firestore.
(function () {
  const cfg = window.MTS_FIREBASE_CONFIG || {};
  const configured = Boolean(cfg.apiKey && cfg.projectId && cfg.authDomain);
  window.MTS_FIREBASE_READY = false;

  if (!configured || !window.firebase) {
    console.error('[MTS] Firebase não carregado/configurado.');
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    const db = firebase.firestore();
    const catalogRef = db.collection('store').doc('catalog');
    window.MTS_DB = db;
    window.MTS_FIREBASE_READY = true;

    function waitForUser() {
      if (!firebase.auth) return Promise.reject(new Error('Firebase Auth não foi carregado.'));
      return new Promise((resolve, reject) => {
        let unsub = null;
        const done = (fn, value) => { if (unsub) unsub(); fn(value); };
        unsub = firebase.auth().onAuthStateChanged(
          user => done(resolve, user),
          err => done(reject, err)
        );
      });
    }

    window.MTSCloud = {
      async getProducts() {
        // source:'server' impede um cache antigo do navegador de virar a fonte do catálogo.
        const snap = await catalogRef.get({ source: 'server' });
        if (!snap.exists) return null;
        const products = snap.data().products;
        return Array.isArray(products) ? products : [];
      },

      async setProducts(products) {
        if (!Array.isArray(products)) throw new Error('Catálogo inválido.');
        const user = await waitForUser();
        if (!user) throw new Error('Sessão do administrador expirada. Entre novamente.');
        if (window.MTS_ADMIN_EMAIL && String(user.email || '').toLowerCase() !== String(window.MTS_ADMIN_EMAIL).toLowerCase()) {
          throw new Error('Este usuário não tem permissão de administrador.');
        }
        await catalogRef.set({
          products,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: user.email || ''
        }, { merge: true });

        // Confirma a gravação no servidor antes de informar sucesso.
        const check = await catalogRef.get({ source: 'server' });
        if (!check.exists || !Array.isArray(check.data().products)) throw new Error('Não foi possível confirmar o catálogo no Firestore.');
        return check.data().products;
      },

      watchProducts(cb, onError) {
        return catalogRef.onSnapshot(
          { includeMetadataChanges: true },
          snap => {
            if (!snap.exists || snap.metadata.fromCache) return;
            const products = snap.data().products;
            if (Array.isArray(products)) cb(products);
          },
          err => { console.error('[MTS] Erro no catálogo em tempo real:', err); if (onError) onError(err); }
        );
      },

      async saveOrder(id, data) { await db.collection('orders').doc(id).set(data, { merge: true }); },
      watchOrder(id, cb) { return db.collection('orders').doc(id).onSnapshot(d => { if (d.exists) cb(d.data()); }); }
    };

    window.dispatchEvent(new Event('mts:firebase-ready'));
  } catch (e) {
    console.error('[MTS] Falha ao iniciar Firebase:', e);
  }
})();
