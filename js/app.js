let cart = JSON.parse(localStorage.getItem('cart')) || [];
let globalProducts = [];
let currentCategory = 'all';

let currentModalProductId = null;
let currentModalQty = 1;

function updateCartBadge() {
  const cartCounts = document.querySelectorAll('.cart-count');
  const count = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCounts.forEach(el => {
    el.textContent = count;
  });
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

// ---- Modal Logic ----
function showAddModal(productId) {
  const product = globalProducts.find(p => p.id === productId);
  if (!product) return;
  currentModalProductId = productId;
  currentModalQty = 1;
  document.getElementById('modalImg').src = product.image;
  document.getElementById('modalTitle').textContent = currentLang === 'zh' && product.name_zh ? product.name_zh : product.name;
  document.getElementById('modalPrice').textContent = '$' + product.price.toFixed(2);
  document.getElementById('modalQtyDisplay').textContent = 1;
  document.getElementById('addCartModal').style.display = 'flex';
}

function closeAddModal() {
  document.getElementById('addCartModal').style.display = 'none';
}

function setupModalEvents() {
  const modal = document.getElementById('addCartModal');
  if(!modal) return;
  document.getElementById('closeModalBtn').addEventListener('click', closeAddModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeAddModal);
  
  document.getElementById('modalReduceBtn').addEventListener('click', () => {
     if(currentModalQty > 1) {
       currentModalQty--;
       document.getElementById('modalQtyDisplay').textContent = currentModalQty;
     }
  });
  document.getElementById('modalAddBtn').addEventListener('click', () => {
     currentModalQty++;
     document.getElementById('modalQtyDisplay').textContent = currentModalQty;
  });
  
  document.getElementById('modalConfirmBtn').addEventListener('click', () => {
      const product = globalProducts.find(p => p.id === currentModalProductId);
      if(product) {
         const currentItem = cart.find(item => item.id === currentModalProductId);
         if (currentItem) {
            currentItem.quantity += currentModalQty;
         } else {
            cart.push({ ...product, quantity: currentModalQty });
         }
         saveCart();
      }
      closeAddModal();
  });
}

function updateQuantity(productId, newQty) {
  if (newQty < 1) return;
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.quantity = newQty;
    saveCart();
    if (typeof renderCart === 'function') renderCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  if (typeof renderCart === 'function') renderCart();
}

// ---- Tabs & Product Grid ----
function setupTabsEvents() {
  const tabs = document.querySelectorAll('.tab-btn');
  if(!tabs.length) return;
  tabs.forEach(tab => {
     tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-filter');
        renderProductsGrid();
     });
  });
}

function renderProductsGrid() {
  const productsGrid = document.querySelector('.products-grid');
  if (productsGrid && globalProducts.length > 0) {
    let filtered = globalProducts;
    if (currentCategory !== 'all') {
      filtered = globalProducts.filter(p => p.category === currentCategory);
    }
    
    productsGrid.innerHTML = filtered.map(product => `
      <div class="product-card">
        <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;">
          <div class="img-wrapper">
            <img src="${product.image}" loading="lazy" alt="${product.name}" class="product-image">
          </div>
        </a>
        <div class="product-info">
          <div class="product-category">${currentLang === 'zh' && product.category_zh ? product.category_zh : product.category}</div>
          <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;">
            <h3 class="product-title">${currentLang === 'zh' && product.name_zh ? product.name_zh : product.name}</h3>
          </a>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <button class="btn" style="width:100%" onclick="showAddModal('${product.id}')" data-i18n="btn_add_to_cart">${translations[currentLang].btn_add_to_cart}</button>
        </div>
      </div>
    `).join('');
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  setupModalEvents();
  setupTabsEvents();

  // Dynamically inject mobile navigation toggle & overlay
  const header = document.querySelector('header');
  if (header) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'menu-toggle';
    toggleBtn.id = 'menuToggle';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation');
    toggleBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" class="line-1"></line>
        <line x1="3" y1="6" x2="21" y2="6" class="line-2"></line>
        <line x1="3" y1="18" x2="21" y2="18" class="line-3"></line>
      </svg>
    `;
    header.appendChild(toggleBtn);

    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    overlay.id = 'navOverlay';
    document.body.appendChild(overlay);

    const navLinks = header.querySelector('.nav-links');

    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      overlay.classList.toggle('active');
      toggleBtn.classList.toggle('open');
    });

    overlay.addEventListener('click', () => {
      navLinks.classList.remove('active');
      overlay.classList.remove('active');
      toggleBtn.classList.remove('open');
    });
  }
  
  // If we're on the homepage, render products by fetching from Backend
  const productsGrid = document.querySelector('.products-grid');
  if (productsGrid) {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch');
      globalProducts = await response.json();
      renderProductsGrid();
    } catch(err) {
      console.error(err);
      productsGrid.innerHTML = '<p style="color:var(--text-light);text-align:center;grid-column:1/-1;" data-i18n="error_loading">Error loading products.</p>';
    }
  }

  // Setup Shop Share Poster Modal Actions
  const shareShopBtn = document.getElementById('shareShopBtn');
  const closeShopShareBtn = document.getElementById('closeShopShareModalBtn');
  const shareShopModal = document.getElementById('shareShopModal');
  const shareShopQrContainer = document.querySelector('#shareShopModal .share-qr-wrap');

  // Native Share Check for Shop
  const nativeShareShopWrap = document.getElementById('nativeShareShopWrap');
  const nativeShareShopBtn = document.getElementById('nativeShareShopBtn');
  if (nativeShareShopWrap && nativeShareShopBtn) {
    nativeShareShopWrap.style.display = 'block'; // 永远可见
    nativeShareShopBtn.addEventListener('click', async () => {
      try {
        if (navigator.share) {
          // 移除 text 属性，避免微信 Share Extension 解析多重参数时发生中断/崩溃
          await navigator.share({
            title: '🌿 Aussie Naturals',
            url: window.location.href
          });
        } else {
          // PC 端 / HTTP 环境 / 微信内置浏览器 降级方案
          throw new Error('Web Share API not supported in this context.');
        }
      } catch (err) {
        // Fallback multi-layer copy mechanism
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(window.location.href);
          } else {
            // Legacy classic execCommand fallback for HTTP environments
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(input);
          }
          const originalHTML = nativeShareShopBtn.innerHTML;
          nativeShareShopBtn.innerHTML = '<span>✅ 链接已复制，快去发送吧！</span>';
          setTimeout(() => { nativeShareShopBtn.innerHTML = originalHTML; }, 2500);
        } catch(fallbackErr) {
          alert('当前浏览器环境受限，请点击右上角 [...] 进行分享');
        }
      }
    });
  }

  if (shareShopBtn && shareShopModal) {
    shareShopBtn.addEventListener('click', () => {
      if (shareShopQrContainer) {
        shareShopQrContainer.innerHTML = '';
        new QRCode(shareShopQrContainer, {
          text: window.location.href,
          width: 150,
          height: 150
        });
      }
      shareShopModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  const closeShopShareAction = () => {
    if (shareShopModal) {
      shareShopModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  if (closeShopShareBtn) {
    closeShopShareBtn.addEventListener('click', closeShopShareAction);
  }

  if (shareShopModal) {
    shareShopModal.addEventListener('click', (e) => {
      if (e.target === shareShopModal) {
        closeShopShareAction();
      }
    });
  }
});
