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

// 전역 상태
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
  // 이미지 폴백 초기 장착
  armAllImageFallbacks();
  console.log('상품 상세 페이지가 초기화되었습니다.');
}

// ===================== URL 유틸 =====================
function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}
function getRegionFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('region');
}
function goBackToList() {
  const region = getRegionFromUrl();
  if (region) {
    window.location.href = '/region';
  }
}

// ===================== 데이터 로딩 =====================
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

  // 관련 상품은 서버 템플릿에서 렌더됨(썸네일까지 폴백 자동 장착됨)
  loadRelatedProducts(); // no-op
}

// 서버에서 전달된 상품 데이터 가져오기 (DOM 스크랩)
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

// ===================== 렌더링 =====================
function renderProductDetail() {
  if (!currentProduct) return;

  // 제목/태그
  document.getElementById('productTitle').textContent = currentProduct.name;
  const tagsContainer = document.getElementById('productTags');
  tagsContainer.innerHTML = `
    <span class="product-tag">${currentProduct.category}</span>
    <span class="product-tag">${currentProduct.region}</span>
  `;

  // 가격 옵션
  renderPriceOptions();

  // 상세 정보
  document.getElementById('originInfo').textContent = currentProduct.origin || '-';
  document.getElementById('seasonInfo').textContent = currentProduct.seasons ? currentProduct.seasons.join(', ') : (currentProduct.harvestSeason || '-');
  document.getElementById('typeInfo').textContent = currentProduct.category || '-';

  // 설명
  document.getElementById('descriptionText').textContent = currentProduct.description || '';

  // 업체 정보
  renderCompanyInfo();

  // 이미지
  renderProductImages();
}

function renderPriceOptions() {
  const priceOptionsContainer = document.getElementById('priceOptions');
  const priceSelect = document.getElementById('priceOptionSelect');
  if (!priceOptionsContainer || !priceSelect) return;

  priceOptionsContainer.innerHTML = '';
  priceSelect.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';

  const list = (currentProduct && Array.isArray(currentProduct.priceOptions))
    ? currentProduct.priceOptions
    : [];

  if (list.length === 0) return;

  list.forEach((option, index) => {
    // 카드
    const card = document.createElement('div');
    card.className = 'price-option';
    card.innerHTML = `
      <span class="price-option-info">${option.quantity}${option.unit}</span>
      <span class="price-option-amount">${option.price.toLocaleString()}원</span>
    `;
    priceOptionsContainer.appendChild(card);

    // 셀렉트
    const opt = document.createElement('option');
    opt.value = index;
    opt.setAttribute('data-quantity', option.quantity);
    opt.setAttribute('data-unit', option.unit);
    opt.setAttribute('data-price', option.price);
    opt.textContent = `${option.quantity}${option.unit} - ${option.price.toLocaleString()}원`;
    priceSelect.appendChild(opt);
  });
}

// ❗️중복/실수로 파일 하단에 있던 다음 블록은 반드시 삭제하세요:
// currentProduct.priceOptions.forEach(...)

function renderCompanyInfo() {
  if (!currentProduct?.companyInfo) return;
  const { name, phone, email } = currentProduct.companyInfo;
  const companyNameElement = document.getElementById('companyName');
  const companyPhoneElement = document.getElementById('companyPhone');
  const companyEmailElement = document.getElementById('companyEmail');
  if (companyNameElement) companyNameElement.textContent = name;
  if (companyPhoneElement) companyPhoneElement.textContent = phone;
  if (companyEmailElement) companyEmailElement.textContent = email;
}

function renderProductImages() {
  const mainImage = document.getElementById('productImg') || document.getElementById('mainImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');

  if (!mainImage) return;

  if (!currentProduct.images || currentProduct.images.length === 0) {
    mainImage.src = 'https://via.placeholder.com/400x400/cccccc/666666?text=이미지+없음';
    armImageFallback(mainImage);
    return;
  }

  // 메인 이미지
  armImageFallback(mainImage);
  mainImage.src = currentProduct.images[0].src || '';
  mainImage.alt = currentProduct.images[0].alt || currentProduct.name || '상품 이미지';

  // 썸네일
  if (thumbnailContainer) {
    thumbnailContainer.innerHTML = '';
    currentProduct.images.forEach((image, index) => {
      const thumbnail = document.createElement('img');
      thumbnail.className = 'thumbnail';
      armImageFallback(thumbnail);
      thumbnail.src = image.src || '';
      thumbnail.alt = image.alt || '';
      if (index === 0) thumbnail.classList.add('active');

      thumbnail.addEventListener('click', () => {
        currentImageIndex = index;
        updateMainImage();
        updateThumbnailActive();
      });

      thumbnailContainer.appendChild(thumbnail);
    });
  }

  // 이미지가 1개뿐이면 네비게이션 버튼 숨기기
  if (currentProduct.images.length <= 1) {
    document.getElementById('prevBtn')?.style && (document.getElementById('prevBtn').style.display = 'none');
    document.getElementById('nextBtn')?.style && (document.getElementById('nextBtn').style.display = 'none');
  }
}

function updateMainImage() {
  if (!currentProduct.images || currentProduct.images.length === 0) return;
  const mainImage = document.getElementById('productImg') || document.getElementById('mainImage');
  if (!mainImage) return;
  const cur = currentProduct.images[currentImageIndex];
  mainImage.src = cur.src || '';
  mainImage.alt = cur.alt || '';
}

function updateThumbnailActive() {
  document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentImageIndex);
  });
}

