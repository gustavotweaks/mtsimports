// ===== MTS VENDAS - MAIN JS =====

// ===== DADOS DO STORE =====
const MTS = {
  // Produtos iniciais
  products: [
    { id: 1, name: "Sauvage Dior", category: "perfumes", price: 389.90, oldPrice: 520.00, badge: "Destaque", image: "", description: "Fragrância fresca e intensa com notas amadeiradas e de pimenta.", stock: 15 },
    { id: 2, name: "Bleu de Chanel", category: "perfumes", price: 425.00, oldPrice: null, badge: "Importado", image: "", description: "Woody aromatic fragrance, sofisticado e elegante.", stock: 8 },
    { id: 3, name: "Camiseta Premium Preta", category: "roupas", price: 129.90, oldPrice: 179.90, badge: "Sale", image: "", description: "Camiseta 100% algodão egípcio, corte slim.", stock: 30 },
    { id: 4, name: "Camiseta Branca Logo", category: "roupas", price: 119.90, oldPrice: null, badge: null, image: "", description: "Camiseta básica premium com bordado dourado.", stock: 25 },
    { id: 5, name: "Relógio Clássico Gold", category: "relogios", price: 689.90, oldPrice: 899.90, badge: "Oferta", image: "", description: "Relógio analógico com caixa dourada e pulseira de couro.", stock: 5 },
    { id: 6, name: "Relógio Black Matte", category: "relogios", price: 549.90, oldPrice: null, badge: "Novo", image: "", description: "Design minimalista preto fosco com mostrador clean.", stock: 7 },
    { id: 7, name: "Corrente Ouro 18k", category: "joias", price: 1299.90, oldPrice: 1599.90, badge: "Premium", image: "", description: "Corrente banhada a ouro 18k, 50cm, acabamento impecável.", stock: 3 },
    { id: 8, name: "Pulseira Luxo", category: "joias", price: 389.90, oldPrice: null, badge: null, image: "", description: "Pulseira banhada a ouro com zircônias.", stock: 10 },
    { id: 9, name: "Boné Dad Hat Gold", category: "bones", price: 89.90, oldPrice: 119.90, badge: null, image: "", description: "Dad hat premium bordado dourado, aba curva.", stock: 20 },
    { id: 10, name: "Boné Snapback Preto", category: "bones", price: 79.90, oldPrice: null, badge: "Novo", image: "", description: "Snapback premium com detalhe metálico dourado.", stock: 18 },
    { id: 11, name: "La Nuit Yves Saint Laurent", category: "perfumes", price: 359.90, oldPrice: 480.00, badge: null, image: "", description: "Sedutor, misterioso e elegante. Para noites especiais.", stock: 12 },
    { id: 12, name: "Bermuda Linho Premium", category: "roupas", price: 189.90, oldPrice: 249.90, badge: null, image: "", description: "Bermuda de linho italiano, caimento perfeito.", stock: 15 },
  ],

  cart: JSON.parse(localStorage.getItem('mts_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('mts_user') || 'null'),

  saveCart() {
    localStorage.setItem('mts_cart', JSON.stringify(this.cart));
    this.updateCartUI();
  },

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    const existing = this.cart.find(i => i.id === productId);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ ...product, qty: 1 });
    }
    this.saveCart();
    showToast(`"${product.name}" adicionado ao carrinho!`);
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(i => i.id !== productId);
    this.saveCart();
  },

  updateQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) this.removeFromCart(productId);
    else this.saveCart();
  },

  getTotal() {
    return this.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  updateCartUI() {
    const count = this.cart.reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    renderCart();
  }
};

// ===== RENDER CARRINHO =====
function renderCart() {
  const container = document.querySelector('.cart-items');
  const subtotalEl = document.querySelector('.cart-subtotal strong');
  if (!container) return;

  if (MTS.cart.length === 0) {
    container.innerHTML = `<div class="cart-empty"><i class="ri-shopping-bag-line"></i><p>Seu carrinho está vazio</p></div>`;
  } else {
    container.innerHTML = MTS.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<i class="ri-image-line" style="font-size:1.5rem;color:var(--border)"></i>`}
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
          <span class="cart-item-price">R$ ${(item.price * item.qty).toFixed(2).replace('.',',')}</span>
          <button class="cart-item-remove" onclick="MTS.removeFromCart(${item.id})"><i class="ri-delete-bin-line"></i></button>
        </div>
      </div>
    `).join('');
  }

  if (subtotalEl) {
    subtotalEl.textContent = `R$ ${MTS.getTotal().toFixed(2).replace('.',',')}`;
  }
}

