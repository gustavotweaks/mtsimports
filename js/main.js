// ===================================================
//  MTS VENDAS — main.js  v3
//  WhatsApp checkout · modal produto com quantidade
//  toasts premium · chatbot · carrinho
// ===================================================

// ─── CONFIGURAÇÕES GLOBAIS ───────────────────────
const MTS_CONFIG = {
  whatsapp: '5524988700312',          // +55 24 98870-0312
  storeName: 'MTS Vendas',
  freteGratis: 299,
};

// ─── DADOS DO STORE ──────────────────────────────
const MTS = {
  products: [
    { id:1,  name:"Sauvage Dior EDP",         category:"perfumes",  price:389.90, oldPrice:520.00,  badge:"Destaque",  image:"", description:"Fragrância fresca e intensa com notas amadeiradas e de pimenta. Masculino e sofisticado.",           stock:15 },
    { id:2,  name:"Bleu de Chanel EDP",        category:"perfumes",  price:425.00, oldPrice:null,    badge:"Importado", image:"", description:"Woody aromatic fragrance, sofisticado e elegante para o homem moderno.",                              stock:8  },
    { id:3,  name:"Camiseta Premium Preta",    category:"roupas",    price:129.90, oldPrice:179.90,  badge:"Sale",      image:"", description:"Camiseta 100% algodão egípcio, corte slim, costura reforçada.",                                      stock:30 },
    { id:4,  name:"Camiseta Branca Logo",      category:"roupas",    price:119.90, oldPrice:null,    badge:null,        image:"", description:"Camiseta básica premium com bordado dourado exclusivo.",                                             stock:25 },
    { id:5,  name:"Relógio Clássico Gold",     category:"relogios",  price:689.90, oldPrice:899.90,  badge:"Oferta",    image:"", description:"Relógio analógico com caixa dourada e pulseira de couro legítimo.",                                  stock:5  },
    { id:6,  name:"Relógio Black Matte",       category:"relogios",  price:549.90, oldPrice:null,    badge:"Novo",      image:"", description:"Design minimalista preto fosco com mostrador clean e ponteiros dourados.",                            stock:7  },
    { id:7,  name:"Corrente Ouro 18k",         category:"joias",     price:1299.90,oldPrice:1599.90, badge:"Premium",   image:"", description:"Corrente banhada a ouro 18k, 50cm, acabamento impecável e duradouro.",                               stock:3  },
    { id:8,  name:"Pulseira Luxo",             category:"joias",     price:389.90, oldPrice:null,    badge:null,        image:"", description:"Pulseira banhada a ouro com zircônias de alta qualidade.",                                           stock:10 },
    { id:9,  name:"Boné Dad Hat Gold",         category:"bones",     price:89.90,  oldPrice:119.90,  badge:null,        image:"", description:"Dad hat premium com bordado dourado, aba curva regulável.",                                          stock:20 },
    { id:10, name:"Boné Snapback Preto",       category:"bones",     price:79.90,  oldPrice:null,    badge:"Novo",      image:"", description:"Snapback premium aba plana com detalhe metálico dourado.",                                           stock:18 },
    { id:11, name:"La Nuit YSL",               category:"perfumes",  price:359.90, oldPrice:480.00,  badge:null,        image:"", description:"Yves Saint Laurent La Nuit. Sedutor, misterioso e elegante. Para noites especiais.",                 stock:12 },
    { id:12, name:"Bermuda Linho Premium",     category:"roupas",    price:189.90, oldPrice:249.90,  badge:null,        image:"", description:"Bermuda de linho italiano, caimento perfeito, conforto o dia todo.",                                 stock:15 },
  ],

  cart: JSON.parse(localStorage.getItem('mts_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('mts_user') || 'null'),

  saveCart() {
    localStorage.setItem('mts_cart', JSON.stringify(this.cart));
    this.updateCartUI();
  },

  addToCart(productId, qty = 1) {
    // Sincronizar com produtos do admin
    const adminProds = JSON.parse(localStorage.getItem('mts_admin_products') || 'null');
    if (adminProds) this.products = adminProds;

    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
      showToast('Produto sem estoque no momento.', 'warning');
      return;
    }
    const existing = this.cart.find(i => i.id === productId);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({ ...product, qty });
    }
    this.saveCart();
    showToast(`✓ "${product.name}" adicionado ao carrinho!`, 'success');
    // Animação no ícone do carrinho
    document.querySelectorAll('.btn-icon .ri-shopping-bag-line').forEach(el => {
      el.parentElement.style.transform = 'scale(1.3)';
      setTimeout(() => el.parentElement.style.transform = '', 300);
    });
  },

  removeFromCart(productId) {
    const item = this.cart.find(i => i.id === productId);
    this.cart = this.cart.filter(i => i.id !== productId);
    this.saveCart();
    if (item) showToast(`"${item.name}" removido do carrinho.`, 'info');
  },

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty = Math.max(1, item.qty + delta);
    this.saveCart();
  },

  getTotal() {
    return this.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  getCount() {
    return this.cart.reduce((sum, i) => sum + i.qty, 0);
  },

  updateCartUI() {
    const count = this.getCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    renderCart();
  },

  // ── CHECKOUT VIA WHATSAPP ──────────────────────
  checkout() {
    if (this.cart.length === 0) {
      showToast('Seu carrinho está vazio!', 'warning');
      return;
    }

    const cfg = JSON.parse(localStorage.getItem('mts_site_config') || '{}');
    const wpp = cfg.checkoutWpp
      ? cfg.checkoutWpp.replace(/\D/g, '')
      : MTS_CONFIG.whatsapp;

    const total = this.getTotal();
    const frete = total >= MTS_CONFIG.freteGratis ? 'GRÁTIS 🎁' : 'A calcular';

    // Montar mensagem linha a linha
    let msg = `Olá! Gostaria de finalizar meu pedido na *${MTS_CONFIG.storeName}* 🛍️\n\n`;
    msg += `*📋 RESUMO DO PEDIDO:*\n`;
    msg += `${'─'.repeat(30)}\n`;

    this.cart.forEach((item, i) => {
      msg += `\n*${i + 1}. ${item.name}*\n`;
      msg += `   Categoria: ${categoryLabel(item.category)}\n`;
      msg += `   Qtd: ${item.qty}x  |  Unit: R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
      msg += `   Subtotal: R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}\n`;
    });

    msg += `\n${'─'.repeat(30)}\n`;
    msg += `*🛒 Total de itens:* ${this.getCount()}\n`;
    msg += `*💰 Total do pedido:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
    msg += `*🚚 Frete:* ${frete}\n`;

    const user = JSON.parse(localStorage.getItem('mts_user') || 'null');
    if (user) {
      msg += `\n${'─'.repeat(30)}\n`;
      msg += `*👤 Cliente:* ${user.name}\n`;
      msg += `*📧 E-mail:* ${user.email}\n`;
    }

    msg += `\n${'─'.repeat(30)}\n`;
    msg += `_Pedido gerado em ${new Date().toLocaleString('pt-BR')}_`;

    const url = `https://wa.me/${wpp}?text=${encodeURIComponent(msg)}`;

    // Salvar pedido no histórico local
    const pedidos = JSON.parse(localStorage.getItem('mts_pedidos') || '[]');
    pedidos.push({
      id: Date.now(),
      items: [...this.cart],
      total,
      status: 'Aguardando',
      date: new Date().toLocaleString('pt-BR'),
      customer: user ? user.name : 'Visitante',
      email: user ? user.email : '—',
    });
    localStorage.setItem('mts_pedidos', JSON.stringify(pedidos));

    // Limpar carrinho e redirecionar
    this.cart = [];
    this.saveCart();

    showToast('Redirecionando para o WhatsApp... 📱', 'success');
    setTimeout(() => window.open(url, '_blank'), 800);
  }
};

// ─── HELPERS ─────────────────────────────────────
function categoryLabel(cat) {
  return { perfumes:'Perfumes', roupas:'Roupas', relogios:'Relógios', joias:'Joias', bones:'Bonés' }[cat] || cat;
}

function catIcon(cat) {
  return { perfumes:'ri-flask-line', roupas:'ri-t-shirt-line', relogios:'ri-time-line', joias:'ri-gem-line', bones:'ri-shield-star-line' }[cat] || 'ri-shopping-bag-line';
}

function fmtPrice(val) {
  return 'R$ ' + val.toFixed(2).replace('.', ',');
}

// ─── TOAST PREMIUM ───────────────────────────────
// tipos: success | warning | info | error
function showToast(msg, type = 'success') {
  let toast = document.getElementById('mts-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mts-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  const icons = { success:'ri-check-circle-line', warning:'ri-alert-line', info:'ri-information-line', error:'ri-error-warning-line' };
  const colors = { success:'var(--gold)', warning:'#f39c12', info:'#3498db', error:'#e74c3c' };

  toast.innerHTML = `<i class="${icons[type]}" style="color:${colors[type]};margin-right:8px"></i>${msg}`;
  toast.style.borderColor = colors[type];
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// ─── RENDER CARRINHO ─────────────────────────────
function renderCart() {
  const container = document.querySelector('.cart-items');
  const subtotalEl = document.querySelector('.cart-subtotal strong');
  if (!container) return;

  if (MTS.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <i class="ri-shopping-bag-line"></i>
        <p style="margin-bottom:0.5rem">Seu carrinho está vazio</p>
        <span style="font-size:0.75rem;color:var(--gray)">Adicione produtos para continuar</span>
      </div>`;
  } else {
    container.innerHTML = MTS.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image
            ? `<img src="${item.image}" alt="${item.name}">`
            : `<i class="${catIcon(item.category)}" style="font-size:1.4rem;color:rgba(201,168,76,0.3)"></i>`}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-cat">${categoryLabel(item.category)}</div>
          <h4>${item.name}</h4>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="MTS.updateQty(${item.id},-1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="MTS.updateQty(${item.id},1)">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <span class="cart-item-price">${fmtPrice(item.price * item.qty)}</span>
          <span style="font-size:0.65rem;color:var(--gray)">${fmtPrice(item.price)} cada</span>
          <button class="cart-item-remove" onclick="MTS.removeFromCart(${item.id})" title="Remover">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>`).join('');
  }

  if (subtotalEl) subtotalEl.textContent = fmtPrice(MTS.getTotal());

  // Barra de progresso do frete grátis
  const total = MTS.getTotal();
  const progress = Math.min((total / MTS_CONFIG.freteGratis) * 100, 100);
  const faltam = MTS_CONFIG.freteGratis - total;

  let freteBar = document.getElementById('frete-bar-wrap');
  const cartFooter = document.querySelector('.cart-footer');
  if (cartFooter && MTS.cart.length > 0) {
    if (!freteBar) {
      freteBar = document.createElement('div');
      freteBar.id = 'frete-bar-wrap';
      freteBar.style.cssText = 'padding:0 1.5rem 1rem';
      cartFooter.insertBefore(freteBar, cartFooter.firstChild);
    }
    if (total >= MTS_CONFIG.freteGratis) {
      freteBar.innerHTML = `
        <div style="font-size:0.72rem;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:5px">
          <i class="ri-truck-line"></i> Parabéns! Você ganhou <strong>frete grátis</strong> 🎉
        </div>
        <div style="height:3px;background:var(--black-hover);border-radius:2px">
          <div style="height:100%;width:100%;background:var(--green);border-radius:2px;transition:width 0.5s"></div>
        </div>`;
    } else {
      freteBar.innerHTML = `
        <div style="font-size:0.72rem;color:var(--gray-light);margin-bottom:6px;display:flex;align-items:center;gap:5px">
          <i class="ri-truck-line"></i> Falta <strong style="color:var(--gold)">${fmtPrice(faltam)}</strong> para frete grátis
        </div>
        <div style="height:3px;background:var(--black-hover);border-radius:2px">
          <div style="height:100%;width:${progress}%;background:var(--gold);border-radius:2px;transition:width 0.5s"></div>
        </div>`;
    }
  } else if (freteBar) freteBar.remove();
}

// ─── NAVBAR SCROLL ────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ─── MOBILE MENU ─────────────────────────────────
function toggleMobileMenu() {
  const menu = document.querySelector('.mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// ─── CARRINHO TOGGLE ─────────────────────────────
function toggleCart() {
  const overlay = document.querySelector('.cart-overlay');
  const sidebar = document.querySelector('.cart-sidebar');
  overlay?.classList.toggle('open');
  sidebar?.classList.toggle('open');
  renderCart();
}

// ─── MODAL HELPERS ───────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open');    }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ─── RENDER PRODUCTS ─────────────────────────────
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--gray)">
        <i class="ri-search-line" style="font-size:2.5rem;display:block;margin-bottom:1rem;opacity:0.3"></i>
        <p>Nenhum produto encontrado.</p>
      </div>`;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="product-card" onclick="openProductModal(${p.id})">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      ${p.stock <= 0 ? `<div class="product-badge" style="background:var(--black-hover);color:var(--gray);border:1px solid var(--border-soft)">Esgotado</div>` : ''}
      <div class="product-img">
        ${p.image
          ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
          : `<div class="product-img-placeholder">
               <i class="${catIcon(p.category)}"></i>
               <span>${categoryLabel(p.category)}</span>
             </div>`}
      </div>
      <div class="product-actions-hover">
        <button class="btn btn-gold" style="flex:1;padding:10px;font-size:0.7rem"
          onclick="event.stopPropagation();${p.stock > 0 ? `MTS.addToCart(${p.id})` : `showToast('Produto sem estoque.','warning')`}">
          <i class="ri-shopping-bag-line"></i> ${p.stock > 0 ? 'Adicionar' : 'Esgotado'}
        </button>
        <button class="btn btn-dark" style="padding:10px 14px"
          onclick="event.stopPropagation();openProductModal(${p.id})" title="Ver detalhes">
          <i class="ri-eye-line"></i>
        </button>
      </div>
      <div class="product-info">
        <div class="product-category">${categoryLabel(p.category)}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span class="price">${fmtPrice(p.price)}</span>
          ${p.oldPrice ? `<span class="price-old">${fmtPrice(p.oldPrice)}</span>` : ''}
        </div>
        ${p.oldPrice ? `<div style="font-size:0.62rem;color:var(--green);margin-top:4px">
          economia de ${fmtPrice(p.oldPrice - p.price)}
        </div>` : ''}
      </div>
    </div>`).join('');
}

// ─── MODAL PRODUTO COM QUANTIDADE ────────────────
function openProductModal(id) {
  const adminProds = JSON.parse(localStorage.getItem('mts_admin_products') || 'null');
  if (adminProds) MTS.products = adminProds;

  const product = MTS.products.find(p => p.id === id);
  if (!product) return;

  // Criar modal se não existir
  let modal = document.getElementById('product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:580px;padding:0;overflow:hidden">
        <button class="modal-close" onclick="closeModal('product-modal')" style="z-index:2">
          <i class="ri-close-line"></i>
        </button>
        <div id="pm-content"></div>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) closeModal('product-modal'); });
    document.body.appendChild(modal);
  }

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  const inStock = product.stock > 0;

  document.getElementById('pm-content').innerHTML = `
    <!-- Imagem -->
    <div style="width:100%;height:280px;background:var(--black-hover);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
      ${product.image
        ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover">`
        : `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;z-index:1">
             <i class="${catIcon(product.category)}" style="font-size:5rem;color:rgba(201,168,76,0.2)"></i>
             <span style="font-size:0.65rem;letter-spacing:3px;text-transform:uppercase;color:var(--gray)">${categoryLabel(product.category)}</span>
           </div>
           <div style="position:absolute;inset:0;background:linear-gradient(rgba(201,168,76,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.02) 1px,transparent 1px);background-size:28px 28px"></div>`}
      ${product.badge ? `<div class="product-badge" style="position:absolute;top:0;left:0">${product.badge}</div>` : ''}
      ${discount > 0 ? `<div style="position:absolute;top:0;right:0;background:var(--green);color:#fff;font-family:'Space Grotesk',sans-serif;font-size:0.7rem;font-weight:700;padding:4px 10px">−${discount}%</div>` : ''}
    </div>

    <!-- Infos -->
    <div style="padding:1.8rem">
      <div class="product-category" style="margin-bottom:6px">${categoryLabel(product.category)}</div>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:400;margin-bottom:0.8rem">${product.name}</h2>
      <p style="color:var(--gray);font-size:0.85rem;line-height:1.8;margin-bottom:1.5rem">${product.description}</p>

      <!-- Preço -->
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:1.5rem">
        <span style="font-family:'Space Grotesk',sans-serif;font-size:1.8rem;font-weight:700;color:var(--gold)">${fmtPrice(product.price)}</span>
        ${product.oldPrice ? `<span style="font-size:0.95rem;color:var(--gray);text-decoration:line-through">${fmtPrice(product.oldPrice)}</span>` : ''}
        ${discount > 0 ? `<span style="font-size:0.72rem;background:rgba(39,174,96,0.12);color:#27ae60;border:1px solid rgba(39,174,96,0.2);padding:2px 8px;font-family:'Space Grotesk',sans-serif;font-weight:600">Economize ${fmtPrice(product.oldPrice - product.price)}</span>` : ''}
      </div>

      <!-- Seletor de quantidade -->
      <div style="margin-bottom:1.5rem">
        <div style="font-size:0.62rem;letter-spacing:2.5px;text-transform:uppercase;color:var(--gray);margin-bottom:8px">Quantidade</div>
        <div style="display:flex;align-items:center;gap:0">
          <button onclick="pmQty(-1)"
            style="width:40px;height:40px;background:var(--black-hover);border:1px solid var(--border-soft);color:var(--white);font-size:1.1rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center"
            onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border-soft)'">−</button>
          <div id="pm-qty-val"
            style="width:52px;height:40px;background:var(--black-card);border-top:1px solid var(--border-soft);border-bottom:1px solid var(--border-soft);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:0.95rem">
            1
          </div>
          <button onclick="pmQty(1)"
            style="width:40px;height:40px;background:var(--black-hover);border:1px solid var(--border-soft);color:var(--white);font-size:1.1rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center"
            onmouseover="this.style.borderColor='var(--gold)'" onmouseout="this.style.borderColor='var(--border-soft)'">+</button>
          <span style="margin-left:12px;font-size:0.72rem;color:var(--gray)">
            ${inStock
              ? (product.stock <= 5 ? `<span style="color:#f39c12"><i class="ri-alert-line"></i> Apenas ${product.stock} em estoque</span>` : `<i class="ri-checkbox-circle-line" style="color:var(--green)"></i> Em estoque`)
              : `<span style="color:var(--red)"><i class="ri-close-circle-line"></i> Esgotado</span>`}
          </span>
        </div>
        <div id="pm-subtotal" style="margin-top:8px;font-size:0.75rem;color:var(--gray)">
          Subtotal: <strong style="color:var(--gold)">${fmtPrice(product.price)}</strong>
        </div>
      </div>

      <!-- Parcelamento -->
      <div style="background:var(--gold-pale);border:1px solid var(--border);padding:0.8rem 1rem;margin-bottom:1.5rem;font-size:0.75rem;color:var(--gray-light);display:flex;align-items:center;gap:8px">
        <i class="ri-secure-payment-line" style="color:var(--gold)"></i>
        Em até <strong style="color:var(--gold);margin:0 3px">12x</strong> sem juros no cartão ou <strong style="color:var(--gold);margin:0 3px">5% off</strong> no Pix
      </div>

      <!-- Botões -->
      <div style="display:flex;gap:0.8rem">
        <button class="btn btn-gold" style="flex:1"
          onclick="${inStock ? `addToCartFromModal(${product.id})` : `showToast('Produto sem estoque.','warning')`}"
          ${inStock ? '' : 'disabled style="opacity:0.5;cursor:not-allowed"'}>
          <i class="ri-shopping-bag-line"></i> ${inStock ? 'Adicionar ao Carrinho' : 'Produto Esgotado'}
        </button>
        <button class="btn btn-outline" onclick="buyNow(${product.id})" title="Comprar agora via WhatsApp"
          ${inStock ? '' : 'disabled style="opacity:0.5;cursor:not-allowed"'}>
          <i class="ri-whatsapp-line"></i>
        </button>
      </div>
      <p style="margin-top:1rem;font-size:0.7rem;color:var(--gray);text-align:center">
        <i class="ri-shield-check-line" style="color:var(--gold)"></i>
        Compra 100% segura &nbsp;·&nbsp;
        <i class="ri-truck-line" style="color:var(--gold)"></i>
        Entrega para todo o Brasil
      </p>
    </div>`;

  // Guardar id do produto atual no modal
  modal.dataset.productId = id;
  openModal('product-modal');
}

// Ajusta quantidade no modal
function pmQty(delta) {
  const el = document.getElementById('pm-qty-val');
  if (!el) return;
  const modal = document.getElementById('product-modal');
  const id = parseInt(modal?.dataset.productId);
  const product = MTS.products.find(p => p.id === id);
  const max = product?.stock || 99;
  let val = parseInt(el.textContent) + delta;
  val = Math.max(1, Math.min(val, max));
  el.textContent = val;
  // Atualizar subtotal
  const sub = document.getElementById('pm-subtotal');
  if (sub && product) {
    sub.innerHTML = `Subtotal: <strong style="color:var(--gold)">${fmtPrice(product.price * val)}</strong>`;
  }
}

// Adicionar com a quantidade selecionada no modal
function addToCartFromModal(id) {
  const qtyEl = document.getElementById('pm-qty-val');
  const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;
  MTS.addToCart(id, qty);
  closeModal('product-modal');
  // Abrir carrinho depois de 400ms
  setTimeout(() => toggleCart(), 400);
}

// Comprar agora direto no WhatsApp (1 item)
function buyNow(id) {
  const adminProds = JSON.parse(localStorage.getItem('mts_admin_products') || 'null');
  if (adminProds) MTS.products = adminProds;
  const product = MTS.products.find(p => p.id === id);
  if (!product) return;

  const qtyEl = document.getElementById('pm-qty-val');
  const qty = qtyEl ? parseInt(qtyEl.textContent) : 1;

  const cfg = JSON.parse(localStorage.getItem('mts_site_config') || '{}');
  const wpp = cfg.checkoutWpp
    ? cfg.checkoutWpp.replace(/\D/g, '')
    : MTS_CONFIG.whatsapp;

  let msg = `Olá! Tenho interesse em comprar na *${MTS_CONFIG.storeName}* 🛍️\n\n`;
  msg += `*Produto:* ${product.name}\n`;
  msg += `*Categoria:* ${categoryLabel(product.category)}\n`;
  msg += `*Quantidade:* ${qty}\n`;
  msg += `*Preço unitário:* ${fmtPrice(product.price)}\n`;
  msg += `*Total:* ${fmtPrice(product.price * qty)}\n\n`;
  msg += `Aguardo informações sobre pagamento e entrega! 😊`;

  window.open(`https://wa.me/${wpp}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─── CHATBOT ─────────────────────────────────────
