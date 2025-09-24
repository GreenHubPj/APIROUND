// ===================== 페이지 초기화 =====================
document.addEventListener('DOMContentLoaded', function () {
  initializeRegionDetail();

  // 서버가 옵션을 넣어줬는지 확인 → 옵션 없으면 버튼/셀렉트 비활성
  const optionsInSelect = document.querySelectorAll('#priceOptionSelect option[value]:not([value=""])').length;
  if (window.__NO_PRICE__ || optionsInSelect === 0) {
    document.getElementById('priceOptionSelect')?.setAttribute('disabled', true);
    document.getElementById('addToCartBtn')?.setAttribute('disabled', true);
    document.getElementById('buyNowBtn')?.setAttribute('disabled', true);
  }
});

// 전역 변수
let currentProduct = null;
let currentImageIndex = 0;
let selectedPriceOption = null;
let quantity = 1;

// 뒤로가기 버튼을 가장 먼저, 안전하게 바인딩
(function bindBackButton() {
  function init() {
    const btn = document.getElementById('backBtn');
    if (btn) {
      btn.type = 'button'; // 폼 안일 경우 대비
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        goBackToList();
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

function initializeRegionDetail() {
  loadProductDetail();
  setupEventListeners();
  console.log('상품 상세 페이지가 초기화되었습니다.');
}

// URL에서 상품 ID 가져오기
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// URL에서 지역 정보 가져오기
function getRegionFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('region');
}

// 목록으로 돌아가기
function goBackToList() {
  const region = getRegionFromUrl();
  if (region) {
    window.location.href = '/region';
  }
}

// 상품 상세 정보 로드
function loadProductDetail() {
  const productId = getProductIdFromUrl();


  // 서버에서 렌더된 DOM을 읽어서 객체화
  currentProduct = getProductFromServer();
  if (!currentProduct) {
    showMessage('상품을 찾을 수 없습니다.', 'error');
    return;
  }

  renderProductDetail();
  loadRelatedProducts();

  // ✅ 정의되지 않았을 때 에러 안 나도록 가드
  if (typeof loadReviewSummary === 'function') loadReviewSummary(productId);
  if (typeof loadRecentReviews === 'function') loadRecentReviews(productId);
}

// 서버에서 전달된 상품 데이터 가져오기
function getProductFromServer() {
  const productName = document.getElementById('productTitle')?.textContent || '';
  const productTags = document.querySelectorAll('.product-tag');
  const productType = productTags[0]?.textContent || '';
  const regionText = productTags[1]?.textContent || '';
  const description = document.getElementById('descriptionText')?.textContent || '';
  const imgEl = document.getElementById('productImg') || document.getElementById('mainImage');
  const thumbnailUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';
  const harvestSeason = document.getElementById('seasonInfo')?.textContent || '';
  const productId = parseInt(getProductIdFromUrl());

  // DOM의 가격 옵션을 dataset으로 파싱
  const priceOptions = Array.from(
    document.querySelectorAll('#priceOptions .price-option')
  ).map(el => ({
    quantity: Number(el.dataset.quantity),
    unit: el.dataset.unit,
    price: Number(el.dataset.price)
  }));

  const companyInfo = generateRandomCompany(regionText);

  return {
    id: productId,
    name: productName,
    category: productType,
    region: regionText,
    description,
    thumbnailUrl,
    harvestSeason,
    priceOptions,
    companyInfo,
    images: [{ id: 1, src: thumbnailUrl, alt: productName }]
  };
}

// 더미: 업체 랜덤 정보 (필요하면 실제 데이터로 교체)
function generateRandomCompany(regionText) {
  return {
    name: `${regionText || '지역'} 농가`,
    phone: '010-0000-0000',
    email: 'seller@example.com'
  };
}

// 상품 상세 정보 렌더링
function renderProductDetail() {
  if (!currentProduct) return;

  // 상품 제목
  document.getElementById('productTitle').textContent = currentProduct.name;

  // 상품 태그
  const tagsContainer = document.getElementById('productTags');
  tagsContainer.innerHTML = `
    <span class="product-tag">${currentProduct.category}</span>
    <span class="product-tag">${currentProduct.region}</span>
    ${currentProduct.origin ? `<span class="product-tag">${currentProduct.origin}</span>` : ''}
  `;

  // 가격 옵션
  renderPriceOptions();

  // 상품 상세 정보(서버 렌더 값이 있으면 그대로, 없으면 유지)
  const originEl = document.getElementById('originInfo');
  const seasonEl = document.getElementById('seasonInfo');
  originEl && (originEl.textContent = originEl.textContent || currentProduct.region || '-');
  seasonEl && (seasonEl.textContent = seasonEl.textContent || currentProduct.harvestSeason || '-');

  // 상품 설명
  const descEl = document.getElementById('descriptionText');
  if (descEl && !descEl.textContent.trim()) descEl.textContent = currentProduct.description || '';

  // 업체 정보 렌더링
  renderCompanyInfo();

  // 상품 이미지
  renderProductImages();
}

// 업체 정보 렌더링
function renderCompanyInfo() {
  if (!currentProduct.companyInfo) return;

  const companyInfo = currentProduct.companyInfo;

  const companyNameElement = document.getElementById('companyName');
  if (companyNameElement) companyNameElement.textContent = companyInfo.name;

  const companyPhoneElement = document.getElementById('companyPhone');
  if (companyPhoneElement) companyPhoneElement.textContent = companyInfo.phone;

  const companyEmailElement = document.getElementById('companyEmail');
  if (companyEmailElement) companyEmailElement.textContent = companyInfo.email;
}

// 가격 옵션 렌더링
function renderPriceOptions() {
  const priceOptionsContainer = document.getElementById('priceOptions');
  const priceSelect = document.getElementById('priceOptionSelect');

  if (!priceOptionsContainer || !priceSelect) return;

  priceOptionsContainer.innerHTML = '';
  priceSelect.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';

  (currentProduct.priceOptions || []).forEach((option, index) => {
    // 카드
    const optionElement = document.createElement('div');
    optionElement.className = 'price-option';
    optionElement.innerHTML = `
      <span class="price-option-info">${option.quantity}${option.unit}</span>
      <span class="price-option-amount">${option.price.toLocaleString()}원</span>
    `;
    priceOptionsContainer.appendChild(optionElement);

    // 셀렉트
    const optionSelect = document.createElement('option');
    optionSelect.value = index;
    optionSelect.textContent = `${option.quantity}${option.unit} - ${option.price.toLocaleString()}원`;
    priceSelect.appendChild(optionSelect);
  });
}

// 상품 이미지 렌더링
function renderProductImages() {
  const mainImage = document.getElementById('mainImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');

  if (!mainImage || !thumbnailContainer) return;

  if (!currentProduct.images || currentProduct.images.length === 0) {
    mainImage.src = 'https://via.placeholder.com/400x400/cccccc/666666?text=이미지+없음';
    return;
  }

  // 메인 이미지
  mainImage.src = currentProduct.images[0].src;
  mainImage.alt = currentProduct.images[0].alt;

  // 썸네일
  thumbnailContainer.innerHTML = '';
  currentProduct.images.forEach((image, index) => {
    const thumbnail = document.createElement('img');
    thumbnail.src = image.src;
    thumbnail.alt = image.alt;
    thumbnail.className = 'thumbnail';
    if (index === 0) thumbnail.classList.add('active');

    thumbnail.addEventListener('click', () => {
      currentImageIndex = index;
      updateMainImage();
      updateThumbnailActive();
    });

    thumbnailContainer.appendChild(thumbnail);
  });

  // 이미지 1개면 좌우 버튼 숨김
  if (currentProduct.images.length <= 1) {
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    prev && (prev.style.display = 'none');
    next && (next.style.display = 'none');
  }
}

// 메인 이미지 업데이트
function updateMainImage() {
  const mainImage = document.getElementById('mainImage');
  if (!mainImage || !currentProduct.images || currentProduct.images.length === 0) return;

  const currentImage = currentProduct.images[currentImageIndex];
  mainImage.src = currentImage.src;
  mainImage.alt = currentImage.alt;
}

// 썸네일 활성 상태 업데이트
function updateThumbnailActive() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentImageIndex);
  });
}

