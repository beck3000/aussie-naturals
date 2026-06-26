let currentProduct = null;
let detailQty = 1;

function updateDetailQtyDisplay() {
  const qtyDisplay = document.getElementById('detailQtyDisplay');
  if (qtyDisplay) {
    qtyDisplay.textContent = detailQty;
  }
}

function renderDetailData() {
  if (!currentProduct) return;

  const productImg = document.getElementById('product-img');
  const productCat = document.getElementById('product-cat');
  const productTitle = document.getElementById('product-title');
  const productPrice = document.getElementById('product-price');
  const productDesc = document.getElementById('product-desc');

  if (productImg) {
    productImg.src = currentProduct.image;
    productImg.alt = currentProduct.name;
  }

  if (productCat) {
    productCat.textContent = (currentLang === 'zh' && currentProduct.category_zh) ? currentProduct.category_zh : currentProduct.category;
  }
  if (productTitle) {
    productTitle.textContent = (currentLang === 'zh' && currentProduct.name_zh) ? currentProduct.name_zh : currentProduct.name;
  }
  if (productPrice) {
    productPrice.textContent = '$' + currentProduct.price.toFixed(2);
  }
  if (productDesc) {
    productDesc.textContent = (currentLang === 'zh' && currentProduct.description_zh) ? currentProduct.description_zh : currentProduct.description;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  const errorContainer = document.getElementById('error-container');
  const detailLayout = document.getElementById('product-detail-layout');

  if (!productId) {
    if (errorContainer) errorContainer.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) throw new Error('Product not found');
    currentProduct = await response.json();

    if (detailLayout) {
      detailLayout.style.display = 'grid';
    }
    renderDetailData();

    // Setup quantity selector actions
    const reduceBtn = document.getElementById('detailReduceBtn');
    const addBtn = document.getElementById('detailAddBtn');
    const addToCartBtn = document.getElementById('detailAddToCartBtn');

    if (reduceBtn) {
      reduceBtn.addEventListener('click', () => {
        if (detailQty > 1) {
          detailQty--;
          updateDetailQtyDisplay();
        }
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        detailQty++;
        updateDetailQtyDisplay();
      });
    }

    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        if (!currentProduct) return;
        
        // Find if item already in cart
        const currentItem = cart.find(item => item.id === currentProduct.id);
        if (currentItem) {
          currentItem.quantity += detailQty;
        } else {
          cart.push({ ...currentProduct, quantity: detailQty });
        }
        
        // Save using globally available saveCart from app.js
        saveCart();

        // Simple button feedback animation
        const btnText = addToCartBtn.querySelector('span');
        if (btnText) {
          btnText.removeAttribute('data-i18n'); // Remove i18n label temporarily to show success feedback
          btnText.textContent = currentLang === 'zh' ? '已成功加入！' : 'Added Successfully!';
          addToCartBtn.style.backgroundColor = '#1a3b33'; // darker primary-hover color
          
          setTimeout(() => {
            btnText.setAttribute('data-i18n', 'btn_add_to_cart_long');
            btnText.textContent = translations[currentLang].btn_add_to_cart_long;
            addToCartBtn.style.backgroundColor = '';
          }, 1500);
        }
      });
    }

    // Set up language switcher listener to re-render dynamic name/desc on switch
    const switcher = document.getElementById('langSwitcher');
    if (switcher) {
      switcher.addEventListener('change', () => {
        setTimeout(renderDetailData, 50); // allow i18n.js translations to process first
      });
    }

    // Set up Sharing Poster actions
    const shareBtn = document.getElementById('shareProductBtn');
    const closeShareBtn = document.getElementById('closeShareModalBtn');
    const shareModal = document.getElementById('sharePosterModal');

    if (shareBtn && shareModal) {
      // Native Share Check for Product
      const nativeShareProductWrap = document.getElementById('nativeShareProductWrap');
      const nativeShareProductBtn = document.getElementById('nativeShareProductBtn');
      if (nativeShareProductWrap && nativeShareProductBtn) {
        nativeShareProductWrap.style.display = 'block'; // 永远可见
        nativeShareProductBtn.addEventListener('click', async () => {
          if (!currentProduct) return;
          const pName = (currentLang === 'zh' && currentProduct.name_zh) ? currentProduct.name_zh : currentProduct.name;
          if (navigator.share) {
            try {
              // 移除 text 属性，防止微信 Share Extension 解析多重参数崩溃
              await navigator.share({
                title: `🌿 Aussie Naturals | ${pName}`,
                url: window.location.href
              });
            } catch (err) {
              // 彻底静默忽略：用户取消分享或接口风控熔断，绝不去触发剪贴板复制，防止失去 User Gesture 上下文导致二次崩溃弹窗
              console.log('Share aborted or failed', err);
            }
          } else {
            // PC 端 / HTTP 环境 / 微信内置浏览器 降级方案
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
              const originalHTML = nativeShareProductBtn.innerHTML;
              nativeShareProductBtn.innerHTML = '<span>✅ 链接已复制，快去发送吧！</span>';
              setTimeout(() => { nativeShareProductBtn.innerHTML = originalHTML; }, 2500);
            } catch(fallbackErr) {
              alert('当前浏览器环境受限，请点击右上角 [...] 进行分享');
            }
          }
        });
      }

      shareBtn.addEventListener('click', () => {
        if (!currentProduct) return;

        // Fill data into Share Card
        const shareImg = document.getElementById('share-card-img');
        const shareCat = document.getElementById('share-card-cat');
        const shareTitle = document.getElementById('share-card-title');
        const sharePrice = document.getElementById('share-card-price');
        const shareQrContainer = document.querySelector('#shareCardBody .share-qr-wrap');
        
        if (shareImg) shareImg.src = currentProduct.image;
        if (shareCat) shareCat.textContent = (currentLang === 'zh' && currentProduct.category_zh) ? currentProduct.category_zh : currentProduct.category;
        if (shareTitle) shareTitle.textContent = (currentLang === 'zh' && currentProduct.name_zh) ? currentProduct.name_zh : currentProduct.name;
        if (sharePrice) sharePrice.textContent = '$' + currentProduct.price.toFixed(2);
        
        // Generate QR code for the current product page dynamically
        if (shareQrContainer) {
          shareQrContainer.innerHTML = '';
          new QRCode(shareQrContainer, {
            text: window.location.href,
            width: 150,
            height: 150
          });
        }

        // Show Modal
        shareModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // prevent background scroll
      });
    }

    const closeShareAction = () => {
      if (shareModal) {
        shareModal.style.display = 'none';
        document.body.style.overflow = ''; // restore scroll
      }
    };

    if (closeShareBtn) {
      closeShareBtn.addEventListener('click', closeShareAction);
    }

    if (shareModal) {
      shareModal.addEventListener('click', (e) => {
        if (e.target === shareModal) {
          closeShareAction();
        }
      });
    }

  } catch (err) {
    console.error(err);
    if (detailLayout) detailLayout.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'block';
  }
});
