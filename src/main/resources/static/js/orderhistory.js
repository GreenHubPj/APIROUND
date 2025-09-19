document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 주문 내역 페이지가 로드되었습니다.');

    // 로그인 사용자별 주문히스토리 키
    const userId = (typeof window.__USER_ID__ !== 'undefined' && window.__USER_ID__ != null)
        ? String(window.__USER_ID__)
        : 'guest';
    const HISTORY_KEY = `orderHistory:${userId}`;

    // 사용자 주문 데이터 로드
    let orderData = loadUserOrders();
    console.log('loaded orders:', orderData);

    // DOM 요소들
    const ordersList = document.getElementById('ordersList');
    const paginationContainer = document.getElementById('paginationContainer');
    const emptyState = document.getElementById('emptyState');
    const statusFilter = document.getElementById('statusFilter');
    const periodFilter = document.getElementById('periodFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // 페이징 관련 변수
    let currentPage = 1;
    const itemsPerPage = 5;
    let filteredData = [...orderData];

    // 상태별 한글 변환
    const statusLabels = {
        'completed': '배송완료',
        'shipping': '배송중',
        'preparing': '준비중',
        'cancelled': '취소됨'
    };

    // 유틸: 금액 포맷팅
    function formatPrice(price) {
        return (Number(price) || 0).toLocaleString('ko-KR') + '원';
    }

    // 유틸: 날짜 포맷팅
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // 사용자 주문 로드
    function loadUserOrders() {
        try {
            const raw = localStorage.getItem(HISTORY_KEY);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch (e) {
            console.warn('order history parse fail:', e);
            return [];
        }
    }

    // 주문 카드 생성 (옵션 표시 추가)
    function createOrderCard(order) {
        const statusClass = `status-${order.status}`;
        const statusLabel = statusLabels[order.status] || order.status;

        const itemsHtml = (order.items || []).map(item => `
            <div class="order-item">
                <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}" class="item-image">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">
                        ${item.optionText ? `옵션: ${item.optionText} / ` : ''}
                        수량: ${item.quantity}${item.unit || '개'}
                    </div>
                </div>
                <div class="item-price">${formatPrice(item.price)}</div>
            </div>
        `).join('');

        const actionsHtml = getOrderActions(order.status, order.id);

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <div class="order-number">주문번호: ${order.id}</div>
                        <div class="order-date">주문일: ${formatDate(order.date)}</div>
                    </div>
                    <div class="order-status ${statusClass}">${statusLabel}</div>
                </div>
                <div class="order-body">
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-summary">
                        <div class="summary-info">
                            <div class="summary-label">상품금액</div>
                            <div class="summary-value">${formatPrice(order.totalAmount)}</div>
                        </div>
                        <div class="summary-info">
                            <div class="summary-label">배송비</div>
                            <div class="summary-value">${order.shippingFee > 0 ? formatPrice(order.shippingFee) : '무료'}</div>
                        </div>
                        <div class="summary-info">
                            <div class="summary-label">총 결제금액</div>
                            <div class="summary-value">${formatPrice(order.finalAmount)}</div>
                        </div>
                        <div class="order-actions">
                            ${actionsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 주문 상태별 액션 버튼
    function getOrderActions(status, orderId) {
        switch (status) {
            case 'completed':
                return `
                    <button class="action-btn btn-primary" onclick="viewOrderDetails('${orderId}')">주문상세</button>
                    <button class="action-btn btn-outline" onclick="reorder('${orderId}')">재주문</button>
                    <button class="action-btn btn-secondary" onclick="writeReview('${orderId}')">리뷰작성</button>
                `;
            case 'shipping':
                return `
                    <button class="action-btn btn-primary" onclick="viewOrderDetails('${orderId}')">주문상세</button>
                    <button class="action-btn btn-secondary" onclick="trackOrder('${orderId}')">배송추적</button>
                `;
            case 'preparing':
                return `
                    <button class="action-btn btn-primary" onclick="viewOrderDetails('${orderId}')">주문상세</button>
                    <button class="action-btn btn-outline" onclick="cancelOrder('${orderId}')">주문취소</button>
                `;
            case 'cancelled':
                return `
                    <button class="action-btn btn-primary" onclick="viewOrderDetails('${orderId}')">주문상세</button>
                    <button class="action-btn btn-outline" onclick="reorder('${orderId}')">재주문</button>
                `;
            default:
                return '';
        }
    }

    // 필터링
    function filterOrders() {
        let filtered = [...orderData];

        // 상태
        const statusValue = statusFilter.value;
        if (statusValue !== 'all') {
            filtered = filtered.filter(order => order.status === statusValue);
        }

        // 기간
        const periodValue = periodFilter.value;
        if (periodValue !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            switch (periodValue) {
                case '1month':  filterDate.setMonth(now.getMonth() - 1); break;
                case '3months': filterDate.setMonth(now.getMonth() - 3); break;
                case '6months': filterDate.setMonth(now.getMonth() - 6); break;
                case '1year':   filterDate.setFullYear(now.getFullYear() - 1); break;
            }
            filtered = filtered.filter(order => new Date(order.date) >= filterDate);
        }

        // 검색
        const searchValue = searchInput.value.toLowerCase().trim();
        if (searchValue) {
            filtered = filtered.filter(order =>
                (order.items || []).some(item =>
                    String(item.name || '').toLowerCase().includes(searchValue)
                )
            );
        }

        filteredData = filtered;
        currentPage = 1;
        renderOrders();
        renderPagination();
    }

    // 주문 목록 렌더링
    function renderOrders() {
        if (filteredData.length === 0) {
            ordersList.style.display = 'none';
            paginationContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        ordersList.style.display = 'block';
        paginationContainer.style.display = 'flex';
        emptyState.style.display = 'none';

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        ordersList.innerHTML = pageData.map(order => createOrderCard(order)).join('');
    }

    // 페이지네이션 렌더링
    function renderPagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage + 1;
        const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);

        paginationContainer.innerHTML = `
            <div class="pagination-info">
                ${currentPage}페이지 (${startIndex}-${endIndex} / 총 ${filteredData.length}개)
            </div>
            <div class="pagination">
                <button class="page-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''}>이전</button>
                <div class="page-numbers" id="pageNumbers">
                    ${generatePageNumbers(totalPages)}
                </div>
                <button class="page-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''}>다음</button>
            </div>
        `;

        addPaginationEvents(totalPages);
    }

    // 페이지 번호 생성
    function generatePageNumbers(totalPages) {
        let pageNumbers = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        return pageNumbers;
    }

    // 페이지네이션 이벤트
    function addPaginationEvents(totalPages) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.querySelectorAll('.page-number');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderOrders(); renderPagination(); }
        });
        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) { currentPage++; renderOrders(); renderPagination(); }
        });
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                currentPage = page;
                renderOrders();
                renderPagination();
            });
        });
    }

    // 액션 함수들(전역에 노출)
    window.viewOrderDetails = function(orderId) {
        window.location.href = `/orderdetails?id=${orderId}`;
    };

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

    window.reorder = function(orderId) {
        const order = orderData.find(o => o.id === orderId);
        if (!order) { alert('주문 정보를 찾을 수 없습니다.'); return; }

        if (confirm('이 주문과 동일한 상품을 장바구니에 추가하시겠습니까?')) {
            let addedCount = 0;
            (order.items || []).forEach(item => {
                const product = {
                    id: item.id,
                    name: item.name,
                    price: Math.round((item.price || 0) / (item.quantity || 1)), // 대략 단가
                    quantity: item.quantity || 1,
                    unit: item.unit || '개',
                    total: item.price || 0,
                    image: item.image
                };
                addToCart(product);
                addedCount++;
            });
            if (addedCount > 0) {
                alert(`${addedCount}개 상품이 장바구니에 추가되었습니다.`);
                if (confirm('장바구니로 이동하시겠습니까?')) window.location.href = '/shoppinglist';
            } else {
                alert('상품을 장바구니에 추가할 수 없습니다.');
            }
        }
    };

    window.writeReview = function(orderId) {
        window.location.href = '/review';
    };

    window.trackOrder = function(orderId) {
        alert('배송 추적 기능은 준비 중입니다.');
    };

    window.cancelOrder = function(orderId) {
        if (confirm('정말로 주문을 취소하시겠습니까?')) {
            alert('주문 취소 요청이 접수되었습니다.');
        }
    };

    // 이벤트 리스너
    statusFilter.addEventListener('change', filterOrders);
    periodFilter.addEventListener('change', filterOrders);
    searchInput.addEventListener('input', filterOrders);
    searchBtn.addEventListener('click', filterOrders);
    searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') filterOrders(); });

    // 초기 렌더링
    filterOrders();
    renderPagination();

    console.log('주문 내역 페이지 초기화 완료');
});