// 관련 상품 로드(데모)
function loadRelatedProducts() {
  const relatedProducts = [
    {
      id: 4,
      name: '제주 한라봉',
      category: '과일',
      region: '제주',
      priceOptions: [{ quantity: 2, unit: 'kg', price: 25000 }],
      images: [{ src: 'https://via.placeholder.com/250x150/ff8c42/ffffff?text=제주+한라봉', alt: '제주 한라봉' }]
    },
    {
      id: 5,
      name: '강원도 무',
      category: '채소',
      region: '강원',
      priceOptions: [{ quantity: 1, unit: '개', price: 5000 }],
      images: [{ src: 'https://via.placeholder.com/250x150/27ae60/ffffff?text=강원+무', alt: '강원도 무' }]
    },
    {
      id: 6,
      name: '경북 배',
      category: '과일',
      region: '경북',
      priceOptions: [{ quantity: 1, unit: 'kg', price: 15000 }],
      images: [{ src: 'https://via.placeholder.com/250x150/e74c3c/ffffff?text=경북+배', alt: '경북 배' }]
    }
  ];

  renderRelatedProducts(relatedProducts);

  // 리뷰 데이터 로드(로컬 데모)
  loadReviews();

  // 리뷰보기 버튼 이벤트 리스너
  setupReviewButton();
}