const _botKw = {
  greetings:['oi','olá','ola','hey','bom dia','boa tarde','boa noite','hello','tudo bem'],
  delivery: ['entrega','prazo','frete','envio','shipping','chega','demora'],
  payment:  ['pagamento','pagar','pix','cartão','boleto','parcelar','parcela','forma'],
  return:   ['troca','devolução','devolver','retorno','reembolso','cancelar'],
  size:     ['tamanho','medida','tamanhos','numeração','número','grade'],
  perfume:  ['perfume','fragrância','aroma','cheiro','parfum'],
  clothes:  ['roupa','camiseta','bermuda','calça','vestido','blusa'],
  watch:    ['relógio','relogio','watch'],
  jewelry:  ['joia','corrente','pulseira','anel','brinco','colar'],
  hat:      ['boné','bone','cap','chapéu'],
  whatsapp: ['whatsapp','zap','atendimento','humano','pessoa','falar'],
  tracking: ['rastreio','rastrear','código','onde','chegou'],
};

const _botReplies = {
  greetings: `Olá! 👋 Seja bem-vindo(a) à *MTS Vendas*. Sou o assistente virtual. Como posso te ajudar hoje?`,
  delivery:  `📦 Entregamos para **todo o Brasil**!\n• Prazo: 3 a 7 dias úteis\n• Frete grátis em compras acima de R$ 299\n• Você recebe o código de rastreio por WhatsApp`,
  payment:   `💳 Formas de pagamento:\n• Cartão de crédito (até 12x sem juros)\n• Pix (5% de desconto)\n• Boleto bancário\n\nSeu pedido é processado com segurança total!`,
  return:    `🔄 Nossa política de trocas:\n• Você tem **30 dias** após o recebimento\n• O produto precisa estar na embalagem original\n• Entre em contato pelo WhatsApp para iniciar o processo`,
  size:      `📏 Nossas numerações: **P · M · G · GG · XG**\nA grade completa está em cada produto.\n\nDica: em caso de dúvida entre dois tamanhos, recomendamos o maior!`,
  perfume:   `🌸 Nossa linha de perfumes importados:\n• Sauvage Dior, Bleu de Chanel, YSL e muito mais\n• Todos originais com procedência garantida\n• Embalagem lacrada de fábrica`,
  clothes:   `👕 Nossa linha de roupas é toda premium!\n• Algodão egípcio e linho italiano\n• Bordados e acabamentos exclusivos\n• Cortes modernos e confortáveis`,
  watch:     `⌚ Nossos relógios são sofisticados e elegantes!\n• Relógio Clássico Gold — R$ 689,90\n• Relógio Black Matte — R$ 549,90\n\nPerfeitos para qualquer ocasião!`,
  jewelry:   `💎 Joias banhadas a ouro 18k!\n• Correntes, pulseiras, anéis e brincos\n• Acabamento premium de longa duração\n• Embalagem de presente inclusa`,
  hat:       `🧢 Bonés premium exclusivos!\n• Dad Hat com bordado dourado\n• Snapback com detalhe metálico\n• Ajuste regulável, encaixa em todos os tamanhos`,
  whatsapp:  `📱 Para falar com um atendente agora:\nWhatsApp: **(24) 98870-0312**\nHorário: Seg-Sex 9h–18h / Sáb 9h–14h\n\nOu clique abaixo para ir direto!`,
  tracking:  `🔍 Para rastrear seu pedido:\n1. Acesse o link enviado por WhatsApp\n2. Ou entre em contato com nosso suporte\n\nTodos os pedidos têm rastreamento incluso!`,
  default:   `Hmm, não entendi muito bem. 🤔\nPosso te ajudar com:\n• 📦 Entrega e prazos\n• 💳 Formas de pagamento\n• 🔄 Trocas e devoluções\n• 📏 Tamanhos\n• 📱 Falar com atendente\n\nSó digitar!`,
};

