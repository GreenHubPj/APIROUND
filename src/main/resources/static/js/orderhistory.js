document.addEventListener('DOMContentLoaded', function () {
  console.log('GreenHub 주문 내역 페이지가 로드되었습니다.');

  // DOM 요소들
  const ordersList = document.getElementById('ordersList');
  const paginationContainer = document.getElementById('paginationContainer');
  const emptyState = document.getElementById('emptyState');
  const statusFilter = document.getElementById('statusFilter');
  const periodFilter = document.getElementById('periodFilter');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  // 페이징
  let currentPage = 1;
  const itemsPerPage = 5;

  // 상태별 한글
  const statusLabels = {
    'completed': '배송완료',
    'shipping': '배송중',
    'preparing': '준비중',
    'cancelled': '취소됨'
  };

  // 유틸
  function formatPrice(price) {
    const n = (price == null) ? 0 : Number(price);
    return n.toLocaleString('ko-KR') + '원';
  }
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // 주문 카드
  function createOrderCard(order) {
    const statusClass = `status-${order.status}`;
    const statusLabel = statusLabels[order.status] || order.status;

    const itemsHtml = (order.items || []).map(item => `
      <div class="order-item">
        <img src="${item.image || '/images/default-product.jpg'}" alt="${item.name}" class="item-image">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-details">
            ${item.optionText ? `옵션: ${item.optionText} / ` : ''}수량: ${item.quantity}${item.unit || '개'}
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
  let orderData = [];
  let filteredData = [];

  function filterOrders() {
    let filtered = [...orderData];

    const statusValue = statusFilter ? statusFilter.value : 'all';
    if (statusValue !== 'all') {
      filtered = filtered.filter(order => order.status === statusValue);
    }

    const periodValue = periodFilter ? periodFilter.value : 'all';
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

    const searchValue = (searchInput ? searchInput.value : '').toLowerCase().trim();
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

  function renderOrders() {
    if (!ordersList || !paginationContainer || !emptyState) return;

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

  function renderPagination() {
    if (!paginationContainer) return;

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

  // 액션 (필요시)
  window.viewOrderDetails = function(orderId) { window.location.href = `/orderdetails?id=${orderId}`; };
  window.writeReview = function(orderId) { window.location.href = '/review'; };
  window.trackOrder  = function(orderId) { alert('배송 추적 기능은 준비 중입니다.'); };
  window.cancelOrder = function(orderId) { if (confirm('정말로 주문을 취소하시겠습니까?')) alert('주문 취소 요청이 접수되었습니다.'); };
  window.reorder     = function(orderId) { alert('재주문 기능은 준비 중입니다.'); };

  // 서버에서 내 주문 가져오기 (서버는 /mine, /my 둘 다 지원)
  async function loadUserOrdersFromServer() {
    try {
      const res = await fetch('/api/orders/my', { credentials: 'same-origin' });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login?redirectURL=/orderhistory';
          return [];
        }
        console.warn('order API error', res.status);
        return [];
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.orders)) {
        return data.orders.map(o => ({
          id: o.id,
          date: o.date,
          status: o.status,
          totalAmount: o.totalAmount,
          shippingFee: o.shippingFee,
          finalAmount: o.finalAmount,
          items: (o.items || []).map(it => ({
            name: it.name,
            image: it.image,
            quantity: it.quantity,
            unit: it.unit,
            optionText: it.optionText,
            price: it.price
          }))
        }));
      }
      return [];
    } catch (e) {
      console.error('order fetch fail', e);
      return [];
    }
  }

  async function init() {
    orderData = await loadUserOrdersFromServer();
    filteredData = [...orderData];

    if (statusFilter) statusFilter.addEventListener('change', filterOrders);
    if (periodFilter) periodFilter.addEventListener('change', filterOrders);
    if (searchInput) {
      searchInput.addEventListener('input', filterOrders);
      searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') filterOrders(); });
    }
    if (searchBtn) searchBtn.addEventListener('click', filterOrders);

    filterOrders();
    renderPagination();
  }

  init();
});
