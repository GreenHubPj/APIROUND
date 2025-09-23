// 장바구니 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 장바구니 데이터 관리 (서버 API 사용)
    async function getCartItems() {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data || [];
            } else {
                console.error('장바구니 데이터를 가져오는데 실패했습니다.');
                console.error('응답 상태:', response.status);
                console.error('응답 상태 텍스트:', response.statusText);
                
                // 응답 본문도 확인해보기
                try {
                    const errorData = await response.text();
                    console.error('오류 응답 본문:', errorData);
                } catch (e) {
                    console.error('오류 응답 본문을 읽을 수 없습니다:', e);
                }
                
                return [];
            }
        } catch (error) {
            console.error('장바구니 데이터 요청 중 오류 발생:', error);
            return [];
        }
    }

    async function addToCart(product) {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity: product.quantity
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                console.error('장바구니에 상품 추가에 실패했습니다.');
                return null;
            }
        } catch (error) {
            console.error('장바구니 추가 요청 중 오류 발생:', error);
            return null;
        }
    }

    // 상품 데이터 관리 (기존 코드에 맞춤)
    let products = {};

    async function loadProducts() {
        try {
            // 기존 코드에서는 전체 상품 목록 API가 없으므로 
            // 장바구니에 있는 상품 정보만 사용
            const cartItems = await getCartItems();
            
            // 장바구니 아이템에서 상품 정보 추출 (서버 구조에 맞춤)
            products = {};
            cartItems.forEach(item => {
                if (item.optionId) {
                    products[item.optionId] = {
                        id: item.optionId,
                        name: item.optionName || item.title,
                        price: item.unitPrice,
                        unit: item.unit,
                        image: item.image || '/images/default-product.jpg'
                    };
                }
            });
            
            return products;
        } catch (error) {
            console.error('상품 데이터 로드 중 오류 발생:', error);
            return {};
        }
    }

    // 전역 함수로 등록
    window.addToCart = addToCart;


    // DOM 요소들 (동적으로 가져오기)
    function getDOMElements() {
        return {
            selectAllCheckbox: document.getElementById('selectAll'),
            itemCheckboxes: document.querySelectorAll('.item-check'),
            deleteSelectedBtn: document.getElementById('deleteSelected'),
            deleteCountSpan: document.querySelector('.delete-count'),
            totalItemsSpan: document.getElementById('totalItems'),
            totalAmountSpan: document.getElementById('totalAmount'),
            finalOrderBtn: document.getElementById('finalOrderBtn')
        };
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        const elements = getDOMElements();

        // 전체선택 체크박스 이벤트

        function toggleAllCheckboxes(checked) {
            const allCheckboxes = document.querySelectorAll('.item-check');
            allCheckboxes.forEach(cb => cb.checked = checked);
        }

        elements.selectAllCheckbox.addEventListener('change', function() {
         console.log('전체선택 체크박스 변경:', this.checked);
            toggleAllCheckboxes(this.checked);
            updateDeleteButton();
            updateOrderSummary();
        });

        // 개별 상품 체크박스 이벤트 (이벤트 위임 사용)
        document.addEventListener('change', function(e) {
            if (e.target.classList.contains('item-check')) {
             console.log('개별 체크박스 변경:', e.target.dataset.productId, e.target.checked);
                updateSelectAllState();
                updateDeleteButton();
                updateOrderSummary();
            }
        });
    }

    // 선택삭제 버튼 이벤트
    function setupDeleteButton() {
        const elements = getDOMElements();
        if (elements.deleteSelectedBtn) {
            elements.deleteSelectedBtn.addEventListener('click', function() {
                const selectedItems = getSelectedItems();
                if (selectedItems.length === 0) {
                    alert('삭제할 상품을 선택해주세요.');
                    return;
                }

                if (confirm(`선택한 ${selectedItems.length}개 상품을 삭제하시겠습니까?`)) {
                    deleteSelectedItems(selectedItems);
                }
            });
        }
    }

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

    // 최종 주문하기 버튼 이벤트 (API 기반)
    document.addEventListener('click', function(e) {
        if (e.target.id === 'finalOrderBtn') {
            handleFinalOrder();
        }
    });

    async function handleFinalOrder() {
        try {
            const selectedItems = getSelectedItems();
            if (selectedItems.length === 0) {
                alert('주문할 상품을 선택해주세요.');
                return;
            }

            const totalAmount = calculateTotalAmount(selectedItems);
            if (confirm(`선택한 ${selectedItems.length}개 상품을 총 ${totalAmount.toLocaleString()}원에 주문하시겠습니까?`)) {
                const cartIds = selectedItems.map(item => item.cartId);
                const results = await processOrder(cartIds);
                
                if (results && results.length > 0) {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.filter(r => !r.success).length;
                    
                    if (successCount === results.length) {
                        alert('모든 주문이 완료되었습니다!');
                    } else if (successCount > 0) {
                        alert(`${successCount}개 주문 완료, ${failCount}개 주문 실패`);
                    } else {
                        alert('주문 처리에 실패했습니다.');
                    }
                    
                    await renderCartItems();
                    updateSelectAllState();
                    updateDeleteButton();
                    updateOrderSummary();
                } else {
                    alert('주문 처리에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('최종 주문 처리 중 오류 발생:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
        }
    }


    // 전체선택 상태 업데이트
    function updateSelectAllState() {
        const checkedCount = document.querySelectorAll('.item-check:checked').length;
        const totalCount = document.querySelectorAll('.item-check').length;
        const selectAllCheckbox = document.getElementById('selectAll');  // ← 수정됨

        if (selectAllCheckbox) {
            selectAllCheckbox.checked = checkedCount === totalCount && totalCount > 0;
            selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < totalCount;
        }
    }

    // 삭제 버튼 업데이트
    function updateDeleteButton() {
        const selectedCount = document.querySelectorAll('.item-check:checked').length;
        const deleteCountSpan = document.querySelector('.delete-count');
        const deleteSelectedBtn = document.getElementById('deleteSelected');

        if (deleteCountSpan) {
            deleteCountSpan.textContent = selectedCount;
        }

        if (deleteSelectedBtn) {
            if (selectedCount > 0) {
                deleteSelectedBtn.style.display = 'block';
            } else {
                deleteSelectedBtn.style.display = 'none';
            }
        }
    }

    // 주문 요약 업데이트
    function updateOrderSummary() {
        const selectedItems = getSelectedItems();
        const totalItems = selectedItems.length;
        const totalAmount = calculateTotalAmount(selectedItems);

        const elements = getDOMElements();
        if (elements.totalItemsSpan) {
            elements.totalItemsSpan.textContent = totalItems;
        }
        if (elements.totalAmountSpan) {
            elements.totalAmountSpan.textContent = totalAmount.toLocaleString();
        }
        if (elements.finalOrderBtn) {
            elements.finalOrderBtn.disabled = totalItems === 0;
        }
    }

    // 선택된 상품들 가져오기
   function getSelectedItems() {
       const selectedItems = [];
       const checkedBoxes = document.querySelectorAll('.item-check:checked');

       checkedBoxes.forEach(checkbox => {
           const cartItem = checkbox.closest('.cart-item');
           const cartId = cartItem.dataset.cartId;
           const optionId = cartItem.dataset.optionId;
           const name = cartItem.querySelector('.product-name').textContent;

           // 수량과 단위 파싱 (예: "5kg" -> quantity: 5, unit: "kg")
           const quantityValue = cartItem.querySelector('.quantity-value').textContent;
           const quantityMatch = quantityValue.match(/(\d+(?:\.\d+)?)(\w+)/);
           const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1;
           const unit = quantityMatch ? quantityMatch[2] : '';

           // 가격 파싱 (예: "6000원/kg" -> price: 6000)
           const priceText = cartItem.querySelector('.product-price').textContent;
           const priceMatch = priceText.match(/(\d+)/);
           const price = priceMatch ? parseInt(priceMatch[1]) : 0;

           // 총액 파싱 (예: "30000원" -> total: 30000)
           const totalText = cartItem.querySelector('.price-value').textContent;
           const totalMatch = totalText.match(/(\d+)/);
           const total = totalMatch ? parseInt(totalMatch[1]) : 0;

           selectedItems.push({ cartId, optionId, name, unit, quantity, price, total });
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
    async function deleteSelectedItems(selectedItems) {
        try {
            // 선택된 각 아이템을 서버에서 삭제
            const deletePromises = selectedItems.map(item => {
                return fetch(`/api/cart/${item.cartId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            });

            // 모든 삭제 요청을 병렬로 처리
            const responses = await Promise.all(deletePromises);

            // 모든 요청이 성공했는지 확인
            const allSuccessful = responses.every(response => response.ok);

            if (allSuccessful) {
                // 성공 시 DOM에서 해당 요소들 제거
                selectedItems.forEach(item => {
                    const cartItem = document.querySelector(`[data-cart-id="${item.cartId}"]`);
                    if (cartItem) {
                        cartItem.remove();
                    }
                });

                // UI 업데이트
                updateSelectAllState();
                updateDeleteButton();
                updateOrderSummary();

                alert(`${selectedItems.length}개 상품이 삭제되었습니다.`);
            } else {
                alert('일부 상품 삭제에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('삭제 중 오류 발생:', error);
            alert('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    }

    // 주문수정 모달 표시 (API 기반)
    async function showModifyModal(cartId) {
        try {
            const cartItems = await getCartItems();
            const item = cartItems.find(item => item.cartId === cartId);
            
            if (item) {
                const itemName = item.optionName || item.title;
                const newQuantity = prompt(`${itemName}의 수량을 입력해주세요. (현재: ${item.quantity}${item.unit})`, item.quantity);

                if (newQuantity !== null && newQuantity !== '') {
                    const quantity = parseInt(newQuantity);
                    if (quantity > 0) {
                        const result = await updateCartItemQuantity(cartId, quantity);
                        if (result) {
                            await renderCartItems();
                            updateOrderSummary();
                            alert('수량이 변경되었습니다.');
                        } else {
                            alert('수량 변경에 실패했습니다.');
                        }
                    } else {
                        alert('수량은 1 이상이어야 합니다.');
                    }
                }
            }
        } catch (error) {
            console.error('주문 수정 모달 처리 중 오류 발생:', error);
            alert('주문 수정 중 오류가 발생했습니다.');
        }
    }


    // 장바구니 아이템 렌더링 (서버 데이터 기반)
    async function renderCartItems() {
        const cartContainer = document.querySelector('.cart-items');
        if (!cartContainer) {
            console.error('cartContainer 요소를 찾을 수 없습니다.');
            return;
        }

        try {
            const cartItems = await getCartItems();  // 서버에서 장바구니 아이템 불러오기
            console.log('현재 장바구니 아이템:', cartItems);
            
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

            // 장바구니 아이템 렌더링 (서버 구조에 맞춤)
            cartContainer.innerHTML = cartItems.map((item) => `
                <div class="cart-item" data-cart-id="${item.cartId}" data-option-id="${item.optionId}">
                    <div class="item-checkbox">
                        <input type="checkbox" class="item-check" data-cart-id="${item.cartId}">
                    </div>
                    <div class="item-info">
                        <div class="seller-info">
                            <span class="seller-icon">🏠</span>
                            <span class="seller-name">GreenHub</span>
                        </div>
                        <div class="product-details">
                            <img src="/api/listings/${item.optionId}/thumbnail"
                                 onerror="this.src='/images/과일 트럭.png'"
                                 class="product-image">
                            <div class="product-info">
                                <h3 class="product-name">${item.optionName || item.title}</h3>
                                <p class="product-description">신선한 농산물을 만나보세요.</p>
                                <div class="product-price">${item.unitPrice.toLocaleString()}원/${item.unit}</div>
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
                        <button class="modify-order-btn" onclick="modifyOrder('${item.cartId}')">주문수정</button>
                    </div>
                    <div class="item-total">
                        <div class="total-price">
                            <span class="price-label">상품 금액</span>
                            <span class="price-value">${item.totalPrice.toLocaleString()}원</span>
                        </div>
                        <button class="order-btn" onclick="orderItem('${item.cartId}')">주문하기</button>
                    </div>
                </div>
            `).join('');

            // 체크박스 이벤트 재등록
            const newItemCheckboxes = document.querySelectorAll('.item-check');
            newItemCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    updateSelectAllState();
                    updateDeleteButton();
                    updateOrderSummary();
                });
            });
        } catch (error) {
            console.error('장바구니 렌더링 중 오류 발생:', error);
            cartContainer.innerHTML = `
                <div class="error-message">
                    <h3>장바구니를 불러오는데 실패했습니다</h3>
                    <p>페이지를 새로고침해주세요.</p>
                    <button onclick="location.reload()" class="retry-btn">다시 시도</button>
                </div>
            `;
        }
    }

    // 수량 변경 함수 (API 호출)
    async function updateCartItemQuantity(cartId, newQuantity) {
        try {
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    quantity: newQuantity
                })
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.error('수량 변경에 실패했습니다.');
                return null;
            }
        } catch (error) {
            console.error('수량 변경 요청 중 오류 발생:', error);
            return null;
        }
    }

    // 개별 아이템 삭제 함수 (API 호출)
    async function deleteCartItem(cartId) {
        try {
            const response = await fetch(`/api/cart/${cartId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                return true;
            } else {
                console.error('아이템 삭제에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('아이템 삭제 요청 중 오류 발생:', error);
            return false;
        }
    }

    // 주문 처리 함수 (기존 코드에 맞춤)
    async function processOrder(cartIds) {
        try {
            // 기존 코드에서는 주문 API가 분산되어 있으므로
            // 개별 주문 처리 방식으로 변경
            const results = [];
            
            for (const cartId of cartIds) {
                try {
                    // 개별 장바구니 아이템을 주문으로 처리
                    const response = await fetch(`/api/cart/${cartId}/order`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        results.push({ cartId, success: true });
                        // 주문 성공 시 해당 아이템을 장바구니에서 삭제
                        await deleteCartItem(cartId);
                    } else {
                        results.push({ cartId, success: false, error: '주문 실패' });
                    }
                } catch (error) {
                    results.push({ cartId, success: false, error: error.message });
                }
            }
            
            return results;
        } catch (error) {
            console.error('주문 처리 요청 중 오류 발생:', error);
            return null;
        }
    }

    // 전역 함수들 (API 기반으로 수정)
    window.changeQuantity = async function(cartId, change) {
        try {
            const cartItems = await getCartItems();
            const item = cartItems.find(item => item.cartId === cartId);
            
            if (item) {
                const newQuantity = item.quantity + change;
                if (newQuantity < 1) {
                    alert('수량은 1 이상이어야 합니다.');
                    return;
                }
                
                const result = await updateCartItemQuantity(cartId, newQuantity);
                if (result) {
                    await renderCartItems();
                    updateOrderSummary();
                } else {
                    alert('수량 변경에 실패했습니다.');
                }
            }
        } catch (error) {
            console.error('수량 변경 중 오류 발생:', error);
            alert('수량 변경 중 오류가 발생했습니다.');
        }
    };

    window.deleteItem = async function(cartId) {
        if (confirm('이 상품을 삭제하시겠습니까?')) {
            const success = await deleteCartItem(cartId);
            if (success) {
                await renderCartItems();
                updateOrderSummary();
                alert('상품이 삭제되었습니다.');
            } else {
                alert('상품 삭제에 실패했습니다.');
            }
        }
    };

    window.modifyOrder = async function(cartId) {
        try {
            const cartItems = await getCartItems();
            const item = cartItems.find(item => item.cartId === cartId);
            
            if (item) {
                const itemName = item.optionName || item.title;
                const newQuantity = prompt(`${itemName}의 수량을 입력해주세요. (현재: ${item.quantity}${item.unit})`, item.quantity);
                
                if (newQuantity !== null && newQuantity !== '') {
                    const quantity = parseInt(newQuantity);
                    if (quantity > 0) {
                        const result = await updateCartItemQuantity(cartId, quantity);
                        if (result) {
                            await renderCartItems();
                            updateOrderSummary();
                            alert('수량이 변경되었습니다.');
                        } else {
                            alert('수량 변경에 실패했습니다.');
                        }
                    } else {
                        alert('수량은 1 이상이어야 합니다.');
                    }
                }
            }
        } catch (error) {
            console.error('주문 수정 중 오류 발생:', error);
            alert('주문 수정 중 오류가 발생했습니다.');
        }
    };

    window.orderItem = async function(cartId) {
        try {
            const cartItems = await getCartItems();
            const item = cartItems.find(item => item.cartId === cartId);
            
            if (item) {
                const itemName = item.optionName || item.title;
                if (confirm(`${itemName}을(를) 주문하시겠습니까?`)) {
                    const results = await processOrder([cartId]);
                    if (results && results.length > 0 && results[0].success) {
                        alert('주문이 완료되었습니다!');
                        await renderCartItems();
                        updateOrderSummary();
                    } else {
                        alert('주문 처리에 실패했습니다.');
                    }
                }
            }
        } catch (error) {
            console.error('개별 주문 처리 중 오류 발생:', error);
            alert('주문 처리 중 오류가 발생했습니다.');
        }
    };

    // 초기화 (API 기반)
    async function initialize() {
        try {
            // 상품 데이터 로드
            await loadProducts();
            
            // HTML에 하드코딩된 상품이 있는지 확인
            const existingItems = document.querySelectorAll('.cart-item[data-product-id]');

            if (existingItems.length > 0) {
                // 하드코딩된 상품이 있으면 동적 렌더링 하지 않음
                updateSelectAllState();
                updateDeleteButton();
                updateOrderSummary();
            } else {
                // 서버에서 장바구니 데이터 렌더링
                await renderCartItems();
                updateSelectAllState();
                updateDeleteButton();
                updateOrderSummary();
            }
        } catch (error) {
            console.error('초기화 중 오류 발생:', error);
            // 오류 발생 시 기본 UI 설정
            const cartContainer = document.querySelector('.cart-items');
            if (cartContainer) {
                cartContainer.innerHTML = `
                    <div class="error-message">
                        <h3>장바구니를 불러오는데 실패했습니다</h3>
                        <p>페이지를 새로고침해주세요.</p>
                        <button onclick="location.reload()" class="retry-btn">다시 시도</button>
                    </div>
                `;
            }
        }
    }

    // 장바구니 초기화 함수 (기존 코드에 맞춤)
    window.clearCart = async function() {
        try {
            const cartItems = await getCartItems();
            
            if (cartItems.length === 0) {
                alert('장바구니가 이미 비어있습니다.');
                return;
            }

            if (confirm(`장바구니의 모든 상품(${cartItems.length}개)을 삭제하시겠습니까?`)) {
                // 모든 장바구니 아이템을 개별 삭제
                const deletePromises = cartItems.map(item => 
                    fetch(`/api/cart/${item.cartId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    })
                );

                const responses = await Promise.all(deletePromises);
                const allSuccessful = responses.every(response => response.ok);

                if (allSuccessful) {
                    alert('장바구니가 초기화되었습니다.');
                    await renderCartItems();
                    updateSelectAllState();
                    updateDeleteButton();
                    updateOrderSummary();
                } else {
                    alert('일부 상품 삭제에 실패했습니다. 페이지를 새로고침해주세요.');
                }
            }
        } catch (error) {
            console.error('장바구니 초기화 중 오류 발생:', error);
            alert('장바구니 초기화 중 오류가 발생했습니다.');
        }
    };

    // 페이지 로드 시 초기화
    initialize();

    // DB 데이터가 렌더링된 후 이벤트 리스너 설정
    setupEventListeners();
    setupDeleteButton();

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
    function setupAccessibility() {
        const elements = getDOMElements();
        
        // 개별 체크박스 ARIA 라벨 설정
        elements.itemCheckboxes.forEach((checkbox, index) => {
            const productName = checkbox.closest('.cart-item')?.querySelector('.product-name')?.textContent;
            if (productName) {
                checkbox.setAttribute('aria-label', `${productName} 선택`);
            }
        });

        // 전체 체크박스 ARIA 라벨 설정
        if (elements.selectAllCheckbox) {
            elements.selectAllCheckbox.setAttribute('aria-label', '모든 상품 선택');
        }
        
        // 삭제 버튼 ARIA 라벨 설정
        if (elements.deleteSelectedBtn) {
            elements.deleteSelectedBtn.setAttribute('aria-label', '선택한 상품 삭제');
        }
        
        // 최종 주문 버튼 ARIA 라벨 설정
        if (elements.finalOrderBtn) {
            elements.finalOrderBtn.setAttribute('aria-label', '선택한 상품 주문하기');
        }
    }

    // 접근성 설정
    setupAccessibility();
});