// ===================== 이벤트들 =====================
function setupEventListeners() {
  // 이미지 네비게이션
  document.getElementById('prevBtn')?.addEventListener('click', () => {
    if (currentProduct.images?.length > 0) {
      currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });
  document.getElementById('nextBtn')?.addEventListener('click', () => {
    if (currentProduct.images?.length > 0) {
      currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
      updateMainImage();
      updateThumbnailActive();
    }
  });

  // 수량 조절
  document.getElementById('decreaseBtn')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      document.getElementById('quantity').value = quantity;
      updateTotalPrice();
    }
  });
  document.getElementById('increaseBtn')?.addEventListener('click', () => {
    quantity++;
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();
  });
  document.getElementById('quantity')?.addEventListener('input', (e) => {
    quantity = Math.max(1, parseInt(e.target.value) || 1);
    e.target.value = quantity;
    updateTotalPrice();
  });

  // 가격 옵션 선택
  document.getElementById('priceOptionSelect')?.addEventListener('change', (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.dataset.price) {
      selectedPriceOption = {
        quantity: Number(opt.dataset.quantity),
        unit: opt.dataset.unit,
        price: Number(opt.dataset.price)
      };
    } else {
      selectedPriceOption = null;
    }
    updateTotalPrice();
  });

  // 장바구니/구매
  document.getElementById('addToCartBtn')?.addEventListener('click', (event) => addToCart(event));
  document.getElementById('buyNowBtn')?.addEventListener('click', (event) => buyNow(event));

  // 뒤로가기
  document.getElementById('backBtn')?.addEventListener('click', goBackToList);
}

// ===================== 가격/장바구니 =====================
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
      image: currentProduct.images?.[0]?.src || ''
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showMessageAtPosition('장바구니에 상품이 추가되었습니다.', 'success', event.target);
}

function buyNow(event) {
  if (!selectedPriceOption) {
    showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
    return;
  }

  const orderItem = {
    id: currentProduct.id,
    name: currentProduct.name,
    quantity: `${selectedPriceOption.quantity}${selectedPriceOption.unit}`,
    price: `${selectedPriceOption.price.toLocaleString()}원`,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem('currentOrder', JSON.stringify([orderItem]));
  showMessageAtPosition('구매 페이지로 이동합니다...', 'success', event.target);
  setTimeout(() => {
    window.location.href = '/buying';
  }, 1500);
}

// ===================== 메시지 UI =====================
function showMessage(message, type) {
  showMessageAtPosition(message, type);
}
function showMessageAtPosition(message, type, targetElement = null) {
  const existingMessage = document.querySelector('.message');
  if (existingMessage) existingMessage.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed; padding: 15px 20px; border-radius: 8px; color: white;
    font-weight: 500; z-index: 1000; max-width: 300px; word-wrap: break-word;
    ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
  `;

  if (!document.querySelector('#messageAnimation')) {
    const style = document.createElement('style');
    style.id = 'messageAnimation';
    style.textContent = `
      @keyframes slideIn { from {transform: translateX(100%); opacity: 0;} to {transform: translateX(0); opacity: 1;} }
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
  setTimeout(() => messageDiv.remove(), 3000);
}

// ===================== 이미지 폴백 =====================
const IMG_PLACEHOLDER = '/images/따봉 트럭.png';

function armImageFallback(img) {
  if (!img || img.dataset.fallbackArmed === '1') return;
  img.dataset.fallbackArmed = '1';

  img.addEventListener('error', () => {
    img.onerror = null;
    img.src = IMG_PLACEHOLDER;
  }, { once: true });

  const raw = (img.getAttribute('src') || '').trim();
  if (!raw || raw.toLowerCase() === 'null' || raw === '#') {
    img.src = IMG_PLACEHOLDER;
  }
}

function armAllImageFallbacks(root = document) {
  root.querySelectorAll(
    // 메인/썸네일/관련상품 썸네일 전부 커버
    '.product-image img, .related-thumb img, .main-image, img.related-product-image, img.thumbnail, #productImg, #mainImage'
  ).forEach(armImageFallback);

  // 동적 IMG도 자동 폴백
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'IMG') armImageFallback(n);
      else n.querySelectorAll && n.querySelectorAll('img').forEach(armImageFallback);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}

// ===================== 관련 상품 (서버 렌더 사용) =====================
function loadRelatedProducts() {
  // 서버 템플릿(Thymeleaf)에서 이미 렌더되므로 별도 작업 없음.
  // 썸네일 폴백은 armAllImageFallbacks()에서 자동 처리됨.
}

// ===================== 더미 회사 정보 =====================
function generateRandomCompany(regionText) {
  const companyNames = ['농협','농업협동조합','지역농협','특산품직판장','농산물유통센터','친환경농장','전통농업','청정농업','자연농업','유기농업','지역특산품','농가직판','농산물유통','신선농산물','제철농산물'];
  const companySuffixes = ['협동조합','농장','직판장','유통센터','농업회사','특산품센터','농산물센터','친환경농업','자연농업'];
  const areaCodes = { '서울':'02','경기':'031','인천':'032','강원':'033','충북':'043','충남':'041','대전':'042','전북':'063','전남':'061','광주':'062','경북':'054','경남':'055','대구':'053','울산':'052','부산':'051','제주':'064' };

  const regionPrefix = (regionText || '').substring(0, 2);
  const randomName = companyNames[Math.floor(Math.random() * companyNames.length)];
  const randomSuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
  const companyName = `${regionPrefix}${randomName}${randomSuffix}`;

  const areaCode = areaCodes[regionPrefix] || '02';
  const phoneNumber = `${areaCode}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;

  const emailDomains = ['naver.com','gmail.com','daum.net','coop.co.kr','farm.co.kr'];
  const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  const email = `${companyName.toLowerCase().replace(/[^a-z0-9]/g,'')}@${randomDomain}`;

  return { name: companyName, phone: phoneNumber, email };
}
