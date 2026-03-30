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
        <div class="img-wrapper">
          <img src="${product.image}" loading="lazy" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
          <div class="product-category">${currentLang === 'zh' && product.category_zh ? product.category_zh : product.category}</div>
          <h3 class="product-title">${currentLang === 'zh' && product.name_zh ? product.name_zh : product.name}</h3>
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
});
