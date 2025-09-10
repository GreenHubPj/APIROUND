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
        window.location.href = `/region?region=${region}`;
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
    const productName = document.getElementById('productTitle').textContent;
    const productType = document.querySelector('.product-tag').textContent;
    const regionText = document.querySelectorAll('.product-tag')[1].textContent;
    const description = document.getElementById('descriptionText').textContent;
    const thumbnailUrl = document.getElementById('mainImage').src;
    const harvestSeason = document.getElementById('seasonInfo').textContent;
    
    // 상품 ID는 URL에서 가져오기
    const productId = getProductIdFromUrl();
    
    // 랜덤 가격 생성 (상품 타입에 따라 다른 가격대)
    const priceOptions = generateRandomPrices(productType);
    
    // 랜덤 업체 정보 생성
    const companyInfo = generateRandomCompany(regionText);
    
    return {
        id: parseInt(productId),
        name: productName,
        category: productType,
        region: regionText,
        description: description,
        thumbnailUrl: thumbnailUrl,
        harvestSeason: harvestSeason,
        priceOptions: priceOptions,
        companyInfo: companyInfo,
        // 기본 이미지 배열
        images: [
            { id: 1, src: thumbnailUrl, alt: productName }
        ]
    };
}

// 상품 타입에 따른 랜덤 가격 생성
function generateRandomPrices(productType) {
    const basePrices = {
        '농산물': { min: 5000, max: 15000 },
        '축산물': { min: 15000, max: 35000 },
        '수산물': { min: 10000, max: 25000 },
        '가공식품': { min: 3000, max: 12000 }
    };
    
    const priceRange = basePrices[productType] || { min: 5000, max: 20000 };
    
    // 랜덤 가격 생성
    const price1 = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    const price2 = Math.floor(price1 * 1.8); // 1.8배
    const price3 = Math.floor(price1 * 2.5); // 2.5배
    
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
    
    // 지역명에서 앞 2글자 추출
    const regionPrefix = regionText.substring(0, 2);
    
    // 랜덤 업체명 생성
    const randomName = companyNames[Math.floor(Math.random() * companyNames.length)];
    const randomSuffix = companySuffixes[Math.floor(Math.random() * companySuffixes.length)];
    const companyName = `${regionPrefix}${randomName}${randomSuffix}`;
    
    // 랜덤 전화번호 생성 (지역번호 기반)
    const areaCodes = {
        '서울': '02', '경기': '031', '인천': '032', '강원': '033',
        '충북': '043', '충남': '041', '대전': '042', '전북': '063',
        '전남': '061', '광주': '062', '경북': '054', '경남': '055',
        '대구': '053', '울산': '052', '부산': '051', '제주': '064'
    };
    
    const areaCode = areaCodes[regionPrefix] || '02';
    const phoneNumber = `${areaCode}-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
    
    // 랜덤 이메일 생성
    const emailDomains = ['naver.com', 'gmail.com', 'daum.net', 'coop.co.kr', 'farm.co.kr'];
    const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}@${randomDomain}`;
    
    return {
        name: companyName,
        phone: phoneNumber,
        email: email
    };
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
        ${currentProduct.origin ? `<span class="product-tag">${currentProduct.origin}</span>` : ''}
    `;

    // 가격 옵션
    renderPriceOptions();

    // 상품 상세 정보
    document.getElementById('stockInfo').textContent = currentProduct.stock ? `${currentProduct.stock}개` : '재고 없음';
    document.getElementById('originInfo').textContent = currentProduct.origin || '-';
    document.getElementById('expiryInfo').textContent = currentProduct.expiryDays ? `${currentProduct.expiryDays}일 이내 소모` : '-';
    document.getElementById('storageInfo').textContent = currentProduct.storageMethod || '-';
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

// 가격 옵션 렌더링
function renderPriceOptions() {
    const priceOptionsContainer = document.getElementById('priceOptions');
    const priceSelect = document.getElementById('priceOptionSelect');
    
    priceOptionsContainer.innerHTML = '';
    priceSelect.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';

    currentProduct.priceOptions.forEach((option, index) => {
        // 가격 옵션 카드
        const optionElement = document.createElement('div');
        optionElement.className = 'price-option';
        optionElement.innerHTML = `
            <span class="price-option-info">${option.quantity}${option.unit}</span>
            <span class="price-option-amount">${option.price.toLocaleString()}원</span>
        `;
        priceOptionsContainer.appendChild(optionElement);

        // 가격 옵션 셀렉트
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
    // 더미 리뷰 데이터 (더 많은 리뷰 추가)
    const allReviews = [
        {
            id: 1,
            reviewerName: '김사과',
            rating: 5,
            date: '2025-09-05',
            text: '정말 맛있는 사과였어요! 아삭하고 달콤한 맛이 일품입니다. 신선도도 최고고, 포장도 깔끔하게 잘 되어있었습니다. 다음에도 주문할 예정이에요!'
        },
        {
            id: 2,
            reviewerName: '이과일',
            rating: 4,
            date: '2025-09-03',
            text: '품질이 좋네요. 크기도 적당하고 맛도 달콤합니다. 배송도 빠르게 왔어요. 추천합니다!'
        },
        {
            id: 3,
            reviewerName: '박농부',
            rating: 5,
            date: '2025-09-01',
            text: '문경 사과의 진짜 맛을 느낄 수 있었습니다. 아삭한 식감과 달콤한 맛이 정말 좋아요. 가족들이 모두 만족했어요.'
        },
        {
            id: 4,
            reviewerName: '최고객',
            rating: 4,
            date: '2025-08-28',
            text: '신선하고 맛있어요. 포장 상태도 좋고, 배송도 빠르게 왔습니다. 다음에도 주문하겠습니다.'
        },
        {
            id: 5,
            reviewerName: '정맛있',
            rating: 5,
            date: '2025-08-25',
            text: '사과가 정말 크고 맛있어요! 아이들이 너무 좋아합니다. 다음에도 꼭 주문할게요.'
        },
        {
            id: 6,
            reviewerName: '홍사과',
            rating: 4,
            date: '2025-08-22',
            text: '품질이 우수하고 신선해요. 배송도 빠르고 포장도 깔끔했습니다.'
        },
        {
            id: 7,
            reviewerName: '김달콤',
            rating: 5,
            date: '2025-08-20',
            text: '달콤하고 아삭한 맛이 정말 좋아요! 가족 모두 만족했습니다.'
        }
    ];
    
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
