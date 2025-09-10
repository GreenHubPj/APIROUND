// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    loadProductInfo();
    loadAllReviews();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', goBackToProduct);
    }
}

// 상품 정보 로드
function loadProductInfo() {
    const productId = localStorage.getItem('currentProductId');
    
    const products = [
        {
            id: 1,
            name: '경북 사과',
            category: '과일',
            region: '경북',
            tags: ['신선', '달콤', '아삭'],
            images: [{ src: 'https://via.placeholder.com/80x80/ff8c42/ffffff?text=경북+사과', alt: '경북 사과' }]
        },
        {
            id: 2,
            name: '제주 감귤',
            category: '과일',
            region: '제주',
            tags: ['신선', '달콤', '비타민'],
            images: [{ src: 'https://via.placeholder.com/80x80/ff8c42/ffffff?text=제주+감귤', alt: '제주 감귤' }]
        },
        {
            id: 3,
            name: '경북 사과',
            category: '과일',
            region: '경북',
            tags: ['신선', '달콤', '아삭'],
            images: [{ src: 'https://via.placeholder.com/80x80/ff8c42/ffffff?text=경북+사과', alt: '경북 사과' }]
        }
    ];
    
    const product = products.find(p => p.id == productId) || products[0];
    
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productImage').src = product.images[0].src;
    document.getElementById('productImage').alt = product.images[0].alt;
    
    const tagsContainer = document.getElementById('productTags');
    tagsContainer.innerHTML = '';
    product.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'product-tag';
        tagElement.textContent = tag;
        tagsContainer.appendChild(tagElement);
    });
}

// 전체 리뷰 로드
function loadAllReviews() {
    const allReviewsData = localStorage.getItem('allReviews');
    
    if (allReviewsData) {
        const allReviews = JSON.parse(allReviewsData);
        renderAllReviews(allReviews);
        updateReviewStats(allReviews);
    } else {
        const defaultReviews = [
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
        
        renderAllReviews(defaultReviews);
        updateReviewStats(defaultReviews);
    }
}

// 전체 리뷰 렌더링
function renderAllReviews(reviews) {
    const reviewList = document.getElementById('reviewList');
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

// 리뷰 통계 업데이트
function updateReviewStats(reviews) {
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / totalReviews).toFixed(1);
    
    document.getElementById('averageRating').textContent = averageRating;
    document.getElementById('totalReviewCount').textContent = totalReviews;
    
    const averageStars = Math.round(averageRating);
    const starsContainer = document.getElementById('averageStars');
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.textContent = i < averageStars ? '★' : '☆';
        starsContainer.appendChild(star);
    }
    
    const ratingDistribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
        ratingDistribution[review.rating - 1]++;
    });
    
    const ratingBars = document.querySelectorAll('.rating-bar');
    ratingBars.forEach((bar, index) => {
        const count = ratingDistribution[4 - index];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        
        const barFill = bar.querySelector('.bar-fill');
        const ratingCount = bar.querySelector('.rating-count');
        
        barFill.style.width = `${percentage}%`;
        ratingCount.textContent = count;
    });
}

// 상품 상세로 돌아가기
function goBackToProduct() {
    const productId = localStorage.getItem('currentProductId');
    if (productId) {
        window.location.href = `/region-detail?id=${productId}`;
    } else {
        window.location.href = '/region';
    }
}