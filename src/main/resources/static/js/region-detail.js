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

// 로그인 상태 확인 (서버 값 우선, 보조로 localStorage 토큰/플래그 체크)
function isLoggedIn() {
  if (typeof window.__LOGGED_IN__ === 'boolean') return window.__LOGGED_IN__;
  const lsFlag = localStorage.getItem('isLoggedIn');
  const token = localStorage.getItem('authToken');
  return (lsFlag === 'true') || !!token;
}

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
  if (!productId) {
    showMessage('상품 정보를 찾을 수 없습니다.', 'error');
    return;
  }

  // 서버에서 렌더된 DOM을 읽어서 객체화
  currentProduct = getProductFromServer();
  if (!currentProduct) {
    showMessage('상품을 찾을 수 없습니다.', 'error');
    return;
  }

  renderProductDetail();
  loadRelatedProducts();

  // (정의되어 있지 않은 경우 에러 방지)
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

// 더미 회사 정보
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

  // 상품 상세 정보 (서버값 우선)
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
  if (!currentProduct.images || currentProduct.images.length === 0) {
    document.getElementById('mainImage').src = 'https://via.placeholder.com/400x400/cccccc/666666?text=이미지+없음';
    return;
  }

  const mainImage = document.getElementById('mainImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');

  // 메인 이미지 설정
  mainImage.src = currentProduct.images[0].src;
  mainImage.alt = currentProduct.images[0].alt;

  // 썸네일 생성
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

  // 이미지가 1개뿐이면 네비게이션 버튼 숨기기
  if (currentProduct.images.length <= 1) {
    document.getElementById('prevBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
  }
}

// 메인 이미지 업데이트
function updateMainImage() {
  if (!currentProduct.images || currentProduct.images.length === 0) return;

  const mainImage = document.getElementById('mainImage');
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

// 관련 상품 로드
function loadRelatedProducts() {
  // 실제로는 API 호출하지만, 여기서는 더미 데이터 사용
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

  // 리뷰 데이터 로드
  loadReviews();

  // 리뷰보기 버튼 이벤트 리스너
  setupReviewButton();
}

// 리뷰보기 버튼 설정
function setupReviewButton() {
  const viewAllReviewsBtn = document.getElementById('viewAllReviewsBtn');
  if (viewAllReviewsBtn) {
    viewAllReviewsBtn.addEventListener('click', function () {
      // 현재 상품 ID를 localStorage에 저장
      const productId = getProductIdFromUrl();
      localStorage.setItem('currentProductId', productId);

      // reviewlist 페이지로 이동
      window.location.href = '/reviewlist';
    });
  }
}

// 리뷰 데이터 로드
function loadReviews() {
  // 더미 리뷰 데이터
  const allReviews = [
    { id: 1, reviewerName: '김사과', rating: 5, date: '2025-09-05', text: '정말 맛있는 사과였어요! 아삭하고 달콤해요.' },
    { id: 2, reviewerName: '이과일', rating: 4, date: '2025-09-03', text: '품질이 좋네요. 배송도 빨라요.' },
    { id: 3, reviewerName: '박농부', rating: 5, date: '2025-09-01', text: '아삭달콤 최고!' },
    { id: 4, reviewerName: '최고객', rating: 4, date: '2025-08-28', text: '신선하고 맛있어요.' }
  ];

  // 최신 3개 리뷰만 표시
  const recentReviews = allReviews.slice(0, 3);
  renderReviews(recentReviews);

  // 전체 리뷰 데이터를 localStorage에 저장
  localStorage.setItem('allReviews', JSON.stringify(allReviews));

  // ✅ 미니 요약(평균/개수/별) 갱신
  updateReviewSummaryMini(allReviews);
}

// 리뷰 렌더링
function renderReviews(reviews) {
  const reviewList = document.getElementById('reviewList');
  reviewList.innerHTML = '';

  reviews.forEach(review => {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';

    // 별점 생성
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
  // 이미지 네비게이션
  document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentProduct.images && currentProduct.images.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });

  document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentProduct.images && currentProduct.images.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });

  // 수량 조절
  document.getElementById('decreaseBtn').addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      document.getElementById('quantity').value = quantity;
      updateTotalPrice();
    }
  });

  document.getElementById('increaseBtn').addEventListener('click', () => {
    quantity++;
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();
  });

  document.getElementById('quantity').addEventListener('input', (e) => {
    quantity = Math.max(1, parseInt(e.target.value) || 1);
    e.target.value = quantity;
    updateTotalPrice();
  });

  // 가격 옵션 선택
  document.getElementById('priceOptionSelect').addEventListener('change', (e) => {
    const optionIndex = parseInt(e.target.value);
    if (optionIndex >= 0 && optionIndex < currentProduct.priceOptions.length) {
      selectedPriceOption = currentProduct.priceOptions[optionIndex];
      updateTotalPrice();
    } else {
      selectedPriceOption = null;
      updateTotalPrice();
    }
  });

  // 장바구니 담기 (로그인 체크 + 이동)
  document.getElementById('addToCartBtn').addEventListener('click', (event) => addToCart(event));

  // 바로 구매
  document.getElementById('buyNowBtn').addEventListener('click', (event) => buyNow(event));

  // 뒤로가기 버튼
  document.getElementById('backBtn').addEventListener('click', goBackToList);
}

