let cart = JSON.parse(localStorage.getItem('cart')) || [];
let globalProducts = [];

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

function addToCart(productId) {
  const currentItem = cart.find(item => item.id === productId);
  if (currentItem) {
    currentItem.quantity += 1;
  } else {
    const product = globalProducts.find(p => p.id === productId);
    if(product) {
       cart.push({ ...product, quantity: 1 });
    }
  }
  saveCart();
  alert(currentLang === 'zh' ? '已加入购物车！' : 'Item added to cart!');
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

function renderProductsGrid() {
  const productsGrid = document.querySelector('.products-grid');
  if (productsGrid && globalProducts.length > 0) {
    productsGrid.innerHTML = globalProducts.map(product => `
      <div class="product-card">
        <div class="img-wrapper">
          <img src="${product.image}" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
          <div class="product-category">${currentLang === 'zh' && product.category_zh ? product.category_zh : product.category}</div>
          <h3 class="product-title">${currentLang === 'zh' && product.name_zh ? product.name_zh : product.name}</h3>
          <p class="product-price">$${product.price.toFixed(2)}</p>
          <button class="btn" style="width:100%" onclick="addToCart('${product.id}')" data-i18n="btn_add_to_cart">${translations[currentLang].btn_add_to_cart}</button>
        </div>
      </div>
    `).join('');
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', async () => {
  updateCartBadge();
  
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