function getBotResponse(msg) {
  const lower = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  for (const [key, kws] of Object.entries(_botKw)) {
    if (kws.some(k => lower.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g,'')))) {
      return _botReplies[key];
    }
  }
  return _botReplies.default;
}

function toggleChatbot() {
  const win = document.querySelector('.chatbot-window');
  if (win) win.classList.toggle('open');
}

function sendChatMessage(msg) {
  const msgsEl = document.querySelector('.chatbot-messages');
  if (!msgsEl) return;
  const text = msg || document.querySelector('#chat-input')?.value?.trim();
  if (!text) return;
  const inp = document.querySelector('#chat-input');
  if (inp) inp.value = '';

  // Mensagem do usuário
  msgsEl.innerHTML += `<div class="chat-msg user">${text}</div>`;
  msgsEl.scrollTop = msgsEl.scrollHeight;

  // Indicador de digitação
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.innerHTML = `<span style="letter-spacing:3px;opacity:0.5">···</span>`;
  msgsEl.appendChild(typing);
  msgsEl.scrollTop = msgsEl.scrollHeight;

  setTimeout(() => {
    const reply = getBotResponse(text);
    typing.innerHTML = reply.replace(/\n/g,'<br>').replace(/\*([^*]+)\*/g,'<strong>$1</strong>');

    // Botão de WhatsApp se mencionar atendente
    if (text.toLowerCase().includes('whatsapp') || text.toLowerCase().includes('atendente') || text.toLowerCase().includes('humano')) {
      const cfg = JSON.parse(localStorage.getItem('mts_site_config') || '{}');
      const wpp = (cfg.checkoutWpp || '').replace(/\D/g,'') || MTS_CONFIG.whatsapp;
      typing.innerHTML += `<br><br><a href="https://wa.me/${wpp}" target="_blank"
        style="display:inline-flex;align-items:center;gap:6px;background:var(--gold);color:var(--black);padding:7px 14px;font-family:'Space Grotesk',sans-serif;font-size:0.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;text-decoration:none">
        <i class="ri-whatsapp-line"></i> Abrir WhatsApp
      </a>`;
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }, 750);
}

// ─── POPUP DE BOAS-VINDAS ─────────────────────────
function initWelcomePopup() {
  // Mostrar só uma vez por sessão
  if (sessionStorage.getItem('mts_welcomed')) return;

  const cfg = JSON.parse(localStorage.getItem('mts_site_config') || '{}');
  if (cfg['sw-welcomePopup'] === false) return;

  setTimeout(() => {
    let pop = document.getElementById('welcome-popup');
    if (pop) return;

    pop = document.createElement('div');
    pop.id = 'welcome-popup';
    pop.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.88);backdrop-filter:blur(10px);
      z-index:5000;display:flex;align-items:center;justify-content:center;padding:2rem;
      animation:fadeIn 0.4s ease`;
    pop.innerHTML = `
      <div style="background:var(--black-card);border:1px solid var(--border);max-width:420px;width:100%;text-align:center;position:relative;overflow:hidden">
        <div style="position:absolute;top:0;left:15%;right:15%;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent)"></div>
        <div style="padding:2.5rem 2rem">
          <div style="font-size:0.6rem;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem">Bem-vindo(a)</div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;margin-bottom:0.8rem">MTS <em style="font-style:normal;color:var(--gold)">Vendas</em></h2>
          <p style="color:var(--gray);font-size:0.85rem;line-height:1.8;margin-bottom:1.8rem">
            Perfumes importados, roupas premium, relógios, joias e bonés exclusivos.<br>
            <strong style="color:var(--white)">Frete grátis</strong> em compras acima de <strong style="color:var(--gold)">R$ 299</strong>!
          </p>
          <button onclick="document.getElementById('welcome-popup').remove()"
            style="width:100%;padding:13px;background:linear-gradient(135deg,var(--gold-dark),var(--gold));color:var(--black);border:none;font-family:'Space Grotesk',sans-serif;font-size:0.72rem;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;transition:all 0.2s"
            onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            <i class="ri-shopping-bag-line"></i> &nbsp;Explorar Coleção
          </button>
          <button onclick="document.getElementById('welcome-popup').remove()"
            style="background:none;border:none;color:var(--gray);font-size:0.72rem;cursor:pointer;margin-top:1rem;font-family:'Space Grotesk',sans-serif">
            Fechar
          </button>
        </div>
      </div>`;
    pop.addEventListener('click', e => { if (e.target === pop) pop.remove(); });
    document.body.appendChild(pop);
    sessionStorage.setItem('mts_welcomed', '1');
  }, 1800);
}

// ─── CARREGAMENTO DE PRODUTOS (JSON do servidor) ─
// Fluxo de prioridade:
//  1. data/produtos.json (arquivo no GitHub — fonte oficial para todos)
//  2. localStorage mts_admin_products (fallback offline/admin local)
//  3. produtos hardcoded no array MTS.products (último recurso)

async function loadProducts() {
  // 1) Firestore: fonte global para todos os visitantes
  if (window.MTSCloud?.ready) {
    try {
      const cloud = await window.MTSCloud.getProducts();
      if (Array.isArray(cloud)) {
        MTS.products = cloud;
        localStorage.setItem('mts_admin_products', JSON.stringify(cloud));
      }
      // Atualização em tempo real sem precisar limpar cache/recarregar
      if (!window.__mtsProductsSubscribed) {
        window.__mtsProductsSubscribed = true;
        window.MTSCloud.subscribeProducts(products => {
          MTS.products = products;
          localStorage.setItem('mts_admin_products', JSON.stringify(products));
          document.dispatchEvent(new CustomEvent('mts:products-loaded', { detail: products }));
          // Re-renderizações comuns
          try {
            if (document.getElementById('featured-products')) renderProducts(MTS.products.slice(0, 4), 'featured-products');
            if (document.getElementById('perfumes-section')) renderProducts(MTS.products.filter(p => p.category === 'perfumes'), 'perfumes-section');
            if (document.getElementById('products-grid')) renderAllProducts?.();
          } catch (_) {}
        });
      }
      if (Array.isArray(cloud)) return;
    } catch (e) { console.error('[MTS] Falha ao carregar Firestore:', e); }
  }

  // 2) JSON publicado: fallback para instalações ainda sem Firebase
  const isSubpage = window.location.pathname.includes('/pages/');
  const base = isSubpage ? '../' : './';
  const jsonUrl = base + 'data/produtos.json';
  try {
    const res = await fetch(jsonUrl + '?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('JSON não encontrado');
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      MTS.products = data;
      localStorage.setItem('mts_admin_products', JSON.stringify(data));
      return;
    }
  } catch (e) {}

  // 3) Cache local: último fallback
  const local = JSON.parse(localStorage.getItem('mts_admin_products') || 'null');
  if (local && local.length > 0) MTS.products = local;
}

// ─── INIT ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Carregar produtos do JSON (servidor) — aguardar antes de renderizar
  await loadProducts();

  MTS.updateCartUI();

  // Enter no chatbot
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  // Popup de boas-vindas (só na home)
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    initWelcomePopup();
  }

  // Disparar evento para páginas que precisam re-renderizar após load
  document.dispatchEvent(new CustomEvent('mts:products-loaded'));
});
