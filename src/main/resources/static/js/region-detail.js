// ==============================
// region-detail.js (전체 파일)
// ==============================

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeRegionDetail();
});

// 전역 변수
let currentProduct = null;
let currentImageIndex = 0;
let selectedPriceOption = null;
let quantity = 1;

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
        window.location.href = `/region?region=${encodeURIComponent(region)}`;
    } else {
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

    // 서버에서 전달된 상품 데이터 사용(Thymeleaf 렌더된 DOM에서 읽기)
    currentProduct = getProductFromServer();

    if (!currentProduct) {
        showMessage('상품을 찾을 수 없습니다.', 'error');
        return;
    }

    renderProductDetail();
    loadRelatedProducts();
}

// 서버에서 전달된 상품 데이터 가져오기(템플릿에서 채워진 DOM 기반)
function getProductFromServer() {
    const productName = document.getElementById('productTitle')?.textContent || '';
    const productTagEls = document.querySelectorAll('.product-tag');
    const productType = productTagEls?.[0]?.textContent || '';
    const regionText  = productTagEls?.[1]?.textContent || '';
    const description = document.getElementById('descriptionText')?.textContent || '';
    const thumbnailUrl = document.getElementById('mainImage')?.src || '';
    const harvestSeason = document.getElementById('seasonInfo')?.textContent || '';

    // 상품 ID는 URL에서 가져오기
    const productId = parseInt(getProductIdFromUrl(), 10);

    // 가격 옵션: 페이지를 새로 열 때마다 동일하게 나오도록, 간단한 규칙 기반 생성
    let priceOptions;
    const storedKey = `product_${productId}_prices`;
    const storedPrices = localStorage.getItem(storedKey);
    if (storedPrices) {
        priceOptions = JSON.parse(storedPrices);
    } else {
        priceOptions = generateConsistentPrices(productId, productType);
        localStorage.setItem(storedKey, JSON.stringify(priceOptions));
    }

    // 랜덤 업체 정보 생성(지역으로 시드)
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
        images: [
            { id: 1, src: thumbnailUrl, alt: productName }
        ]
    };
}