// 리뷰보기 버튼 설정
function setupReviewButton() {
  const viewAllReviewsBtn = document.getElementById('viewAllReviewsBtn');
  if (viewAllReviewsBtn) {
    viewAllReviewsBtn.addEventListener('click', function() {
      const productId = getProductIdFromUrl();
      localStorage.setItem('currentProductId', productId);
      window.location.href = '/reviewlist';
    });
  }
}

// 리뷰 데이터 로드(데모)
function loadReviews() {
  const allReviews = [
    { id: 1, reviewerName: '김사과', rating: 5, date: '2025-09-05', text: '정말 맛있는 사과였어요!' },
    { id: 2, reviewerName: '이과일', rating: 4, date: '2025-09-03', text: '품질이 좋네요.' },
    { id: 3, reviewerName: '박농부', rating: 5, date: '2025-09-01', text: '아삭하고 달콤합니다.' },
    { id: 4, reviewerName: '최고객', rating: 4, date: '2025-08-28', text: '신선하고 맛있어요.' }
  ];

  const recentReviews = allReviews.slice(0, 3);
  renderReviews(recentReviews);

  localStorage.setItem('allReviews', JSON.stringify(allReviews));
  updateReviewSummaryMini(allReviews);
}

// 리뷰 렌더링
function renderReviews(reviews) {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;

  reviewList.innerHTML = '';

  reviews.forEach(review => {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';

    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

    reviewItem.innerHTML = `
      <div class="review-header">
        <span class="reviewer-name">${review.reviewerName}</span>
        <span class="review-date">${review.date}</span>
      </div>
      <div class="review-rating">
        ${stars.split('').map(star => `<span class="star">${star}</span>`).join('')}
      </div>
      <div class="review-text">${review.text}</div>
    `;

    reviewList.appendChild(reviewItem);
  });
}

