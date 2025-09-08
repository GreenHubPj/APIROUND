// 장바구니 JavaScript
document.addEventListener('DOMContentLoaded', function() {
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
        itemCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const productId = checkbox.getAttribute('data-product-id');
                selectedItems.push(productId);
            }
        });
        return selectedItems;
    }

    // 총 금액 계산
    function calculateTotalAmount(selectedItems) {
        return selectedItems.reduce((total, productId) => {
            return total + products[productId].total;
        }, 0);
    }

    // 선택된 상품들 삭제
    function deleteSelectedItems(selectedItems) {
        selectedItems.forEach(productId => {
            const cartItem = document.querySelector(`[data-product-id="${productId}"]`);
            if (cartItem) {
                cartItem.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    cartItem.remove();
                    updateSelectAllState();
                    updateDeleteButton();
                    updateOrderSummary();
                }, 300);
            }
        });
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

    // 초기화
    function initialize() {
        updateSelectAllState();
        updateDeleteButton();
        updateOrderSummary();
    }

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