function categoryLabel(cat) {
  const map = { perfumes:'Perfumes', roupas:'Roupas', relogios:'Relógios', joias:'Joias', bones:'Bonés' };
  return map[cat] || cat;
}

// ===== TOAST =====
function showToast(msg) {
  let toast = document.getElementById('mts-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mts-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    if (window.scrollY > 50) nav.style.background = 'rgba(10,10,10,0.98)';
    else nav.style.background = 'rgba(10,10,10,0.95)';
  }
});

// ===== HAMBURGER MENU =====
function toggleMobileMenu() {
  const menu = document.querySelector('.mobile-menu');
  if (menu) menu.classList.toggle('open');
}

// ===== CARRINHO TOGGLE =====
function toggleCart() {
  const overlay = document.querySelector('.cart-overlay');
  const sidebar = document.querySelector('.cart-sidebar');
  if (overlay) overlay.classList.toggle('open');
  if (sidebar) sidebar.classList.toggle('open');
  renderCart();
}

// ===== MODAL LOGIN/REGISTER =====
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

// ===== RENDER PRODUCTS =====
function renderProducts(products, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray)"><i class="ri-search-line" style="font-size:2rem"></i><p>Nenhum produto encontrado.</p></div>`;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="product-card" onclick="openProductModal(${p.id})">
      ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ''}
      <div class="product-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy">` : `
          <div class="product-img-placeholder">
            <i class="${catIcon(p.category)}"></i>
            <span style="font-size:0.7rem;letter-spacing:1px">${categoryLabel(p.category)}</span>
          </div>`}
      </div>
      <div class="product-actions-hover">
        <button class="btn btn-gold" style="flex:1;padding:10px;font-size:0.72rem" onclick="event.stopPropagation();MTS.addToCart(${p.id})"><i class="ri-shopping-bag-line"></i> Adicionar</button>
        <button class="btn btn-dark" style="padding:10px 14px" onclick="event.stopPropagation();openProductModal(${p.id})"><i class="ri-eye-line"></i></button>
      </div>
      <div class="product-info">
        <div class="product-category">${categoryLabel(p.category)}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span class="price">R$ ${p.price.toFixed(2).replace('.',',')}</span>
          ${p.oldPrice ? `<span class="price-old">R$ ${p.oldPrice.toFixed(2).replace('.',',')}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function catIcon(cat) {
  const icons = { perfumes:'ri-flask-line', roupas:'ri-t-shirt-line', relogios:'ri-time-line', joias:'ri-gem-line', bones:'ri-customer-service-2-line' };
  return icons[cat] || 'ri-shopping-bag-line';
}