// 관련 상품 렌더링
function renderRelatedProducts(products) {
  const grid = document.getElementById('relatedProductsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'related-product-card';
    card.innerHTML = `
      <img src="${product.images[0].src}" alt="${product.images[0].alt}" class="related-product-image">
      <div class="related-product-info">
        <h3 class="related-product-title">${product.name}</h3>
        <div class="related-product-price">${product.priceOptions[0].quantity}${product.priceOptions[0].unit} ${product.priceOptions[0].price.toLocaleString()}원</div>
        <div class="related-product-tags">
          <span class="related-product-tag">${product.category}</span>
          <span class="related-product-tag">${product.region}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      window.location.href = `/region-detail?id=${product.id}&region=${product.region}`;
    });

    grid.appendChild(card);
  });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  const prev = document.getElementById('prevBtn');
  const next = document.getElementById('nextBtn');

  prev && prev.addEventListener('click', () => {
    if (currentProduct.images && currentProduct.images.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });

  next && next.addEventListener('click', () => {
    if (currentProduct.images && currentProduct.images.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });

  const dec = document.getElementById('decreaseBtn');
  const inc = document.getElementById('increaseBtn');
  const qtyInput = document.getElementById('quantity');

  dec && dec.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      qtyInput && (qtyInput.value = quantity);
      updateTotalPrice();
    }
  });

  inc && inc.addEventListener('click', () => {
    quantity++;
    qtyInput && (qtyInput.value = quantity);
    updateTotalPrice();
  });

  qtyInput && qtyInput.addEventListener('input', (e) => {
    quantity = Math.max(1, parseInt(e.target.value) || 1);
    e.target.value = quantity;
    updateTotalPrice();
  });

  const priceSelect = document.getElementById('priceOptionSelect');
  priceSelect && priceSelect.addEventListener('change', (e) => {
    const optionIndex = parseInt(e.target.value);
    if (currentProduct.priceOptions && optionIndex >= 0 && optionIndex < currentProduct.priceOptions.length) {
      selectedPriceOption = currentProduct.priceOptions[optionIndex];
      updateTotalPrice();
    } else {
      selectedPriceOption = null;
      updateTotalPrice();
    }
  });

  document.getElementById('addToCartBtn')?.addEventListener('click', (event) => addToCart(event));
  document.getElementById('buyNowBtn')?.addEventListener('click', (event) => buyNow(event));
  document.getElementById('backBtn')?.addEventListener('click', goBackToList);
}

// 총 가격 업데이트
function updateTotalPrice() {
  const totalAmountElement = document.getElementById('totalAmount');

  if (!totalAmountElement) return;

  if (selectedPriceOption) {
    const totalPrice = selectedPriceOption.price * quantity;
    totalAmountElement.textContent = `${totalPrice.toLocaleString()}원`;
  } else {
    totalAmountElement.textContent = '0원';
  }
}

// 장바구니 담기
function addToCart(event) {
  if (!selectedPriceOption) {
    showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  const existingItemIndex = cart.findIndex(item =>
    item.productId === currentProduct.id &&
    item.priceOptionIndex === currentProduct.priceOptions.indexOf(selectedPriceOption)
  );

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].quantity += quantity;
  } else {
    cart.push({
      productId: currentProduct.id,
      productName: currentProduct.name,
      priceOptionIndex: currentProduct.priceOptions.indexOf(selectedPriceOption),
      priceOption: selectedPriceOption,
      quantity: quantity,
      image: (currentProduct.images && currentProduct.images[0] && currentProduct.images[0].src) || ''
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showMessageAtPosition('장바구니에 상품이 추가되었습니다.', 'success', event.target);
}

// 바로 구매
function buyNow(event) {
  if (!selectedPriceOption) {
    showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
    return;
  }

  const unitText = `${selectedPriceOption.quantity}${selectedPriceOption.unit}`;
  const unitPrice = Number(selectedPriceOption.price) || 0;
  const qty = Number(quantity) || 1;
  const totalProductPrice = unitPrice * qty;

  // 주문 데이터(표시용 + 계산용 모두 포함)
  const orderItem = {
    id: currentProduct.id,
    name: currentProduct.name,
    category: currentProduct.category || '',
    region: currentProduct.region || '',
    image: (currentProduct.images && currentProduct.images[0] && currentProduct.images[0].src) || '',
    // 옵션 및 수량
    optionText: unitText,
    quantityCount: qty,
    // 가격(계산용/표시용)
    priceRaw: totalProductPrice,
    priceFormatted: `${totalProductPrice.toLocaleString()}원`,
    // 구버전 호환 필드(있으면 buying.js가 알아서 처리)
    quantity: unitText,
    price: `${unitPrice.toLocaleString()}원`,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('currentOrder', JSON.stringify([orderItem]));

  showMessageAtPosition('구매 페이지로 이동합니다...', 'success', event.target);
  setTimeout(() => {
    window.location.href = '/buying';
  }, 600);
}

// ===== 리뷰 요약 미니 위젯 갱신 =====
function updateReviewSummaryMini(reviews) {
  const avgEl = document.getElementById('avgRatingMini');
  const starsEl = document.getElementById('avgStarsMini');
  const countEl = document.getElementById('totalReviewCountMini');
  if (!avgEl || !starsEl || !countEl) return;

  const count = Array.isArray(reviews) ? reviews.length : 0;
  if (count === 0) {
    avgEl.textContent = '0.0';
    countEl.textContent = '0';
    starsEl.innerHTML = createStarsHtml(0);
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = sum / count;
  avgEl.textContent = avg.toFixed(1);
  countEl.textContent = String(count);
  starsEl.innerHTML = createStarsHtml(Math.round(avg));
}

function createStarsHtml(filled) {
  const total = 5;
  let html = '';
  for (let i = 0; i < total; i++) {
    html += `<span class="star">${i < filled ? '★' : '☆'}</span>`;
  }
  return html;
}

// 메시지 표시 (기본 위치)
function showMessage(message, type) {
  showMessageAtPosition(message, type);
}

// 특정 위치에 메시지 표시
function showMessageAtPosition(message, type, targetElement = null) {
  const existingMessage = document.querySelector('.message');
  if (existingMessage) existingMessage.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;

  messageDiv.style.cssText = `
    position: fixed;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    word-wrap: break-word;
    ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
  `;

  if (!document.querySelector('#messageAnimation')) {
    const style = document.createElement('style');
    style.id = 'messageAnimation';
    style.textContent = `
      @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      .message { animation: slideIn 0.3s ease; }
    `;
    document.head.appendChild(style);
  }

  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    messageDiv.style.top = `${rect.bottom + 10}px`;
    messageDiv.style.left = `${rect.left}px`;
  } else {
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
  }

  document.body.appendChild(messageDiv);
  setTimeout(() => { messageDiv.remove(); }, 3000);
}
