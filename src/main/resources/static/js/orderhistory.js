document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 주문 내역 페이지가 로드되었습니다.');

    // 더미 주문 데이터
    const orderData = [
        {
            id: 'ORD-2024-001',
            date: '2024-01-15',
            status: 'completed',
            items: [
                { name: '문경 사과', image: '/images/사과.jpg', quantity: 2, price: 30000, unit: 'kg' },
                { name: '고흥 돼지고기', image: '/images/제철 돼지.jpg', quantity: 1, price: 25000, unit: 'kg' },
                { name: '제주 귤', image: '/images/인기 귤.jpg', quantity: 3, price: 36000, unit: 'kg' }
            ],
            totalAmount: 91000,
            shippingFee: 3000,
            finalAmount: 94000
        },
        {
            id: 'ORD-2024-002',
            date: '2024-01-12',
            status: 'shipping',
            items: [
                { name: '강원도 감자', image: '/images/인기 감자.jpg', quantity: 5, price: 40000, unit: 'kg' },
                { name: '산청 표고버섯', image: '/images/인기 표고버섯.jpg', quantity: 2, price: 36000, unit: 'kg' }
            ],
            totalAmount: 76000,
            shippingFee: 3000,
            finalAmount: 79000
        },
        {
            id: 'ORD-2024-003',
            date: '2024-01-10',
            status: 'preparing',
            items: [
                { name: '이천 쌀', image: '/images/쌀.jpg', quantity: 1, price: 35000, unit: '20kg' },
                { name: '구좌 당근', image: '/images/제철 당근.jpg', quantity: 3, price: 27000, unit: 'kg' }
            ],
            totalAmount: 62000,
            shippingFee: 3000,
            finalAmount: 65000
        },
        {
            id: 'ORD-2024-004',
            date: '2024-01-08',
            status: 'completed',
            items: [
                { name: '서해 새우', image: '/images/인기 새우.jpg', quantity: 1, price: 28000, unit: 'kg' },
                { name: '의성 마늘', image: '/images/제철 마늘.jpg', quantity: 2, price: 30000, unit: 'kg' }
            ],
            totalAmount: 58000,
            shippingFee: 3000,
            finalAmount: 61000
        },
        {
            id: 'ORD-2024-005',
            date: '2024-01-05',
            status: 'cancelled',
            items: [
                { name: '경산 복숭아', image: '/images/제철 천도복숭아.jpg', quantity: 4, price: 80000, unit: 'kg' }
            ],
            totalAmount: 80000,
            shippingFee: 3000,
            finalAmount: 83000
        },
        {
            id: 'ORD-2024-006',
            date: '2024-01-03',
            status: 'completed',
            items: [
                { name: '문경 사과', image: '/images/사과.jpg', quantity: 3, price: 67500, unit: 'kg' },
                { name: '고흥 돼지고기', image: '/images/제철 돼지.jpg', quantity: 2, price: 100000, unit: 'kg' },
                { name: '제주 귤', image: '/images/인기 귤.jpg', quantity: 2, price: 16000, unit: 'kg' },
                { name: '강원도 감자', image: '/images/인기 감자.jpg', quantity: 3, price: 14400, unit: 'kg' }
            ],
            totalAmount: 197900,
            shippingFee: 0,
            finalAmount: 197900
        }
    ];

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

    // 금액 포맷팅
    function formatPrice(price) {
        return price.toLocaleString('ko-KR') + '원';
    }

    // 날짜 포맷팅
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 주문 카드 생성
    function createOrderCard(order) {
        const statusClass = `status-${order.status}`;
        const statusLabel = statusLabels[order.status];
        
        const itemsHtml = order.items.map(item => `
            <div class="order-item">
                <img src="${item.image}" alt="${item.name}" class="item-image">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">수량: ${item.quantity}${item.unit}</div>
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

    // 주문 상태별 액션 버튼 생성
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

    // 필터링 함수
    function filterOrders() {
        let filtered = [...orderData];

        // 상태 필터
        const statusValue = statusFilter.value;
        if (statusValue !== 'all') {
            filtered = filtered.filter(order => order.status === statusValue);
        }

        // 기간 필터
        const periodValue = periodFilter.value;
        if (periodValue !== 'all') {
            const now = new Date();
            const filterDate = new Date();
            
            switch (periodValue) {
                case '1month':
                    filterDate.setMonth(now.getMonth() - 1);
                    break;
                case '3months':
                    filterDate.setMonth(now.getMonth() - 3);
                    break;
                case '6months':
                    filterDate.setMonth(now.getMonth() - 6);
                    break;
                case '1year':
                    filterDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            
            filtered = filtered.filter(order => new Date(order.date) >= filterDate);
        }

        // 검색 필터
        const searchValue = searchInput.value.toLowerCase().trim();
        if (searchValue) {
            filtered = filtered.filter(order => 
                order.items.some(item => 
                    item.name.toLowerCase().includes(searchValue)
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

        // 페이지네이션 이벤트 추가
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

    // 페이지네이션 이벤트 추가
    function addPaginationEvents(totalPages) {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.querySelectorAll('.page-number');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderOrders();
                    renderPagination();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderOrders();
                    renderPagination();
                }
            });
        }
        
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                currentPage = page;
                renderOrders();
                renderPagination();
            });
        });
    }

    // 액션 함수들
    window.viewOrderDetails = function(status) {
        // 현재 주문 카드에서 주문 ID 가져오기
        const orderCard = event.target.closest('.order-card');
        const orderNumber = orderCard.querySelector('.order-number').textContent;
        const orderId = orderNumber.split(': ')[1]; // "주문번호: ORD-2024-001"에서 "ORD-2024-001" 추출
        
        // 주문 상세 페이지로 이동
        window.location.href = `/orderdetails?id=${orderId}`;
    };

    // 장바구니 데이터 관리 함수들 (shoppinglist.js와 동일)
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
        if (!order) {
            alert('주문 정보를 찾을 수 없습니다.');
            return;
        }

        if (confirm('이 주문과 동일한 상품을 장바구니에 추가하시겠습니까?')) {
            let addedCount = 0;
            
            // 주문의 모든 상품을 장바구니에 추가
            order.items.forEach(item => {
                const product = {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    unit: item.unit,
                    total: item.price * item.quantity,
                    image: item.image
                };
                
                addToCart(product);
                addedCount++;
            });
            
            if (addedCount > 0) {
                alert(`${addedCount}개 상품이 장바구니에 추가되었습니다.`);
                if (confirm('장바구니로 이동하시겠습니까?')) {
                    window.location.href = '/shoppinglist';
                }
            } else {
                alert('상품을 장바구니에 추가할 수 없습니다.');
            }
        }
    };

    window.writeReview = function(orderId) {
        // 리뷰 페이지로 바로 이동
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


    // 이벤트 리스너 추가
    statusFilter.addEventListener('change', filterOrders);
    periodFilter.addEventListener('change', filterOrders);
    searchInput.addEventListener('input', filterOrders);
    searchBtn.addEventListener('click', filterOrders);

    // 엔터키로 검색
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterOrders();
        }
    });

    // 초기 렌더링
    renderOrders();
    renderPagination();

    // 페이지 로드 완료 메시지
    console.log('주문 내역 페이지 초기화 완료');
});
