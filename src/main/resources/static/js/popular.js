document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 인기 특산품 페이지가 로드되었습니다.');

    // 가격 옵션 클릭 이벤트
    const priceOptions = document.querySelectorAll('.price-option');
    priceOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 같은 상품의 다른 옵션들에서 선택 상태 제거
            const productCard = this.closest('.product-card');
            const productOptions = productCard.querySelectorAll('.price-option');
            productOptions.forEach(opt => opt.classList.remove('selected'));
            
            // 클릭된 옵션에 선택 상태 추가
            this.classList.add('selected');
            
            const priceLabel = this.querySelector('.price-label').textContent;
            const priceAmount = this.querySelector('.price-amount').textContent;
            const productTitle = productCard.querySelector('.product-title').textContent;
            
            console.log(`${productTitle} ${priceLabel} ${priceAmount} 선택됨`);
        });
    });

    // 요리법 태그 클릭 이벤트
    const recipeTags = document.querySelectorAll('.recipe-tag');
    recipeTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const recipeName = this.textContent;
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            
            console.log(`${productTitle}의 ${recipeName} 요리법을 확인합니다.`);
            alert(`${productTitle}의 ${recipeName} 요리법을 보여드립니다!`);
            
            // 요리법 페이지로 이동하거나 모달 표시
            // window.location.href = `/recipes?product=${encodeURIComponent(productTitle)}&recipe=${encodeURIComponent(recipeName)}`;
        });
    });

    // 업체 정보 클릭 이벤트
    const companyInfos = document.querySelectorAll('.company-info');
    companyInfos.forEach(info => {
        info.addEventListener('click', function() {
            const companyName = this.querySelector('.company-name').textContent;
            const phone = this.querySelector('.company-phone').textContent;
            const email = this.querySelector('.company-email').textContent;
            
            console.log(`업체 연락: ${companyName}`);
            
            // 연락처 정보 표시
            const contactInfo = `
업체명: ${companyName}
전화번호: ${phone}
이메일: ${email}

연락하시겠습니까?
            `;
            
            if (confirm(contactInfo)) {
                // 실제 연락 로직 (전화 걸기, 이메일 보내기 등)
                alert('연락처 정보가 복사되었습니다.');
            }
        });
        
        // 호버 효과
        info.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f8ff';
            this.style.cursor = 'pointer';
        });
        
        info.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '#f8f9fa';
        });
    });

    // 상품 상태 배지 클릭 이벤트
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        badge.addEventListener('click', function() {
            const status = this.textContent;
            const productCard = this.closest('.product-card');
            const productTitle = productCard.querySelector('.product-title').textContent;
            
            if (status === '품절대란!!!') {
                alert(`${productTitle}은 현재 품절입니다.\n재입고 알림을 신청하시겠습니까?`);
            } else if (status === '재고부족') {
                alert(`${productTitle}의 재고가 부족합니다.\n빠른 시일 내에 주문하시기 바랍니다.`);
            } else if (status === '재고있음') {
                alert(`${productTitle}은 현재 구매 가능합니다!`);
            }
        });
    });

    // 인기 순위 아이템 클릭 이벤트
    const trendItems = document.querySelectorAll('.trend-item');
    trendItems.forEach(item => {
        item.addEventListener('click', function() {
            const productName = this.querySelector('.product-name').textContent;
            const rank = this.querySelector('.rank').textContent;
            const trendIcon = this.querySelector('.trend-icon');
            
            let trendText = '';
            if (trendIcon.classList.contains('up')) {
                trendText = '상승';
            } else if (trendIcon.classList.contains('down')) {
                trendText = '하락';
            } else {
                trendText = '유지';
            }
            
            console.log(`${productName} (${rank}위, ${trendText}) 클릭됨`);
            alert(`${productName}이 ${rank}위입니다!\n트렌드: ${trendText}`);
            
            // 해당 상품으로 스크롤
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                const title = card.querySelector('.product-title').textContent;
                if (title.includes(productName) || productName.includes(title.split(' ')[0])) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.border = '3px solid #FF6B35';
                    setTimeout(() => {
                        card.style.border = 'none';
                    }, 2000);
                }
            });
        });
    });

    // 상품 카드 호버 효과
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });


    // 페이지 로드 애니메이션
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });

    // 인기 순위 바 애니메이션
    const trendItems = document.querySelectorAll('.trend-item');
    trendItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 500 + (index * 100));
    });
});