// ===== MODAL PRODUTO =====
function openProductModal(id) {
  const product = MTS.products.find(p => p.id === id);
  if (!product) return;

  let modal = document.getElementById('product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width:560px">
        <button class="modal-close" onclick="closeModal('product-modal')"><i class="ri-close-line"></i></button>
        <div id="pm-content"></div>
      </div>`;
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal('product-modal'); });
    document.body.appendChild(modal);
  }

  document.getElementById('pm-content').innerHTML = `
    <div style="margin-bottom:1.5rem">
      <div style="width:100%;height:250px;background:var(--black-hover);display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem">
        ${product.image ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover">` : `<i class="${catIcon(product.category)}" style="font-size:4rem;color:var(--border)"></i>`}
      </div>
      ${product.badge ? `<div class="product-badge" style="position:relative;display:inline-block;margin-bottom:10px">${product.badge}</div>` : ''}
      <div class="product-category">${categoryLabel(product.category)}</div>
      <h2 style="margin:8px 0 12px">${product.name}</h2>
      <p style="color:var(--gray);font-size:0.9rem;line-height:1.7;margin-bottom:1.5rem">${product.description}</p>
      <div class="product-price" style="margin-bottom:1.5rem">
        <span class="price" style="font-size:1.5rem">R$ ${product.price.toFixed(2).replace('.',',')}</span>
        ${product.oldPrice ? `<span class="price-old">R$ ${product.oldPrice.toFixed(2).replace('.',',')}</span>` : ''}
      </div>
      <div style="display:flex;gap:1rem">
        <button class="btn btn-gold w-full" onclick="MTS.addToCart(${product.id});closeModal('product-modal')"><i class="ri-shopping-bag-line"></i> Adicionar ao Carrinho</button>
      </div>
      <p style="margin-top:1rem;font-size:0.78rem;color:var(--gray)"><i class="ri-stack-line"></i> Estoque: ${product.stock} unidades</p>
    </div>`;

  openModal('product-modal');
}

// ===== CHATBOT =====
const botResponses = {
  greetings: ['oi','olá','ola','hey','bom dia','boa tarde','boa noite','hello'],
  delivery: ['entrega','prazo','frete','envio','shipping'],
  payment: ['pagamento','pagar','pix','cartão','boleto','parcelar','parcela'],
  return: ['troca','devolução','devolver','retorno','reembolso'],
  size: ['tamanho','medida','tamanhos','numeração','número'],
  perfume: ['perfume','fragrância','aroma','cheiro'],
  clothes: ['roupa','camiseta','bermuda','calça','vestido'],
  watch: ['relógio','relogio'],
  jewelry: ['joia','corrente','pulseira','anel','brinco'],
  hat: ['boné','bone','cap'],
  whatsapp: ['whatsapp','zap','atendimento','humano','pessoa'],
};

const botReplies = {
  greetings: 'Olá! 👋 Bem-vindo(a) à MTS Vendas. Sou o assistente virtual. Como posso te ajudar hoje?',
  delivery: '📦 Entregamos para todo o Brasil! O prazo é de 3 a 7 dias úteis. Frete grátis acima de R$ 299. Você recebe o código de rastreio por e-mail.',
  payment: '💳 Aceitamos: Cartão de crédito (até 12x), Pix (5% de desconto) e Boleto bancário. Parcelamento sem juros disponível!',
  return: '🔄 Você tem 30 dias para solicitar troca ou devolução. O produto precisa estar na embalagem original. Entre em contato pelo WhatsApp.',
  size: '📏 Trabalhamos com as numerações S, M, L, XL e XXL. A grade de medidas está disponível em cada produto. Em caso de dúvida, recomendamos o tamanho acima.',
  perfume: '🌸 Temos uma linha exclusiva de perfumes importados. Sauvage Dior, Bleu de Chanel, YSL e muito mais. Todos com procedência garantida!',
  clothes: '👕 Nossa linha de roupas é premium. Camisetas, bermudas e acessórios com materiais de alta qualidade e design exclusivo.',
  watch: '⌚ Relógios clássicos e modernos com design sofisticado. Perfeito para completar qualquer look!',
  jewelry: '💎 Joias banhadas a ouro 18k com acabamento de luxo. Correntes, pulseiras e muito mais.',
  hat: '🧢 Bonés premium com bordados e detalhes dourados. Dad hats e snapbacks exclusivos.',
  whatsapp: '📱 Para falar com um atendente, acesse nosso WhatsApp: (11) 99999-9999. Horário: Seg-Sex 9h-18h.',
  default: 'Não entendi muito bem. Posso te ajudar com informações sobre: entrega, pagamento, trocas, tamanhos ou produtos. O que prefere?'
};

function getBotResponse(msg) {
  const lower = msg.toLowerCase();
  for (const [key, keywords] of Object.entries(botResponses)) {
    if (keywords.some(k => lower.includes(k))) return botReplies[key];
  }
  return botReplies.default;
}

function toggleChatbot() {
  const win = document.querySelector('.chatbot-window');
  if (win) win.classList.toggle('open');
}

function sendChatMessage(msg) {
  const msgs = document.querySelector('.chatbot-messages');
  if (!msgs) return;

  const userMsg = msg || document.querySelector('#chat-input')?.value?.trim();
  if (!userMsg) return;

  const inputEl = document.querySelector('#chat-input');
  if (inputEl) inputEl.value = '';

  msgs.innerHTML += `<div class="chat-msg user">${userMsg}</div>`;

  setTimeout(() => {
    const reply = getBotResponse(userMsg);
    msgs.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 600);

  msgs.scrollTop = msgs.scrollHeight;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  MTS.updateCartUI();

  // Enter no chatbot
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  // Fechar cart ao clicar overlay
  document.querySelector('.cart-overlay')?.addEventListener('click', toggleCart);
});