// 총 가격 업데이트
function updateTotalPrice() {
  const totalAmountElement = document.getElementById('totalAmount');

  if (selectedPriceOption) {
    const totalPrice = selectedPriceOption.price * quantity;
    totalAmountElement.textContent = `${totalPrice.toLocaleString()}원`;
  } else {
    totalAmountElement.textContent = '0원';
  }
}

// 장바구니 담기 (+ 로그인 필요 / 이동)
function addToCart(event) {
  if (!selectedPriceOption) {
    showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
    return;
  }

  // 로그인 체크
  if (!isLoggedIn()) {
    // 로그인 화면으로 이동 (로그인 후 장바구니로 돌아오도록 리다이렉트 파라미터 포함)
    const redirectUrl = encodeURIComponent('/cart');
    window.location.href = `/login?redirect=${redirectUrl}`;
    return;
  }

  // 장바구니 데이터 가져오기
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');

  // 기존 상품이 있는지 확인
  const optionIndex = currentProduct.priceOptions.indexOf(selectedPriceOption);
  const existingItemIndex = cart.findIndex(item =>
    item.productId === currentProduct.id &&
    item.priceOptionIndex === optionIndex
  );

  if (existingItemIndex >= 0) {
    // 기존 상품 수량 증가
    cart[existingItemIndex].quantity += quantity;
  } else {
    // 새 상품 추가
    cart.push({
      productId: currentProduct.id,
      productName: currentProduct.name,
      priceOptionIndex: optionIndex,
      priceOption: selectedPriceOption,
      quantity: quantity,
      image: (currentProduct.images && currentProduct.images[0] && currentProduct.images[0].src) || ''
    });
  }

  // 장바구니 저장
  localStorage.setItem('cart', JSON.stringify(cart));

  // 장바구니 페이지로 즉시 이동
  window.location.href = '/cart';
}

// 바로 구매 (로그인 체크: 401 → 로그인으로, 200 → 구매 페이지로)
function buyNow(event) {
    try {
        if (!selectedPriceOption) {
            showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event?.target || null);
            return;
        }
        const qty = Math.max(1, Number(document.getElementById('quantity')?.value || quantity || 1));

        fetch('/orders/buy-now', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                productId: currentProduct?.id,
                optionId: (() => {
                    // 지금은 임시로 index 전송 (다음 단계에서 실제 옵션ID 매핑)
                    const idx = currentProduct?.priceOptions?.indexOf(selectedPriceOption);
                    return (idx >= 0) ? idx : null;
                })(),
                quantity: qty
            })
        }).then(async (res) => {
            if (res.status === 401) {
                try {
                    const j = await res.json();
                    const url = j?.redirectUrl || '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
                    location.href = url;
                } catch (e) {
                    location.href = '/login?redirect=' + encodeURIComponent(location.pathname + location.search);
                }
                return;
            }
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(text || '구매 요청에 실패했습니다.');
            }
            return res.json();
        }).then((json) => {
            if (!json) return;
            const url = json.redirectUrl || ('/buying?orderId=' + (json.orderId ?? ''));
            showMessageAtPosition('구매 페이지로 이동합니다...', 'success', event?.target || null);
            setTimeout(() => { location.href = url; }, 300);
        }).catch((err) => {
            console.error(err);
            showMessageAtPosition('구매 요청 중 오류가 발생했습니다.', 'error', event?.target || null);
        });
    } catch (e) {
        console.error(e);
        showMessageAtPosition('구매 요청 중 오류가 발생했습니다.', 'error', event?.target || null);
    }
}


// 메시지 표시 (기본 위치)
function showMessage(message, type) {
  showMessageAtPosition(message, type);
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
  // 별은 반올림해서 표시(예: 4.2 → 4개 꽉 찬 별)
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

// 특정 위치에 메시지 표시
function showMessageAtPosition(message, type, targetElement = null) {
  // 기존 메시지 제거
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // 새 메시지 생성
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;

  // 기본 스타일 설정
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

  // 애니메이션 CSS 추가
  if (!document.querySelector('#messageAnimation')) {
    const style = document.createElement('style');
    style.id = 'messageAnimation';
    style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .message { animation: slideIn 0.3s ease; }
        `;
    document.head.appendChild(style);
  }

  // 위치 설정
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    messageDiv.style.top = `${rect.bottom + 10}px`;
    messageDiv.style.left = `${rect.left}px`;
  } else {
    // 기본 위치 (우상단)
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
  }

  // DOM에 추가
  document.body.appendChild(messageDiv);

  // 3초 후 제거
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}
