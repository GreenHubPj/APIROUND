document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 장바구니 페이지가 로드되었습니다.');

    // DOM 요소들
    const cartItems = document.querySelectorAll('.cart-item');
    const totalQuantityElement = document.getElementById('totalQuantity');
    const totalAmountElement = document.getElementById('totalAmount');
    const orderBtn = document.getElementById('orderBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // 장바구니 데이터 (실제로는 서버에서 가져올 데이터)
    let cartData = [
        { id: 1, name: '[지금이 제철] 문경 사과', price: 9900, quantity: 1, image: '/images/인기 사과.jpg' },
        { id: 2, name: '[지금이 제철] 고흥 돼지', price: 9900, quantity: 1, image: '/images/인기 돼지.jpg' },
        { id: 3, name: '[지금이 제철] 고흥 돼지', price: 9900, quantity: 1, image: '/images/인기 돼지.jpg' }
    ];

    // 초기화
    initializeCart();

    // 장바구니 초기화
    function initializeCart() {
        updateCartSummary();
        addEventListeners();
    }

    // 이벤트 리스너 추가
    function addEventListeners() {
        // 수량 조절 버튼들
        cartItems.forEach(item => {
            const minusBtn = item.querySelector('.minus-btn');
            const plusBtn = item.querySelector('.plus-btn');
            const deleteBtn = item.querySelector('.delete-btn');
            const pinBtn = item.querySelector('.pin-btn');

            minusBtn.addEventListener('click', () => decreaseQuantity(item));
            plusBtn.addEventListener('click', () => increaseQuantity(item));
            deleteBtn.addEventListener('click', () => removeItem(item));
            pinBtn.addEventListener('click', () => togglePin(item));
        });

        // 주문하기 버튼
        orderBtn.addEventListener('click', handleOrder);
        
        // 전체삭제 버튼
        clearAllBtn.addEventListener('click', handleClearAll);
    }

    // 수량 증가
    function increaseQuantity(item) {
        const productId = parseInt(item.getAttribute('data-product-id'));
        const quantityElement = item.querySelector('.quantity');
        const currentQuantity = parseInt(quantityElement.textContent);
        const plusBtn = item.querySelector('.plus-btn');
        
        // 최대 수량 제한 (예: 10개)
        if (currentQuantity < 10) {
            const newQuantity = currentQuantity + 1;
            quantityElement.textContent = newQuantity;
            
            // 데이터 업데이트
            const itemData = cartData.find(data => data.id === productId);
            if (itemData) {
                itemData.quantity = newQuantity;
            }
            
            updateItemPrice(item);
            updateCartSummary();
            showQuantityChangeAnimation(item, '+');
        } else {
            showMessage('최대 주문 수량은 10개입니다.', 'warning', plusBtn);
        }
    }

    // 수량 감소
    function decreaseQuantity(item) {
        const productId = parseInt(item.getAttribute('data-product-id'));
        const quantityElement = item.querySelector('.quantity');
        const currentQuantity = parseInt(quantityElement.textContent);
        const minusBtn = item.querySelector('.minus-btn');
        
        if (currentQuantity > 1) {
            const newQuantity = currentQuantity - 1;
            quantityElement.textContent = newQuantity;
            
            // 데이터 업데이트
            const itemData = cartData.find(data => data.id === productId);
            if (itemData) {
                itemData.quantity = newQuantity;
            }
            
            updateItemPrice(item);
            updateCartSummary();
            showQuantityChangeAnimation(item, '-');
        } else {
            // 수량이 1일 때는 삭제 확인
            if (confirm('상품을 장바구니에서 제거하시겠습니까?')) {
                removeItem(item);
            }
        }
    }

    // 아이템 가격 업데이트
    function updateItemPrice(item) {
        const productId = parseInt(item.getAttribute('data-product-id'));
        const quantityElement = item.querySelector('.quantity');
        const priceElement = item.querySelector('.item-price');
        
        const itemData = cartData.find(data => data.id === productId);
        if (itemData) {
            const totalPrice = itemData.price * itemData.quantity;
            priceElement.textContent = formatPrice(totalPrice);
        }
    }

    // 아이템 삭제
    function removeItem(item) {
        const pinBtn = item.querySelector('.pin-btn');
        const deleteBtn = item.querySelector('.delete-btn');
        
        // 고정된 아이템은 삭제할 수 없음
        if (pinBtn.classList.contains('pinned')) {
            showMessage('고정된 상품은 삭제할 수 없습니다. 고정을 해제한 후 다시 시도해주세요.', 'warning', deleteBtn);
            return;
        }
        
        const productId = parseInt(item.getAttribute('data-product-id'));
        
        // 애니메이션 효과
        item.style.transition = 'all 0.3s ease';
        item.style.transform = 'translateX(-100%)';
        item.style.opacity = '0';
        
        setTimeout(() => {
            // 데이터에서 제거
            cartData = cartData.filter(data => data.id !== productId);
            
            // DOM에서 제거
            item.remove();
            
            // 장바구니 요약 업데이트
            updateCartSummary();
            
            // 빈 장바구니 체크
            checkEmptyCart();
            
            showMessage('상품이 장바구니에서 제거되었습니다.', 'success');
        }, 300);
    }

    // 고정하기 토글
    function togglePin(item) {
        const pinBtn = item.querySelector('.pin-btn');
        const pinIcon = pinBtn.querySelector('.pin-icon');
        const deleteBtn = item.querySelector('.delete-btn');
        
        if (pinBtn.classList.contains('pinned')) {
            // 고정 해제
            pinBtn.classList.remove('pinned');
            pinIcon.textContent = '📌';
            pinBtn.style.background = '#f8f9fa';
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
            deleteBtn.style.cursor = 'pointer';
            showMessage('고정이 해제되었습니다. 삭제할 수 있습니다.', 'info', pinBtn);
        } else {
            // 고정 설정
            pinBtn.classList.add('pinned');
            pinIcon.textContent = '📍';
            pinBtn.style.background = '#fff3cd';
            deleteBtn.disabled = true;
            deleteBtn.style.opacity = '0.5';
            deleteBtn.style.cursor = 'not-allowed';
            showMessage('상품이 고정되었습니다. 삭제할 수 없습니다.', 'success', pinBtn);
        }
    }

    // 장바구니 요약 업데이트
    function updateCartSummary() {
        const totalQuantity = cartData.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        totalQuantityElement.textContent = `${totalQuantity}개`;
        totalAmountElement.textContent = formatPrice(totalAmount);
        
        // 주문 버튼 활성화/비활성화
        if (totalQuantity > 0) {
            orderBtn.disabled = false;
            orderBtn.style.opacity = '1';
            orderBtn.style.cursor = 'pointer';
        } else {
            orderBtn.disabled = true;
            orderBtn.style.opacity = '0.5';
            orderBtn.style.cursor = 'not-allowed';
        }
        
        // 전체삭제 버튼 활성화/비활성화
        if (totalQuantity > 0) {
            clearAllBtn.disabled = false;
            clearAllBtn.style.opacity = '1';
            clearAllBtn.style.cursor = 'pointer';
        } else {
            clearAllBtn.disabled = true;
            clearAllBtn.style.opacity = '0.5';
            clearAllBtn.style.cursor = 'not-allowed';
        }
    }

    // 빈 장바구니 체크
    function checkEmptyCart() {
        if (cartData.length === 0) {
            showEmptyCart();
        }
    }

    // 빈 장바구니 표시
    function showEmptyCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2>장바구니가 비어있습니다</h2>
                <p>신선한 농산물을 장바구니에 담아보세요!</p>
                <a href="/region" class="shop-now-btn">쇼핑하러 가기</a>
            </div>
        `;
        
        // 주문 요약 숨기기
        document.querySelector('.order-summary').style.display = 'none';
    }

    // 주문 처리
    function handleOrder() {
        if (cartData.length === 0) {
            showMessage('장바구니가 비어있습니다.', 'warning');
            return;
        }
        
        const totalQuantity = cartData.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        if (confirm(`총 ${totalQuantity}개의 상품을 주문하시겠습니까?\n총 금액: ${formatPrice(totalAmount)}`)) {
            // 실제로는 서버로 주문 데이터 전송
            processOrder();
        }
    }

    // 주문 처리 (실제 구현)
    function processOrder() {
        // 로딩 상태 표시
        orderBtn.textContent = '주문 처리 중...';
        orderBtn.disabled = true;
        
        // 실제로는 서버 API 호출
        setTimeout(() => {
            showMessage('주문이 완료되었습니다!', 'success');
            
            // 장바구니 비우기
            cartData = [];
            document.getElementById('cartItems').innerHTML = '';
            updateCartSummary();
            showEmptyCart();
            
            // 버튼 원상복구
            orderBtn.textContent = '주문하기';
            orderBtn.disabled = false;
            
            // 주문 완료 페이지로 이동 (선택사항)
            // window.location.href = '/order-complete';
        }, 2000);
    }

    // 전체삭제 처리
    function handleClearAll() {
        if (cartData.length === 0) {
            showMessage('삭제할 상품이 없습니다.', 'warning');
            return;
        }
        
        // 고정된 아이템이 있는지 확인
        const pinnedItems = document.querySelectorAll('.cart-item .pin-btn.pinned');
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        
        if (pinnedItems.length > 0) {
            showMessage(`고정된 상품이 ${pinnedItems.length}개 있습니다. 고정된 상품은 삭제되지 않습니다.`, 'warning');
        }
        
        if (confirm(`장바구니의 모든 상품(${totalItems}개)을 삭제하시겠습니까?\n고정된 상품은 삭제되지 않습니다.\n이 작업은 되돌릴 수 없습니다.`)) {
            clearAllItems();
        }
    }

    // 전체 아이템 삭제
    function clearAllItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        const items = cartItemsContainer.querySelectorAll('.cart-item');
        let deletedCount = 0;
        
        // 고정되지 않은 아이템만 삭제
        items.forEach((item, index) => {
            const pinBtn = item.querySelector('.pin-btn');
            
            // 고정된 아이템은 건너뛰기
            if (pinBtn.classList.contains('pinned')) {
                return;
            }
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.transform = 'translateX(-100%)';
                item.style.opacity = '0';
                
                setTimeout(() => {
                    const productId = parseInt(item.getAttribute('data-product-id'));
                    // 데이터에서 제거
                    cartData = cartData.filter(data => data.id !== productId);
                    item.remove();
                    deletedCount++;
                }, 300);
            }, deletedCount * 100);
        });
        
        // 요약 업데이트
        setTimeout(() => {
            updateCartSummary();
            
            if (cartData.length === 0) {
                showEmptyCart();
                showMessage('모든 상품이 삭제되었습니다.', 'success');
            } else {
                showMessage(`고정되지 않은 상품이 삭제되었습니다. (고정된 상품 ${cartData.length}개 남음)`, 'info');
            }
        }, deletedCount * 100 + 500);
    }

    // 수량 변경 애니메이션
    function showQuantityChangeAnimation(item, type) {
        const quantityElement = item.querySelector('.quantity');
        quantityElement.style.transform = 'scale(1.2)';
        quantityElement.style.color = type === '+' ? '#4CAF50' : '#ff6b35';
        
        setTimeout(() => {
            quantityElement.style.transform = 'scale(1)';
            quantityElement.style.color = '#333';
        }, 200);
    }

    // 메시지 표시 (버튼 근처에 표시)
    function showMessage(message, type = 'info', targetElement = null) {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.cart-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageElement = document.createElement('div');
        messageElement.className = `cart-message cart-message-${type}`;
        messageElement.textContent = message;
        
        // 타입별 색상
        const colors = {
            success: '#4CAF50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196F3'
        };
        
        // 기본 스타일
        messageElement.style.cssText = `
            position: absolute;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInUp 0.3s ease-out;
            max-width: 250px;
            word-wrap: break-word;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            pointer-events: none;
        `;
        
        messageElement.style.background = colors[type] || colors.info;
        
        // 타겟 요소가 있으면 그 근처에 표시, 없으면 기본 위치
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // 버튼 위쪽에 표시
            messageElement.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
            messageElement.style.top = (rect.top + scrollTop - 50) + 'px';
            messageElement.style.transform = 'translateX(-50%)';
            
            // 화면 밖으로 나가지 않도록 조정
            const messageRect = messageElement.getBoundingClientRect();
            if (rect.left < 125) {
                messageElement.style.left = '125px';
                messageElement.style.transform = 'none';
            } else if (rect.right > window.innerWidth - 125) {
                messageElement.style.left = (window.innerWidth - 125) + 'px';
                messageElement.style.transform = 'none';
            }
        } else {
            // 기본 위치 (화면 중앙 상단)
            messageElement.style.cssText += `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                animation: slideInDown 0.3s ease-out;
            `;
        }
        
        // DOM에 추가
        document.body.appendChild(messageElement);
        
        // 3초 후 제거
        setTimeout(() => {
            messageElement.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);
        }, 3000);
    }

    // 가격 포맷팅
    function formatPrice(price) {
        return new Intl.NumberFormat('ko-KR').format(price) + ' 원';
    }

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInDown {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-20px);
                opacity: 0;
            }
        }
        
        .pinned {
            background: #fff3cd !important;
        }
        
        .pinned .pin-icon {
            color: #ff6b35;
        }
    `;
    document.head.appendChild(style);

    // 페이지 로드 완료 메시지
    console.log('장바구니 페이지 초기화 완료');
});