// 상품 ID와 타입에 따른 일관된 가격 생성
function generateConsistentPrices(productId, productType) {
    const basePrices = {
        '농산물': { min: 5000,  max: 15000 },
        '축산물': { min: 15000, max: 35000 },
        '수산물': { min: 10000, max: 25000 },
        '가공식품': { min: 3000,  max: 12000 }
    };
    const priceRange = basePrices[productType] || { min: 5000, max: 20000 };

    // 간단한 시드 기반 난수
    const seed = productId * 12345;
    const random = (seed * 9301 + 49297) % 233280;
    const normalized = random / 233280;

    const price1 = Math.floor(normalized * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    const price2 = Math.floor(price1 * 1.8);
    const price3 = Math.floor(price1 * 2.5);

    return [
        { quantity: 1, unit: 'kg', price: price1 },
        { quantity: 2, unit: 'kg', price: price2 },
        { quantity: 3, unit: 'kg', price: price3 }
    ];
}

// 지역별 랜덤 업체 정보 생성
function generateRandomCompany(regionText) {
    const companyNames = [
        '농협', '농업협동조합', '지역농협', '특산품직판장', '농산물유통센터',
        '친환경농장', '전통농업', '청정농업', '자연농업', '유기농업',
        '지역특산품', '농가직판', '농산물도매', '신선농산물', '제철농산물'
    ];
    const companySuffixes = [
        '협동조합', '농장', '직판장', '유통센터', '농협', '농업회사',
        '특산품센터', '농산물센터', '친환경농업', '자연농업'
    ];

    const regionPrefix = regionText.substring(0, 2);
    const randomName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const randomSuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    const companyName = `${regionPrefix}${randomName}${randomSuffix}`;

    const areaCodes = {
        '서울': '02', '경기': '031', '인천': '032', '강원': '033',
        '충북': '043', '충남': '041', '대전': '042', '전북': '063',
        '전남': '061', '광주': '062', '경북': '054', '경남': '055',
        '대구': '053', '울산': '052', '부산': '051', '제주': '064'
    };
    const areaCode = areaCodes[regionPrefix] || '02';
    const phoneNumber = `${areaCode}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;

    const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'coop.co.kr', 'farm.co.kr'];
    const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@${randomDomain}`;

    return { name: companyName, phone: phoneNumber, email };
}

// (데모) 상품 ID로 상품 정보 가져오기 - 현재는 사용하지 않지만 남겨둠
function getProductById(id) {
    return null;
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

    // 상세 정보
    const stockEl   = document.getElementById('stockInfo');
    const originEl  = document.getElementById('originInfo');
    const expiryEl  = document.getElementById('expiryInfo');
    const storageEl = document.getElementById('storageInfo');
    const seasonEl  = document.getElementById('seasonInfo');

    if (stockEl)   stockEl.textContent   = currentProduct.stock ? `${currentProduct.stock}개` : '재고 없음';
    if (originEl)  originEl.textContent  = currentProduct.origin || currentProduct.region || '-';
    if (expiryEl)  expiryEl.textContent  = currentProduct.expiryDays ? `${currentProduct.expiryDays}일 이내 소모` : '-';
    if (storageEl) storageEl.textContent = currentProduct.storageMethod || '-';
    if (seasonEl)  seasonEl.textContent  = currentProduct.seasons ? currentProduct.seasons.join(', ') : (currentProduct.harvestSeason || '-');

    // 상품 설명
    document.getElementById('descriptionText').textContent = currentProduct.description || '';

    // 업체 정보
    renderCompanyInfo();

    // 상품 이미지
    renderProductImages();
}

// 업체 정보 렌더링
function renderCompanyInfo() {
    if (!currentProduct.companyInfo) return;
    const { name, phone, email } = currentProduct.companyInfo;

    const companyNameElement  = document.getElementById('companyName');
    const companyPhoneElement = document.getElementById('companyPhone');
    const companyEmailElement = document.getElementById('companyEmail');

    if (companyNameElement)  companyNameElement.textContent  = name;
    if (companyPhoneElement) companyPhoneElement.textContent = phone;
    if (companyEmailElement) companyEmailElement.textContent = email;
}

// 가격 옵션 렌더링
function renderPriceOptions() {
    const priceOptionsContainer = document.getElementById('priceOptions');
    const priceSelect = document.getElementById('priceOptionSelect');

    priceOptionsContainer.innerHTML = '';
    priceSelect.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';

    currentProduct.priceOptions.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'price-option';
        optionElement.innerHTML = `
            <span class="price-option-info">${option.quantity}${option.unit}</span>
            <span class="price-option-amount">${option.price.toLocaleString()}원</span>
        `;
        priceOptionsContainer.appendChild(optionElement);

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

    if (!currentProduct.images || currentProduct.images.length === 0) {
        if (mainImage) mainImage.src = 'https://via.placeholder.com/400x400/cccccc/666666?text=이미지+없음';
        return;
    }

    // 메인 이미지
    if (mainImage) {
        mainImage.src = currentProduct.images[0].src;
        mainImage.alt = currentProduct.images[0].alt;
    }

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

    // 이미지가 1개뿐이면 네비게이션 버튼 숨김
    if (currentProduct.images.length <= 1) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
}

// 메인 이미지 업데이트
function updateMainImage() {
    if (!currentProduct.images || currentProduct.images.length === 0) return;
    const mainImage = document.getElementById('mainImage');
    const currentImage = currentProduct.images[currentImageIndex];
    if (mainImage) {
        mainImage.src = currentImage.src;
        mainImage.alt = currentImage.alt;
    }
}

// 썸네일 활성 상태 업데이트
function updateThumbnailActive() {
    document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
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

    // ✅ 리뷰 데이터 로드(백엔드 연동)
    loadRecentReviews();

    // ✅ 리뷰보기 버튼 이벤트 리스너
    setupReviewButton();
}

// 리뷰보기 버튼 설정
function setupReviewButton() {
    const viewAllReviewsBtn = document.getElementById('viewAllReviewsBtn');
    if (viewAllReviewsBtn) {
        viewAllReviewsBtn.addEventListener('click', function() {
            const productId = getProductIdFromUrl();
            // ✅ 서버 렌더 reviewlist로 이동 (productId 쿼리로 전달)
            window.location.href = `/reviewlist?productId=${encodeURIComponent(productId)}`;
        });
    }
}

// ✅ 최근 리뷰 3개 로드(백엔드)
async function loadRecentReviews() {
    const productId = getProductIdFromUrl();
    const reviewList = document.getElementById('reviewList');
    if (!reviewList || !productId) return;

    reviewList.innerHTML = `
        <div class="review-item skeleton">
            <div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div>
            <div class="review-rating"><span class="skeleton-line w-50"></span></div>
            <div class="review-text"><span class="skeleton-line w-90"></span><span class="skeleton-line w-80"></span></div>
        </div>
        <div class="review-item skeleton">
            <div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div>
            <div class="review-rating"><span class="skeleton-line w-50"></span></div>
            <div class="review-text"><span class="skeleton-line w-90"></span><span class="skeleton-line w-60"></span></div>
        </div>
        <div class="review-item skeleton">
            <div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div>
            <div class="review-rating"><span class="skeleton-line w-50"></span></div>
            <div class="review-text"><span class="skeleton-line w-80"></span><span class="skeleton-line w-70"></span></div>
        </div>
    `;

    try {
        // /api/reviews?productId=...&page=0&size=3 (정렬은 createdAt desc가 기본이라고 가정)
        const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&page=0&size=3`, {
            headers: { 'Accept': 'application/json' },
            credentials: 'same-origin'
        });
        if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status}`);
        const data = await res.json();

        // data가 Page 형태라고 가정: { content: [ {rating, content, createdAt, userName? ...} ], totalElements, ... }
        const reviews = Array.isArray(data?.content) ? data.content : [];
        if (reviews.length === 0) {
            reviewList.innerHTML = `
                <div class="review-empty">
                    아직 작성된 리뷰가 없습니다. 첫 리뷰의 주인공이 되어보세요!
                </div>
            `;
            return;
        }

        renderReviews(reviews.map(r => ({
            reviewerName: r.userName || '구매자',
            rating: Number(r.rating) || 0,
            date: (r.createdAt || '').slice(0, 10),
            text: r.content || ''
        })));
    } catch (e) {
        console.error(e);
        reviewList.innerHTML = `
            <div class="review-error">
                리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
        `;
    }
}

