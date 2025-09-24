// ===================== 페이지 초기화 =====================
document.addEventListener('DOMContentLoaded', function () {
  initializeRegionDetail();

  // 서버가 옵션을 넣어줬는지 확인 → 옵션 없으면 버튼/셀렉트 비활성
  const optionsInSelect = document.querySelectorAll('#priceOptionSelect option[value]:not([value=""])').length;
  console.log('=== 초기화 시점 옵션 확인 ===');
  console.log('window.__NO_PRICE__:', window.__NO_PRICE__);
  console.log('optionsInSelect 개수:', optionsInSelect);
  console.log('priceOptionSelect disabled 상태:', document.getElementById('priceOptionSelect')?.disabled);
  console.log('priceOptionSelect HTML:', document.getElementById('priceOptionSelect')?.outerHTML);
  
  if (window.__NO_PRICE__ || optionsInSelect === 0) {
    console.log('옵션이 없어서 버튼들 비활성화');
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

  // ✅ 정의되지 않았을 때 에러 안 나도록 가드
  if (typeof loadReviewSummary === 'function') loadReviewSummary(productId);
  if (typeof loadRecentReviews === 'function') loadRecentReviews(productId);
}

// 서버에서 전달된 상품 데이터 가져오기
function getProductFromServer() {
  // 서버에서 전달된 데이터가 있으면 우선 사용
  if (window.serverData && window.serverData.product) {
    const serverProduct = window.serverData.product;
    const serverPriceOptions = window.serverData.priceOptions || [];
    
    return {
      id: serverProduct.productId,
      name: serverProduct.productName,
      category: serverProduct.productType,
      region: serverProduct.regionText,
      description: serverProduct.description,
      thumbnailUrl: serverProduct.thumbnailUrl,
      harvestSeason: serverProduct.harvestSeason,
      priceOptions: serverPriceOptions.map(opt => ({
        id: opt.optionId,
        quantity: opt.quantity,
        unit: opt.unit,
        price: opt.price
      })),
      companyInfo: window.serverData.companyInfo || {
        name: serverProduct.companyName || `${serverProduct.regionText || '지역'} 농가`,
        phone: serverProduct.companyPhone || '010-0000-0000',
        email: serverProduct.companyEmail || 'seller@example.com'
      },
      images: [{ id: 1, src: serverProduct.thumbnailUrl, alt: serverProduct.productName }]
    };
  }

  // 서버 데이터가 없으면 DOM에서 파싱
  const productName = document.getElementById('productTitle')?.textContent || '';
  const productTags = document.querySelectorAll('.product-tag');
  const productType = productTags[0]?.textContent || '';
  const regionText = productTags[1]?.textContent || '';
  const description = document.getElementById('descriptionText')?.textContent || '';
  const imgEl = document.getElementById('productImg') || document.getElementById('mainImage');
  const thumbnailUrl = imgEl ? (imgEl.getAttribute('src') || '') : '';
  const harvestSeason = document.getElementById('seasonInfo')?.textContent || '';
  const productId = parseInt(getProductIdFromUrl());

  // 서버에서 전달된 옵션 데이터 확인
  console.log('=== 서버 옵션 데이터 확인 ===');
  console.log('priceOptions div 존재:', document.getElementById('priceOptions'));
  console.log('priceOptionSelect 존재:', document.getElementById('priceOptionSelect'));
  console.log('priceOptions div 내용:', document.getElementById('priceOptions')?.innerHTML);
  
  // 실제 데이터베이스에서 옵션 ID를 가져오기 위해 DOM에서 파싱
  const priceOptions = Array.from(
    document.querySelectorAll('#priceOptions .price-option')
  ).map(el => ({
    id: Number(el.dataset.optionId) || Number(el.dataset.id),
    quantity: Number(el.dataset.quantity),
    unit: el.dataset.unit,
    price: Number(el.dataset.price)
  }));
  
  console.log('파싱된 priceOptions:', priceOptions);
  console.log('priceOptions 길이:', priceOptions.length);

  // DOM에서 업체 정보 가져오기
  const companyInfo = {
    name: document.getElementById('companyName')?.textContent || `${regionText || '지역'} 농가`,
    phone: document.getElementById('companyPhone')?.textContent || '010-0000-0000',
    email: document.getElementById('companyEmail')?.textContent || 'seller@example.com'
  };

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

// generateRandomCompany 함수는 더 이상 사용하지 않음 - 실제 업체 정보 사용

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
  console.log('=== 업체 정보 렌더링 시작 ===');
  console.log('currentProduct:', currentProduct);
  console.log('currentProduct.companyInfo:', currentProduct?.companyInfo);
  
  if (!currentProduct.companyInfo) {
    console.log('업체 정보가 없어서 기본값으로 설정');
    // 기본값으로 설정
    const companyNameElement = document.getElementById('companyName');
    if (companyNameElement) companyNameElement.textContent = '문경농협';

    const companyPhoneElement = document.getElementById('companyPhone');
    if (companyPhoneElement) companyPhoneElement.textContent = '054-555-1234';

    const companyEmailElement = document.getElementById('companyEmail');
    if (companyEmailElement) companyEmailElement.textContent = 'mungyeong@coop.co.kr';
    return;
  }

  const companyInfo = currentProduct.companyInfo;
  console.log('렌더링할 업체 정보:', companyInfo);

  const companyNameElement = document.getElementById('companyName');
  if (companyNameElement) {
    companyNameElement.textContent = companyInfo.name;
    console.log('업체명 설정:', companyInfo.name);
  }

  const companyPhoneElement = document.getElementById('companyPhone');
  if (companyPhoneElement) {
    companyPhoneElement.textContent = companyInfo.phone;
    console.log('업체 전화번호 설정:', companyInfo.phone);
  }

  const companyEmailElement = document.getElementById('companyEmail');
  if (companyEmailElement) {
    companyEmailElement.textContent = companyInfo.email;
    console.log('업체 이메일 설정:', companyInfo.email);
  }
  
  console.log('=== 업체 정보 렌더링 완료 ===');
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
    optionElement.dataset.optionId = option.id; // option_id를 dataset에 저장
    
    optionElement.innerHTML = `
      <span class="price-option-info">${option.quantity}${option.unit}</span>
      <span class="price-option-amount">${option.price.toLocaleString()}원</span>
    `;
    
    // 카드 클릭 이벤트 추가
    optionElement.addEventListener('click', () => {
      // 다른 카드들의 active 클래스 제거
      document.querySelectorAll('.price-option').forEach(el => el.classList.remove('active'));
      // 현재 카드에 active 클래스 추가
      optionElement.classList.add('active');
      // selectedPriceOption 설정
      selectedPriceOption = option;
      // 셀렉트 박스도 동기화
      priceSelect.value = option.id;
      updateTotalPrice();
    });

    //옵션이 1개면 자동선택 처리
    if ((currentProduct.priceOptions || []).length === 1) {
    const onlyOption = currentProduct.priceOptions[0];
    selectedPriceOption = onlyOption;
    // 카드와 select도 동기화
    const card = document. querySelector (`[data-option-id="${onlyOption.id}"]`);
    if (card) card.classList.add('active');
    const priceSelect = document.getElementById('priceOptionSelect');
    if (priceSelect) priceSelect.value = onlyOption.id;
    updateTotalPrice();
    }

    priceOptionsContainer.appendChild(optionElement);

    // 셀렉트
    const optionSelect = document.createElement('option');
    optionSelect.value = option.id; // 실제 option_id 사용
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

// 관련 상품 로드 (API를 통해 동적으로 로드)
async function loadRelatedProducts() {
  const productId = getProductIdFromUrl();
  const region = getRegionFromUrl();
  
  console.log('=== 관련 상품 로드 시작 ===');
  console.log('productId:', productId);
  console.log('region:', region);
  console.log('currentProduct:', currentProduct);
  
  if (!productId) {
    console.log('상품 ID가 없어서 관련 상품을 로드할 수 없습니다.');
    return;
  }

  try {
    const apiUrl = `/api/related-products?productId=${productId}${region ? `&region=${encodeURIComponent(region)}` : ''}`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);
    console.log('API 응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 오류 응답:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const relatedProducts = await response.json();
    console.log('API에서 받은 관련 상품 데이터:', relatedProducts);
    console.log('관련 상품 개수:', relatedProducts ? relatedProducts.length : 0);
    
    renderRelatedProductsFromAPI(relatedProducts);
    
  } catch (error) {
    console.error('관련 상품 로드 실패:', error);
    
    if (window.serverData && window.serverData.relatedProducts) {
      console.log('API 실패로 인해 서버 렌더링 데이터 사용');
      console.log('서버 데이터:', window.serverData.relatedProducts);
      setupRelatedProductClickEvents();
    } else {
      console.log('관련 상품을 찾을 수 없습니다.');
    }
  }

  // 리뷰 데이터 로드(로컬 데모)
  loadReviews();

  // 리뷰보기 버튼 이벤트 리스너
  setupReviewButton();
}

// API에서 받은 데이터로 관련 상품 렌더링
function renderRelatedProductsFromAPI(products) {
  const grid = document.getElementById('relatedProductsGrid');
  if (!grid) {
    console.log('관련 상품 그리드를 찾을 수 없습니다.');
    return;
  }

  // 기존 서버 렌더링된 HTML 제거하고 새로운 HTML 생성
  grid.innerHTML = '';

  if (!products || products.length === 0) {
    console.log('관련 상품이 없습니다.');
    // 관련 상품이 없을 때 메시지 표시
    const noProductsSection = document.querySelector('.related-products-section');
    if (noProductsSection) {
      const existingNoRelated = noProductsSection.querySelector('.no-related');
      if (existingNoRelated) {
        existingNoRelated.style.display = 'block';
      }
    }
    return;
  }

  // 관련 상품이 없을 때 메시지 숨기기
  const noProductsSection = document.querySelector('.related-products-section');
  if (noProductsSection) {
    const existingNoRelated = noProductsSection.querySelector('.no-related');
    if (existingNoRelated) {
      existingNoRelated.style.display = 'none';
    }
  }

  // 현재 지역 정보 가져오기
  const currentRegion = getRegionFromUrl() || currentProduct?.region;

  // 실제 상품 카드 렌더링
  products.forEach(product => {
    const card = document.createElement('a');
    card.className = 'related-card';
    card.href = `/region-detail?id=${product.productId}&region=${encodeURIComponent(currentRegion || product.regionText)}`;
    
    // 이미지 URL 처리
    let imageUrl = product.thumbnailUrl;
    if (!imageUrl || imageUrl === 'null' || imageUrl === '#') {
      imageUrl = '/images/따봉 트럭.png'; // 기본 이미지
    } else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
      imageUrl = '/' + imageUrl;
    }

    // 가격 정보 표시 (minPrice가 있으면 표시, 없으면 업체 문의)
    const priceInfo = product.minPrice ? `${product.minPrice.toLocaleString()}원~` : '업체 문의';

    card.innerHTML = `
      <div class="related-thumb">
        <img src="${imageUrl}" 
             alt="${product.productName}" 
             onerror="this.onerror=null;this.src='/images/따봉 트럭.png'"
             style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div class="related-info">
        <div class="related-name">${product.productName}</div>
        <div class="related-price">${priceInfo}</div>
        <div class="related-meta">
          <span>${product.regionText}</span>
          <span>${product.productType}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // 4개 미만일 때 빈 카드 추가하여 레이아웃 유지
  const maxCards = 4;
  const remainingSlots = maxCards - products.length;
  
  for (let i = 0; i < remainingSlots; i++) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'related-card empty-card';
    emptyCard.innerHTML = `
      <div class="related-thumb empty-thumb">
        <div class="empty-placeholder">
          <span>상품 준비중</span>
        </div>
      </div>
      <div class="related-info empty-info">
        <div class="related-name">준비중인 상품</div>
        <div class="related-price">곧 출시</div>
        <div class="related-meta">
          <span>준비중</span>
          <span>준비중</span>
        </div>
      </div>
    `;
    grid.appendChild(emptyCard);
  }

  console.log(`${products.length}개의 관련 상품이 렌더링되었습니다. (빈 슬롯 ${remainingSlots}개 추가)`);
}

// 관련 상품 클릭 이벤트 설정
function setupRelatedProductClickEvents() {
  const relatedCards = document.querySelectorAll('.related-card');
  relatedCards.forEach(card => {
    // 이미 HTML에서 href로 링크가 설정되어 있으므로 추가 이벤트는 필요 없음
    // 필요시 여기서 추가 로직 구현 가능
    console.log('관련 상품 카드 설정됨:', card);
  });
}

// 리뷰보기 버튼 설정
function setupReviewButton() {
  const viewAllReviewsBtn = document.getElementById('viewAllReviewsBtn');
  if (viewAllReviewsBtn) {
    viewAllReviewsBtn.addEventListener('click', function() {
      const productId = getProductIdFromUrl();
      if (productId) {
        window.location.href = `/reviews/list?productId=${productId}`;
      }
    });
  }
}


// 모든 리뷰 로드 (리뷰보기 버튼 클릭 시)
async function loadAllReviews() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    console.log('상품 ID가 없어서 리뷰를 로드할 수 없습니다.');
    return;
  }

  try {
    // 모든 리뷰 가져오기 (페이지네이션 없이)
    const reviewsResponse = await fetch(`/api/products/${productId}/reviews?page=0&size=100&sort=createdAt,desc`);
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      const reviews = reviewsData.content || [];
      
      if (reviews.length === 0) {
        renderEmptyReviews();
      } else {
        renderReviews(reviews);
        // 버튼 텍스트 변경
        const viewAllBtn = document.getElementById('viewAllReviewsBtn');
        if (viewAllBtn) {
          viewAllBtn.textContent = '리뷰 접기';
          viewAllBtn.onclick = function() {
            loadReviews(); // 다시 3개만 로드
            viewAllBtn.textContent = '리뷰보기';
            viewAllBtn.onclick = loadAllReviews;
          };
        }
      }
    } else {
      console.error('리뷰 로드 실패:', reviewsResponse.status);
      renderEmptyReviews();
    }
  } catch (error) {
    console.error('리뷰 로드 중 오류:', error);
    renderEmptyReviews();
  }
}

// 리뷰 데이터 로드(최근 3개)
async function loadReviews() {
  const productId = getProductIdFromUrl();
  if (!productId) {
    console.log('상품 ID가 없어서 리뷰를 로드할 수 없습니다.');
    return;
  }

  try {
    // 리뷰 요약 정보 가져오기
    const summaryResponse = await fetch(`/api/products/${productId}/reviews/summary`);
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      updateReviewSummaryMini(summary);
    }

    // 최근 리뷰 3개 가져오기
    const reviewsResponse = await fetch(`/api/products/${productId}/reviews?page=0&size=3&sort=createdAt,desc`);
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      const reviews = reviewsData.content || [];
      
      if (reviews.length === 0) {
        renderEmptyReviews();
      } else {
        renderReviews(reviews);
      }
    } else {
      console.error('리뷰 로드 실패:', reviewsResponse.status);
      renderEmptyReviews();
    }
  } catch (error) {
    console.error('리뷰 로드 중 오류:', error);
    renderEmptyReviews();
  }
}

// 빈 리뷰 상태 렌더링
function renderEmptyReviews() {
  const reviewList = document.getElementById('reviewList');
  if (!reviewList) return;

  reviewList.innerHTML = `
    <div class="empty-reviews">
      <div class="empty-reviews-icon">📝</div>
      <h3>아직 리뷰가 없습니다</h3>
      <p>첫 번째 리뷰를 작성해주세요!</p>
    </div>
  `;
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
    
    // 날짜 포맷팅
    const reviewDate = new Date(review.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    reviewItem.innerHTML = `
      <div class="review-header">
        <span class="reviewer-name">사용자${review.userId || '익명'}</span>
        <span class="review-date">${reviewDate}</span>
      </div>
      <div class="review-rating">
        ${stars.split('').map(star => `<span class="star">${star}</span>`).join('')}
      </div>
      <div class="review-text">${review.content || review.text || ''}</div>
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
    const optionId = parseInt(e.target.value);
    if (currentProduct.priceOptions && optionId) {
      // option_id로 해당 옵션 찾기
      selectedPriceOption = currentProduct.priceOptions.find(option => option.id === optionId);
      // 카드도 동기화
      document.querySelectorAll('.price-option').forEach(el => el.classList.remove('active'));
      const selectedCard = document.querySelector(`[data-option-id="${optionId}"]`);
      if (selectedCard) selectedCard.classList.add('active');
      updateTotalPrice();
    } else {
      selectedPriceOption = null;
      document.querySelectorAll('.price-option').forEach(el => el.classList.remove('active'));
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
async function addToCart(event) {
   if (!selectedPriceOption) {
      showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
      return;
    }

    const productId = currentProduct.id;
    const optionId = selectedPriceOption.id;

    if (!optionId) {
      showMessageAtPosition('옵션 ID가 없습니다.', 'error', event.target);
      return;
    }

    const cartPayload = {
      optionId: optionId,
      quantity: quantity.toString(),
      unit: selectedPriceOption.unit
    };

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cartPayload),
        credentials: 'include' // 브라우저가 세션 쿠키를 보냄
      });

      if (!response.ok) {
        let errorMessage = '서버 오류';

        try {
          const contentType = response.headers.get('Content-Type');

          if (contentType && contentType.includes('application/json')) {
            const errorJson = await response.json();
            errorMessage = errorJson.message || JSON.stringify(errorJson);
          } else {
            errorMessage = await response.text();
          }
        } catch (e) {
          // 파싱 중 에러가 나면 기본 메시지 유지
        }
        throw new Error(errorMessage);
      }

      // 모달 표시
      showCartSuccessModal();
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      showMessageAtPosition(`추가 실패: ${error.message}`, 'error', event.target);
    }
}

// 바로 구매
function buyNow(event) {
  if (!selectedPriceOption) {
    showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
    return;
  }

  const optionIdx = currentProduct.priceOptions.indexOf(selectedPriceOption);
  const unitText = `${selectedPriceOption.quantity}${selectedPriceOption.unit}`;
  const unitPrice = Number(selectedPriceOption.price) || 0;
  const qty = Number(quantity) || 1;
  const lineTotal = unitPrice * qty;

  // 주문 데이터(표시용 + 계산용 모두 포함)
  const orderItem = {
    // 식별/연결 정보
    productId: currentProduct.id,
    optionIdx: optionIdx,
    // 표시 정보
    id: currentProduct.id,                // 하위 호환
    name: currentProduct.name,
    category: currentProduct.category || '',
    region: currentProduct.region || '',
    image: (currentProduct.images && currentProduct.images[0] && currentProduct.images[0].src) || '',
    // 옵션 및 수량
    optionText: unitText,
    quantityCount: qty,
    // 가격(계산용/표시용)
    unitPrice: unitPrice,                 // ✅ 추가: 단가 숫자
    priceRaw: lineTotal,                  // ✅ 합계 숫자
    priceFormatted: `${lineTotal.toLocaleString()}원`,
    // 구버전 호환 필드
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
function updateReviewSummaryMini(summary) {
  const avgEl = document.getElementById('avgRatingMini');
  const starsEl = document.getElementById('avgStarsMini');
  const countEl = document.getElementById('totalReviewCountMini');
  if (!avgEl || !starsEl || !countEl) return;

  // API 응답에서 summary 객체의 필드 사용
  const count = summary.totalCount || 0;
  const avg = summary.averageRating || 0;

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

// 장바구니 성공 모달 표시
function showCartSuccessModal() {
  const modal = document.getElementById('cartSuccessModal');
  if (modal) {
    modal.style.display = 'flex';
    
    // 모달 이벤트 리스너 설정
    setupModalEventListeners();
  }
}

// 모달 이벤트 리스너 설정
function setupModalEventListeners() {
  const modal = document.getElementById('cartSuccessModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const stayBtn = document.getElementById('stayOnPageBtn');
  const goToCartBtn = document.getElementById('goToCartBtn');

  // 모달 닫기 (X 버튼)
  if (closeBtn) {
    closeBtn.addEventListener('click', hideCartSuccessModal);
  }

  // 현재 페이지에 머물기
  if (stayBtn) {
    stayBtn.addEventListener('click', hideCartSuccessModal);
  }

  // 장바구니로 이동
  if (goToCartBtn) {
    goToCartBtn.addEventListener('click', () => {
      hideCartSuccessModal();
      window.location.href = '/shoppinglist';
    });
  }

  // 모달 배경 클릭 시 닫기
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideCartSuccessModal();
      }
    });
  }

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
      hideCartSuccessModal();
    }
  });
}

// 모달 숨기기
function hideCartSuccessModal() {
  const modal = document.getElementById('cartSuccessModal');
  if (modal) {
    modal.style.display = 'none';
  }
}
