// 장바구니 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 장바구니 데이터 관리
    function getCartItems() {
        const cartData = localStorage.getItem('shoppingCart');
        return cartData ? JSON.parse(cartData) : [];
    }

    function saveCartItems(items) {
        localStorage.setItem('shoppingCart', JSON.stringify(items));
    }

    function addToCart(product) {
        const cartItems = getCartItems();
        const existingItem = cartItems.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                unit: product.unit,
                total: product.total,
                image: product.image || '/images/default-product.jpg'
            });
        }
        
        saveCartItems(cartItems);
        return cartItems;
    }

    // 전역 함수로 등록
    window.addToCart = addToCart;

    // 상품 데이터
    const products = {
        1: { name: '제철 당근', price: 6000, quantity: 5, unit: 'kg', total: 30000 },
        2: { name: '문경 사과', price: 12000, quantity: 1, unit: 'kg', total: 12000 },
        3: { name: '포도잼', price: 8000, quantity: 2, unit: '개', total: 16000 }
    };

    // DOM 요소들
    const selectAllCheckbox = document.getElementById('selectAll');
    const itemCheckboxes = document.querySelectorAll('.item-check');
    const deleteSelectedBtn = document.getElementById('deleteSelected');
    const deleteCountSpan = document.querySelector('.delete-count');
    const totalItemsSpan = document.getElementById('totalItems');
    const totalAmountSpan = document.getElementById('totalAmount');
    const finalOrderBtn = document.getElementById('finalOrderBtn');

    // 전체선택 체크박스 이벤트
    selectAllCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        itemCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        updateDeleteButton();
        updateOrderSummary();
    });

    // 개별 상품 체크박스 이벤트
    itemCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectAllState();
            updateDeleteButton();
            updateOrderSummary();
        });
    });

    // 선택삭제 버튼 이벤트
    deleteSelectedBtn.addEventListener('click', function() {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            alert('삭제할 상품을 선택해주세요.');
            return;
        }

        if (confirm(`선택한 ${selectedItems.length}개 상품을 삭제하시겠습니까?`)) {
            deleteSelectedItems(selectedItems);
        }
    });

    // 주문수정 버튼 이벤트
    document.querySelectorAll('.modify-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-product-id');
            showModifyModal(productId);
        });
    });

    // 개별 주문하기 버튼 이벤트
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            const productId = cartItem.getAttribute('data-product-id');
            const product = products[productId];
            
            if (confirm(`${product.name}을(를) 주문하시겠습니까?`)) {
                alert('주문이 완료되었습니다!');
                // 실제 구현 시 주문 처리 로직
            }
        });
    });

    // 최종 주문하기 버튼 이벤트
    finalOrderBtn.addEventListener('click', function() {
        const selectedItems = getSelectedItems();
        if (selectedItems.length === 0) {
            alert('주문할 상품을 선택해주세요.');
            return;
        }

        const totalAmount = calculateTotalAmount(selectedItems);
        if (confirm(`선택한 ${selectedItems.length}개 상품을 총 ${totalAmount.toLocaleString()}원에 주문하시겠습니까?`)) {
            alert('주문이 완료되었습니다!');
            // 실제 구현 시 주문 처리 로직
        }
    });

    // 전체선택 상태 업데이트
    function updateSelectAllState() {
        const checkedCount = document.querySelectorAll('.item-check:checked').length;
        const totalCount = itemCheckboxes.length;
        
        selectAllCheckbox.checked = checkedCount === totalCount;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
    }

    // 삭제 버튼 업데이트
    function updateDeleteButton() {
        const selectedCount = document.querySelectorAll('.item-check:checked').length;
        deleteCountSpan.textContent = selectedCount;
        
        if (selectedCount > 0) {
            deleteSelectedBtn.style.display = 'block';
        } else {
            deleteSelectedBtn.style.display = 'none';
        }
    }

    // 주문 요약 업데이트
    function updateOrderSummary() {
        const selectedItems = getSelectedItems();
        const totalItems = selectedItems.length;
        const totalAmount = calculateTotalAmount(selectedItems);

        totalItemsSpan.textContent = totalItems;
        totalAmountSpan.textContent = totalAmount.toLocaleString();

        // 최종 주문 버튼 활성화/비활성화
        finalOrderBtn.disabled = totalItems === 0;
    }

    // 선택된 상품들 가져오기
    function getSelectedItems() {
        const selectedItems = [];
        const cartItems = getCartItems();
        const checkedBoxes = document.querySelectorAll('.item-check:checked');
        
        checkedBoxes.forEach(checkbox => {
            const itemId = checkbox.getAttribute('data-id');
            const item = cartItems.find(cartItem => cartItem.id === itemId);
            if (item) {
                selectedItems.push(item);
            }
        });
        return selectedItems;
    }

    // 총 금액 계산
    function calculateTotalAmount(selectedItems) {
        return selectedItems.reduce((total, item) => {
            return total + item.total;
        }, 0);
    }

    // 선택된 상품들 삭제
    function deleteSelectedItems(selectedItems) {
        const cartItems = getCartItems();
        const filteredItems = cartItems.filter(item => 
            !selectedItems.some(selectedItem => selectedItem.id === item.id)
        );
        saveCartItems(filteredItems);
        renderCartItems();
        updateOrderSummary();
    }

    // 주문수정 모달 표시
    function showModifyModal(productId) {
        const product = products[productId];
        const newQuantity = prompt(`${product.name}의 수량을 입력해주세요. (현재: ${product.quantity}${product.unit})`, product.quantity);
        
        if (newQuantity !== null && newQuantity !== '') {
            const quantity = parseInt(newQuantity);
            if (quantity > 0) {
                updateProductQuantity(productId, quantity);
            } else {
                alert('수량은 1 이상이어야 합니다.');
            }
        }
    }

    // 상품 수량 업데이트
    function updateProductQuantity(productId, newQuantity) {
        const product = products[productId];
        product.quantity = newQuantity;
        product.total = product.price * newQuantity;

        // UI 업데이트
        const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
        const quantityValue = cartItem.querySelector('.quantity-value');
        const priceValue = cartItem.querySelector('.price-value');

        quantityValue.textContent = `${newQuantity}${product.unit}`;
        priceValue.textContent = `${product.total.toLocaleString()}원`;

        // 주문 요약 업데이트
        updateOrderSummary();
    }

    // 장바구니 아이템 렌더링
    function renderCartItems() {
        const cartItems = getCartItems();
        const cartContainer = document.querySelector('.cart-items');
        
        if (!cartContainer) return;
        
        if (cartItems.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-icon">🛒</div>
                    <h3>장바구니가 비어있습니다</h3>
                    <p>상품을 추가해보세요!</p>
                    <button onclick="window.location.href='/'" class="shop-btn">쇼핑하러 가기</button>
                </div>
            `;
            return;
        }
        
        cartContainer.innerHTML = cartItems.map((item, index) => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="item-checkbox">
                    <input type="checkbox" class="item-check" data-product-id="${item.id}">
                </div>
                <div class="item-info">
                    <div class="seller-info">
                        <span class="seller-icon">🏠</span>
                        <span class="seller-name">GreenHub</span>
                    </div>
                    <div class="product-details">
                        <img src="${item.image}" alt="${item.name}" class="product-image">
                        <div class="product-info">
                            <h3 class="product-name">${item.name}</h3>
                            <p class="product-description">신선한 농산물을 만나보세요.</p>
                            <div class="product-price">${item.price.toLocaleString()}원/${item.unit}</div>
                            <div class="product-origin">
                                <span class="origin-badge">국내산</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="item-quantity">
                    <div class="quantity-info">
                        <span class="quantity-label">상품 주문수량 :</span>
                        <span class="quantity-value">${item.quantity}${item.unit}</span>
                    </div>
                    <button class="modify-order-btn" onclick="modifyOrder('${item.id}')">주문수정</button>
                </div>
                <div class="item-total">
                    <div class="total-price">
                        <span class="price-label">상품 금액</span>
                        <span class="price-value">${item.total.toLocaleString()}원</span>
                    </div>
                    <button class="order-btn" onclick="orderItem('${item.id}')">주문하기</button>
                </div>
            </div>
        `).join('');
        
        // 이벤트 리스너 재등록
        const newItemCheckboxes = document.querySelectorAll('.item-check');
        newItemCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateSelectAllState();
                updateDeleteButton();
                updateOrderSummary();
            });
        });
    }

    // 수량 변경 함수
    window.changeQuantity = function(itemId, change) {
        const cartItems = getCartItems();
        const item = cartItems.find(item => item.id === itemId);
        
        if (item) {
            item.quantity += change;
            if (item.quantity < 1) {
                item.quantity = 1;
            }
            item.total = item.quantity * item.price;
            saveCartItems(cartItems);
            renderCartItems();
            updateOrderSummary();
        }
    };

    // 아이템 삭제 함수
    window.deleteItem = function(itemId) {
        if (confirm('이 상품을 삭제하시겠습니까?')) {
            const cartItems = getCartItems();
            const filteredItems = cartItems.filter(item => item.id !== itemId);
            saveCartItems(filteredItems);
            renderCartItems();
            updateOrderSummary();
        }
    };

    // 주문 수정 함수
    window.modifyOrder = function(itemId) {
        alert('주문 수정 기능은 준비 중입니다.');
    };

    // 개별 상품 주문 함수
    window.orderItem = function(itemId) {
        const cartItems = getCartItems();
        const item = cartItems.find(item => item.id === itemId);
        
        if (item) {
            if (confirm(`${item.name}을(를) 주문하시겠습니까?`)) {
                alert('주문이 완료되었습니다!');
                // 주문 완료 후 해당 상품을 장바구니에서 제거
                const filteredItems = cartItems.filter(cartItem => cartItem.id !== itemId);
                saveCartItems(filteredItems);
                renderCartItems();
                updateOrderSummary();
            }
        }
    };

    // 초기화
    function initialize() {
        // HTML에 하드코딩된 상품이 있는지 확인
        const existingItems = document.querySelectorAll('.cart-item[data-product-id]');
        
        if (existingItems.length > 0) {
            // 하드코딩된 상품이 있으면 동적 렌더링 하지 않음
            updateSelectAllState();
            updateDeleteButton();
            updateOrderSummary();
        } else {
            // localStorage가 비어있으면 기본 상품들 추가
            const cartItems = getCartItems();
            if (cartItems.length === 0) {
                // 기본 상품들을 장바구니에 추가
                Object.values(products).forEach(product => {
                    addToCart(product);
                });
            }
            
            renderCartItems();
            updateSelectAllState();
            updateDeleteButton();
            updateOrderSummary();
        }
    }

    // localStorage 초기화 함수 (개발용)
    window.clearCart = function() {
        localStorage.removeItem('shoppingCart');
        location.reload();
    };

    // 페이지 로드 시 초기화
    initialize();

    // 애니메이션 CSS 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-100%);
            }
        }
        
        .cart-item {
            transition: all 0.3s ease;
        }
        
        .cart-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        .modify-order-btn:hover,
        .order-btn:hover,
        .final-order-btn:hover {
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(style);

    // 반응형 처리
    function handleResize() {
        const cartItems = document.querySelectorAll('.cart-item');
        
        if (window.innerWidth <= 768) {
            cartItems.forEach(item => {
                item.style.flexDirection = 'column';
                item.style.gap = '20px';
            });
        } else {
            cartItems.forEach(item => {
                item.style.flexDirection = 'row';
                item.style.gap = '0';
            });
        }
    }

    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    
    // 초기 반응형 설정
    handleResize();

    // 키보드 접근성 개선
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('modify-order-btn') || 
                focusedElement.classList.contains('order-btn') ||
                focusedElement.classList.contains('final-order-btn')) {
                e.preventDefault();
                focusedElement.click();
            }
        }
    });

    // 접근성을 위한 ARIA 라벨 추가
    itemCheckboxes.forEach((checkbox, index) => {
        const productName = checkbox.closest('.cart-item').querySelector('.product-name').textContent;
        checkbox.setAttribute('aria-label', `${productName} 선택`);
    });

    selectAllCheckbox.setAttribute('aria-label', '모든 상품 선택');
    deleteSelectedBtn.setAttribute('aria-label', '선택한 상품 삭제');
    finalOrderBtn.setAttribute('aria-label', '선택한 상품 주문하기');
});
