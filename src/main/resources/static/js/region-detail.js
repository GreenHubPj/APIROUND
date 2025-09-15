// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeRegionDetail();

    // 서버가 옵션을 넣어줬는지 확인
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

// 페이지 초기화
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

    // 서버에서 전달된 상품 데이터 사용
    currentProduct = getProductFromServer();

    if (!currentProduct) {
        showMessage('상품을 찾을 수 없습니다.', 'error');
        return;
    }

    renderProductDetail();
    loadRelatedProducts();
}

// 서버에서 전달된 상품 데이터 가져오기
function getProductFromServer() {

    // Thymeleaf로 전달된 데이터를 JavaScript에서 사용
    const productName   = document.getElementById('productTitle').textContent;
      const productTags   = document.querySelectorAll('.product-tag');
      const productType   = productTags[0]?.textContent || '';
      const regionText    = productTags[1]?.textContent || '';
      const description   = document.getElementById('descriptionText').textContent;
      const thumbnailUrl  = document.getElementById('mainImage').src;
      const harvestSeason = document.getElementById('seasonInfo').textContent;
      const productId     = parseInt(getProductIdFromUrl());

      // ✅ DOM에서 가격 옵션 파싱
      const priceOptions = Array.from(
        document.querySelectorAll('#priceOptions .price-option')
      ).map(el => ({
        quantity: Number(el.dataset.quantity),
        unit: el.dataset.unit,
        price: Number(el.dataset.price)
      }));

       // 랜덤 업체정보 (원하면 유지)
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

function renderPriceOptions() {
  const priceOptionsContainer = document.getElementById('priceOptions');
  const priceSelect = document.getElementById('priceOptionSelect');

  if (!priceOptionsContainer || !priceSelect) return;

  priceOptionsContainer.innerHTML = '';
  priceSelect.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';

  const list = (currentProduct && Array.isArray(currentProduct.priceOptions))
    ? currentProduct.priceOptions
    : [];

  // 옵션이 없으면 그냥 종료 (재귀 금지)
  if (list.length === 0) {
    return;
  }

  list.forEach((option, index) => {
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
    optionSelect.setAttribute('data-quantity', option.quantity);
    optionSelect.setAttribute('data-unit', option.unit);
    optionSelect.setAttribute('data-price', option.price);
    optionSelect.textContent = `${option.quantity}${option.unit} - ${option.price.toLocaleString()}원`;
    priceSelect.appendChild(optionSelect);
  });
}


  currentProduct.priceOptions.forEach((option, index) => {
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


// 지역별 랜덤 업체 정보 생성
function generateRandomCompany(regionText) {
  const companyNames = ['농협','농업협동조합','지역농협','특산품직판장','농산물유통센터','친환경농장','전통농업','청정농업','자연농업','유기농업','지역특산품','농가직판','농산물유통','신선농산물','제철농산물'];
  const companySuffixes = ['협동조합','농장','직판장','유통센터','농업회사','특산품센터','농산물센터','친환경농업','자연농업'];
  const areaCodes = { '서울':'02','경기':'031','인천':'032','강원':'033','충북':'043','충남':'041','대전':'042','전북':'063','전남':'061','광주':'062','경북':'054','경남':'055','대구':'053','울산':'052','부산':'051','제주':'064' };

  const regionPrefix = regionText.substring(0, 2);
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



// 상품 ID로 상품 정보 가져오기
function getProductById(id) {
    // 실제로는 API 호출하지만, 여기서는 더미 데이터 사용
    const products = [
        {
            id: 1,
            name: '제주 감귤',
            category: '과일',
            region: '제주',
            priceOptions: [
                { quantity: 2, unit: 'kg', price: 30000 },
                { quantity: 3, unit: 'kg', price: 45000 },
                { quantity: 5, unit: 'kg', price: 70000 }
            ],
            stock: 50,
            origin: '제주도',
            expiryDays: 30,
            storageMethod: '냉장보관',
            seasons: ['11월', '12월', '1월', '2월'],
            description: '제주도에서 직접 재배한 신선한 감귤입니다. 달콤하고 향긋한 맛이 일품이며, 비타민C가 풍부하여 건강에도 좋습니다. 신선한 상태로 포장하여 배송됩니다.',
            images: [
                { id: 1, src: 'https://via.placeholder.com/400x400/ff8c42/ffffff?text=제주+감귤+1', alt: '제주 감귤 1' },
                { id: 2, src: 'https://via.placeholder.com/400x400/ff8c42/ffffff?text=제주+감귤+2', alt: '제주 감귤 2' },
                { id: 3, src: 'https://via.placeholder.com/400x400/ff8c42/ffffff?text=제주+감귤+3', alt: '제주 감귤 3' }
            ],
            createdAt: '2024-01-15',
            status: 'active'
        },
        {
            id: 2,
            name: '강원도 고랭지 배추',
            category: '채소',
            region: '강원',
            priceOptions: [
                { quantity: 1, unit: '개', price: 8000 },
                { quantity: 2, unit: '개', price: 15000 },
                { quantity: 3, unit: '개', price: 22000 }
            ],
            stock: 30,
            origin: '강원도',
            expiryDays: 15,
            storageMethod: '냉장보관',
            seasons: ['10월', '11월', '12월', '1월', '2월'],
            description: '강원도 고랭지에서 재배한 아삭한 배추입니다. 김치 담그기에 최적이며, 신선하고 맛있습니다. 고랭지의 청정한 환경에서 자라 더욱 건강합니다.',
            images: [
                { id: 1, src: 'https://via.placeholder.com/400x400/27ae60/ffffff?text=강원+배추+1', alt: '강원도 배추 1' },
                { id: 2, src: 'https://via.placeholder.com/400x400/27ae60/ffffff?text=강원+배추+2', alt: '강원도 배추 2' }
            ],
            createdAt: '2024-01-14',
            status: 'active'
        },
        {
            id: 3,
            name: '경북 사과',
            category: '과일',
            region: '경북',
            priceOptions: [
                { quantity: 1, unit: 'kg', price: 12000 },
                { quantity: 2, unit: 'kg', price: 23000 },
                { quantity: 3, unit: 'kg', price: 34000 }
            ],
            stock: 25,
            origin: '경상북도',
            expiryDays: 60,
            storageMethod: '냉장보관',
            seasons: ['9월', '10월', '11월'],
            description: '경북 지역의 맛있는 사과입니다. 아삭하고 달콤한 맛이 특징이며, 신선한 상태로 보관됩니다. 건강한 간식으로도 좋습니다.',
            images: [
                { id: 1, src: 'https://via.placeholder.com/400x400/e74c3c/ffffff?text=경북+사과+1', alt: '경북 사과 1' },
                { id: 2, src: 'https://via.placeholder.com/400x400/e74c3c/ffffff?text=경북+사과+2', alt: '경북 사과 2' },
                { id: 3, src: 'https://via.placeholder.com/400x400/e74c3c/ffffff?text=경북+사과+3', alt: '경북 사과 3' },
                { id: 4, src: 'https://via.placeholder.com/400x400/e74c3c/ffffff?text=경북+사과+4', alt: '경북 사과 4' }
            ],
            createdAt: '2024-01-13',
            status: 'active'
        }
    ];

    return products.find(product => product.id == id);
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
      `;

    // 가격 옵션
    renderPriceOptions();

    // 상품 상세 정보
    document.getElementById('originInfo').textContent = currentProduct.origin || '-';
    document.getElementById('seasonInfo').textContent = currentProduct.seasons ? currentProduct.seasons.join(', ') : '-';

    // 상품 설명
    document.getElementById('descriptionText').textContent = currentProduct.description;

    // 업체 정보 렌더링
    renderCompanyInfo();

    // 상품 이미지
    renderProductImages();
}



// 업체 정보 렌더링
function renderCompanyInfo() {
    if (!currentProduct.companyInfo) return;

    const companyInfo = currentProduct.companyInfo;

    // 업체명
    const companyNameElement = document.getElementById('companyName');
    if (companyNameElement) {
        companyNameElement.textContent = companyInfo.name;
    }

    // 전화번호
    const companyPhoneElement = document.getElementById('companyPhone');
    if (companyPhoneElement) {
        companyPhoneElement.textContent = companyInfo.phone;
    }

    // 이메일
    const companyEmailElement = document.getElementById('companyEmail');
    if (companyEmailElement) {
        companyEmailElement.textContent = companyInfo.email;
    }
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

// 리뷰보기 버튼 설정
function setupReviewButton() {
    const viewAllReviewsBtn = document.getElementById('viewAllReviewsBtn');
    if (viewAllReviewsBtn) {
        viewAllReviewsBtn.addEventListener('click', function() {
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

    // 최신 3개 리뷰만 표시
    const recentReviews = allReviews.slice(0, 3);
    renderReviews(recentReviews);

    // 전체 리뷰 데이터를 localStorage에 저장 (review 페이지에서 사용)
    localStorage.setItem('allReviews', JSON.stringify(allReviews));
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

    // 가격 옵션 선택 핸들러 (dataset 사용)
    document.getElementById('priceOptionSelect').addEventListener('change', (e) => {
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

    // 장바구니 담기
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

// 장바구니 담기
function addToCart(event) {
    console.log('장바구니 담기 버튼 클릭됨');
    console.log('selectedPriceOption:', selectedPriceOption);

    if (!selectedPriceOption) {
        console.log('가격 옵션 미선택 - 에러 메시지 표시');
        showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
        return;
    }

    // 장바구니 데이터 가져오기
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    // 기존 상품이 있는지 확인
    const existingItemIndex = cart.findIndex(item =>
        item.productId === currentProduct.id &&
        item.priceOptionIndex === currentProduct.priceOptions.indexOf(selectedPriceOption)
    );

    if (existingItemIndex >= 0) {
        // 기존 상품 수량 증가
        cart[existingItemIndex].quantity += quantity;
    } else {
        // 새 상품 추가
        cart.push({
            productId: currentProduct.id,
            productName: currentProduct.name,
            priceOptionIndex: currentProduct.priceOptions.indexOf(selectedPriceOption),
            priceOption: selectedPriceOption,
            quantity: quantity,
            image: currentProduct.images[0].src
        });
    }

    // 장바구니 저장
    localStorage.setItem('cart', JSON.stringify(cart));

    showMessageAtPosition('장바구니에 상품이 추가되었습니다.', 'success', event.target);
}

// 바로 구매
function buyNow(event) {
    console.log('구매하기 버튼 클릭됨');
    console.log('selectedPriceOption:', selectedPriceOption);

    if (!selectedPriceOption) {
        console.log('가격 옵션 미선택 - 에러 메시지 표시');
        showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target);
        return;
    }

    // 주문 데이터 생성
    const orderItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        quantity: `${selectedPriceOption.quantity}${selectedPriceOption.unit}`,
        price: `${selectedPriceOption.price.toLocaleString()}원`,
        timestamp: new Date().toISOString()
    };

    console.log('주문 데이터 생성됨:', orderItem);

    // 주문 정보를 localStorage에 저장
    localStorage.setItem('currentOrder', JSON.stringify([orderItem]));
    console.log('localStorage에 주문 정보 저장됨');

    // 구매 페이지로 이동
    showMessageAtPosition('구매 페이지로 이동합니다...', 'success', event.target);
    setTimeout(() => {
        window.location.href = '/buying';
    }, 1500);
}

// 메시지 표시 (기본 위치)
function showMessage(message, type) {
    showMessageAtPosition(message, type);
}

// 특정 위치에 메시지 표시
function showMessageAtPosition(message, type, targetElement = null) {
    console.log('showMessageAtPosition 호출됨:', message, type, targetElement);

    // 기존 메시지 제거
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;

    console.log('메시지 div 생성됨:', messageDiv);

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
            .message {
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    // 위치 설정
    if (targetElement) {
        // 클릭한 요소 근처에 표시 (간단한 방법)
        const rect = targetElement.getBoundingClientRect();
        messageDiv.style.top = `${rect.bottom + 10}px`;
        messageDiv.style.left = `${rect.left}px`;
        console.log('타겟 요소 위치 설정:', rect.bottom, rect.left);
    } else {
        // 기본 위치 (우상단)
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        console.log('기본 위치 설정');
    }

    // DOM에 추가
    document.body.appendChild(messageDiv);
    console.log('메시지 DOM에 추가됨');

    // 3초 후 제거
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  const PH = '/images/따봉 트럭.png';

  function arm(img){
    if(!img || img.dataset.fallbackArmed === '1') return;
    img.dataset.fallbackArmed = '1';
    img.addEventListener('error', () => { img.onerror = null; img.src = PH; }, { once:true });

    const raw = (img.getAttribute('src') || '').trim();
    if (!raw || raw.toLowerCase() === 'null' || raw === '#') {
      img.src = PH;
    }
  }

  // 초기 IMG들
  document.querySelectorAll(
    '.product-image img, .related-thumb img, .main-image, img.related-product-image, img.thumbnail, #mainImage'
  ).forEach(arm);

  // 동적으로 추가되는 IMG도 자동 장착
  new MutationObserver(muts => {
    muts.forEach(m => m.addedNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'IMG') arm(n); else n.querySelectorAll && n.querySelectorAll('img').forEach(arm);
    }));
  }).observe(document.body, { childList:true, subtree:true });

  // 필요 시 전역 사용
  window.armImageFallback = arm;
});