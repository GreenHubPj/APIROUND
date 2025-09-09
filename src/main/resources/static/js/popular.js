document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 인기 특산품 페이지가 로드되었습니다.');

    // 페이징 관련 변수
    const itemsPerPage = 5; // 한 페이지에 표시할 상품 수
    let displayedCount = 0; // 현재 표시된 상품 수
    const productCards = document.querySelectorAll('.product-card');
    
    console.log('총 상품 카드 수:', productCards.length);

    // 다음 상품들을 표시하는 함수
    function showNextProducts() {
        // 현재 표시된 수부터 itemsPerPage만큼 더 표시
        const endIndex = Math.min(displayedCount + itemsPerPage, productCards.length);
        
        console.log('표시할 상품 범위:', displayedCount, '~', endIndex);
        
        for (let i = displayedCount; i < endIndex; i++) {
            productCards[i].classList.remove('hidden');
            console.log('상품', i, '표시됨');
        }
        
        displayedCount = endIndex;
        
        console.log('현재 표시된 상품 수:', displayedCount);
        
        // 더 표시할 상품이 있는지 반환
        return displayedCount < productCards.length;
    }
    
    // 더보기 버튼 상태 업데이트
    function updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) {
            console.log('더보기 버튼을 찾을 수 없습니다');
            return;
        }
        
        console.log('더보기 버튼 상태 업데이트:', displayedCount, '/', productCards.length);
        
        // 모든 상품이 표시되었으면 더보기 버튼 숨김
        if (displayedCount >= productCards.length) {
            loadMoreBtn.style.display = 'none';
            console.log('더보기 버튼 숨김');
        } else {
            loadMoreBtn.style.display = 'block';
            console.log('더보기 버튼 표시');
        }
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.product-card:not(.hidden)');
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // 더보기 버튼 클릭 이벤트
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            console.log('더보기 버튼 클릭');
            const hasMore = showNextProducts();
            updateLoadMoreButton();
            if (!hasMore) {
                showNoMoreProductsMessage();
            }
            animateVisibleCards();
        });
    }

    // 더 이상 상품이 없을 때 메시지 표시
    function showNoMoreProductsMessage() {
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.innerHTML = `
                <div class="no-more-products-message">
                    <p>더 이상 표시할 상품이 없습니다.</p>
                    <p>새로운 상품을 추가해주세요!</p>
                </div>
            `;
        }
    }

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
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 장바구니 버튼 클릭 이벤트
    const cartButtons = document.querySelectorAll('.btn-cart');
    cartButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            
            // 가격 옵션 선택 확인
            const productCard = this.closest('.product-card');
            const selectedOption = productCard.querySelector('.price-option.selected');
            
            if (!selectedOption) {
                showMessage('가격 옵션을 선택해주세요.', 'warning', this);
                return;
            }
            
            const priceLabel = selectedOption.querySelector('.price-label').textContent;
            const priceAmount = selectedOption.querySelector('.price-amount').textContent;
            
            // 장바구니에 추가
            addToCart(productId, productName, priceLabel, priceAmount);
            showMessage(`${productName}이 장바구니에 추가되었습니다!`, 'success', this);
        });
    });

    // 구매하기 버튼 클릭 이벤트
    const buyButtons = document.querySelectorAll('.btn-buy');
    buyButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            const productId = this.getAttribute('data-product-id');
            const productName = this.getAttribute('data-product-name');
            
            // 가격 옵션 선택 확인
            const productCard = this.closest('.product-card');
            const selectedOption = productCard.querySelector('.price-option.selected');
            
            if (!selectedOption) {
                showMessage('가격 옵션을 선택해주세요.', 'warning', this);
                return;
            }
            
            const priceLabel = selectedOption.querySelector('.price-label').textContent;
            const priceAmount = selectedOption.querySelector('.price-amount').textContent;
            
            // 구매 페이지로 이동
            buyNow(productId, productName, priceLabel, priceAmount);
        });
    });

    // 장바구니에 상품 추가 함수
    function addToCart(productId, productName, priceLabel, priceAmount) {
        const cartItem = {
            id: productId,
            name: productName,
            quantity: priceLabel,
            price: priceAmount,
            timestamp: new Date().toISOString()
        };
        
        // localStorage에서 기존 장바구니 가져오기
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // 중복 상품 확인
        const existingItem = cart.find(item => item.id === productId && item.quantity === priceLabel);
        if (existingItem) {
            existingItem.count = (existingItem.count || 1) + 1;
        } else {
            cartItem.count = 1;
            cart.push(cartItem);
        }
        
        // localStorage에 저장
        localStorage.setItem('cart', JSON.stringify(cart));
        
        console.log('장바구니에 추가됨:', cartItem);
    }

    // 구매하기 함수
    function buyNow(productId, productName, priceLabel, priceAmount) {
        const orderItem = {
            id: productId,
            name: productName,
            quantity: priceLabel,
            price: priceAmount,
            timestamp: new Date().toISOString()
        };
        
        // 주문 정보를 localStorage에 저장
        localStorage.setItem('currentOrder', JSON.stringify([orderItem]));
        
        // 구매 페이지로 이동
        window.location.href = '/buying';
    }

    // 메시지 표시 함수
    function showMessage(message, type, targetElement) {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.action-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = `action-message ${type}`;
        messageDiv.textContent = message;
        
        // 스타일 적용
        messageDiv.style.cssText = `
            position: fixed;
            z-index: 1000;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        
        // 타입별 스타일
        if (type === 'success') {
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'warning') {
            messageDiv.style.background = '#fff3cd';
            messageDiv.style.color = '#856404';
            messageDiv.style.border = '1px solid #ffeaa7';
        }
        
        // 위치 계산
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            messageDiv.style.left = `${rect.left}px`;
            messageDiv.style.top = `${rect.top - 50}px`;
        } else {
            messageDiv.style.left = '50%';
            messageDiv.style.top = '20px';
            messageDiv.style.transform = 'translateX(-50%)';
        }
        
        // DOM에 추가
        document.body.appendChild(messageDiv);
        
        // 3초 후 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }


    // 초기 로드 시 페이징 적용
    // 모든 상품을 숨김
    productCards.forEach(card => {
        card.classList.add('hidden');
    });
    
    // 처음 5개 상품만 표시
    showNextProducts();
    updateLoadMoreButton();
    animateVisibleCards();

    // 인기 순위 바 애니메이션
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