// 리뷰 렌더링
function renderReviews(reviews) {
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';

    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';

        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="reviewer-name">${escapeHtml(review.reviewerName)}</span>
                <span class="review-date">${escapeHtml(review.date || '')}</span>
            </div>
            <div class="review-rating">
                ${stars.split('').map(star => `<span class="star">${star}</span>`).join('')}
            </div>
            <div class="review-text">${escapeHtml(review.text)}</div>
        `;

        reviewList.appendChild(reviewItem);
    });
}

function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, m => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
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
                <h3 class="related-product-title">${escapeHtml(product.name)}</h3>
                <div class="related-product-price">${product.priceOptions[0].quantity}${product.priceOptions[0].unit} ${product.priceOptions[0].price.toLocaleString()}원</div>
                <div class="related-product-tags">
                    <span class="related-product-tag">${escapeHtml(product.category)}</span>
                    <span class="related-product-tag">${escapeHtml(product.region)}</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            window.location.href = `/region-detail?id=${encodeURIComponent(product.id)}&region=${encodeURIComponent(product.region)}`;
        });

        grid.appendChild(card);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 이미지 네비게이션
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentProduct.images && currentProduct.images.length > 0) {
                currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
                updateMainImage();
                updateThumbnailActive();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentProduct.images && currentProduct.images.length > 0) {
                currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
                updateMainImage();
                updateThumbnailActive();
            }
        });
    }

    // 수량 조절
    const decBtn = document.getElementById('decreaseBtn');
    const incBtn = document.getElementById('increaseBtn');
    const qtyInput = document.getElementById('quantity');

    if (decBtn) decBtn.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            qtyInput.value = quantity;
            updateTotalPrice();
        }
    });

    if (incBtn) incBtn.addEventListener('click', () => {
        quantity++;
        qtyInput.value = quantity;
        updateTotalPrice();
    });

    if (qtyInput) {
        qtyInput.addEventListener('input', (e) => {
            quantity = Math.max(1, parseInt(e.target.value) || 1);
            e.target.value = quantity;
            updateTotalPrice();
        });
    }

    // 가격 옵션 선택
    const priceSelect = document.getElementById('priceOptionSelect');
    if (priceSelect) {
        priceSelect.addEventListener('change', (e) => {
            const optionIndex = parseInt(e.target.value, 10);
            if (!isNaN(optionIndex) && optionIndex >= 0 && optionIndex < currentProduct.priceOptions.length) {
                selectedPriceOption = currentProduct.priceOptions[optionIndex];
                updateTotalPrice();
            } else {
                selectedPriceOption = null;
                updateTotalPrice();
            }
        });
    }

    // 장바구니 담기
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (event) => addToCart(event));
    }

    // 바로 구매
    const buyNowBtn = document.getElementById('buyNowBtn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', (event) => buyNow(event));
    }

    // 뒤로가기 버튼
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', goBackToList);
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

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item =>
        item.productId === currentProduct.id &&
        item.priceOptionIndex === currentProduct.priceOptions.indexOf(selectedPriceOption)
    );

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            productId: currentProduct.id,
            productName: currentProduct.name,
            priceOptionIndex: currentProduct.priceOptions.indexOf(selectedPriceOption),
            priceOption: selectedPriceOption,
            quantity: quantity,
            image: currentProduct.images?.[0]?.src || currentProduct.thumbnailUrl
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
    }, 800);
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
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .message { animation: slideIn 0.3s ease; }
            .skeleton .skeleton-line{display:block;height:10px;margin:6px 0;background:#eee;border-radius:4px}
            .skeleton .skeleton-line.w-20{width:20%}
            .skeleton .skeleton-line.w-30{width:30%}
            .skeleton .skeleton-line.w-50{width:50%}
            .skeleton .skeleton-line.w-60{width:60%}
            .skeleton .skeleton-line.w-70{width:70%}
            .skeleton .skeleton-line.w-80{width:80%}
            .skeleton .skeleton-line.w-90{width:90%}
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
