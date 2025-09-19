document.addEventListener('DOMContentLoaded', function() {
  console.log('GreenHub 주문 상세 페이지가 로드되었습니다.');

  // URL 파라미터에서 주문 식별자 가져오기 (order_number 또는 PK)
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (!orderId) {
    alert('주문 식별자가 없습니다.');
    window.location.href = '/orderhistory';
    return;
  }

  // 상태별 한글 변환
  const statusLabels = {
    'completed': '배송완료',
    'shipping': '배송중',
    'preparing': '준비중',
    'cancelled': '취소됨'
  };

  // 상태별 아이콘
  const statusIcons = {
    '주문 접수': '📦',
    '상품 준비': '🏭',
    '배송 시작': '🚚',
    '배송 완료': '✅',
    '주문 취소': '❌'
  };

  // 금액 포맷팅
  function formatPrice(price) {
    const n = (price == null) ? 0 : Number(price);
    return n.toLocaleString('ko-KR') + '원';
  }

  // 날짜 포맷팅 (yyyy-MM-dd or ISO)
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ===== 서버 연동: 주문상세 조회 =====
  async function fetchOrderDetailFromServer(idOrNumber) {
    try {
      const res = await fetch(`/api/orders/my/${encodeURIComponent(idOrNumber)}`, {
        credentials: 'same-origin'
      });

      if (res.status === 401) {
        window.location.href = `/login?redirectURL=${encodeURIComponent('/orderdetails?id=' + idOrNumber)}`;
        return null;
      }

      if (!res.ok) {
        console.warn('order detail api error', res.status);
        return null;
      }

      const json = await res.json();
      if (!json || !json.success || !json.order) return null;

      // 서버 DTO를 화면 모델로 정규화
      return normalizeServerOrder(json.order);
    } catch (e) {
      console.error('order detail fetch fail', e);
      return null;
    }
  }

  // 서버 DTO -> 화면용 모델
  function normalizeServerOrder(o) {
    // o: OrderDetailDto
    const items = (o.items || []).map(it => ({
      id: it.productId || it.listingId || null,
      name: it.name,
      image: it.image || '/images/default-product.jpg',
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice || 0),
      unit: it.unit || '',
      totalPrice: Number(it.lineAmount || 0)
    }));

    const delivery = {
      recipientName: o.recipient?.name || '-',
      recipientPhone: o.recipient?.phone || '-',
      address: [o.recipient?.zipcode, o.recipient?.address1, o.recipient?.address2]
        .filter(Boolean)
        .join(' '),
      note: o.recipient?.memo || '-'
    };

    // 서버 DTO엔 결제일/승인번호는 없으므로 표시만 보완
    const payment = {
      method: o.paymentMethod || '-',
      date: o.date ? new Date(o.date).toLocaleString('ko-KR') : '-',
      approvalNumber: '-' // 백엔드 확장 전까지 플레이스홀더
    };

    // 간이 배송 타임라인 생성 (상태 기반)
    const timeline = buildTimeline(o.status, o.date);

    return {
      id: o.id,
      date: o.date,
      status: o.status,
      items,
      totalAmount: Number(o.subtotalAmount || 0),
      shippingFee: Number(o.shippingFee || 0),
      discountAmount: Number(o.discountAmount || 0),
      finalAmount: Number(o.totalAmount || 0),
      delivery,
      payment,
      tracking: timeline
    };
  }

  function buildTimeline(status, createdAt) {
    const created = createdAt ? new Date(createdAt) : new Date();
    const d = offset => new Date(created.getTime() + offset).toLocaleString('ko-KR');

    switch (String(status || '').toLowerCase()) {
      case 'completed':
        return [
          { status: '주문 접수', date: d(0), completed: true },
          { status: '상품 준비', date: d(6 * 60 * 60 * 1000), completed: true },
          { status: '배송 시작', date: d(24 * 60 * 60 * 1000), completed: true },
          { status: '배송 완료', date: d(36 * 60 * 60 * 1000), completed: true }
        ];
      case 'shipping':
        return [
          { status: '주문 접수', date: d(0), completed: true },
          { status: '상품 준비', date: d(6 * 60 * 60 * 1000), completed: true },
          { status: '배송 시작', date: d(24 * 60 * 60 * 1000), completed: true },
          { status: '배송 완료', date: '', completed: false }
        ];
      case 'preparing':
        return [
          { status: '주문 접수', date: d(0), completed: true },
          { status: '상품 준비', date: '', completed: false },
          { status: '배송 시작', date: '', completed: false },
          { status: '배송 완료', date: '', completed: false }
        ];
      case 'cancelled':
        return [
          { status: '주문 접수', date: d(0), completed: true },
          { status: '주문 취소', date: d(2 * 60 * 60 * 1000), completed: true }
        ];
      default:
        return [
          { status: '주문 접수', date: d(0), completed: true }
        ];
    }
  }

  // ===== 기존 더미 데이터 (서버 실패 시 폴백) =====
  const fallbackData = {
    'ORD-2024-001': { /* 생략 없이 기존 더미를 쓰고 싶으면 여기에 그대로 유지하세요 */ }
    // 필요 시 이전에 쓰던 더미 주문들을 채워두면 됩니다.
  };

  function getFallback(orderId) {
    return fallbackData[orderId] ? normalizeFallback(fallbackData[orderId]) : null;
  }

  function normalizeFallback(src) {
    return {
      id: src.id,
      date: src.date,
      status: src.status,
      items: (src.items || []).map(it => ({
        id: it.id,
        name: it.name,
        image: it.image,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unit: it.unit,
        totalPrice: it.totalPrice
      })),
      totalAmount: src.totalAmount,
      shippingFee: src.shippingFee,
      discountAmount: src.discountAmount,
      finalAmount: src.finalAmount,
      delivery: {
        recipientName: src.delivery.recipientName,
        recipientPhone: src.delivery.recipientPhone,
        address: src.delivery.address,
        note: src.delivery.note
      },
      payment: {
        method: src.payment.method,
        date: src.payment.date,
        approvalNumber: src.payment.approvalNumber
      },
      tracking: src.tracking || []
    };
  }

  // ===== 렌더링 =====
  function renderAll(orderData) {
    // 기본 정보
    document.getElementById('orderNumber').textContent = `주문번호: ${orderData.id}`;
    document.getElementById('orderDate').textContent = `주문일: ${formatDate(orderData.date)}`;
    const statusElement = document.getElementById('orderStatus');
    statusElement.innerHTML = `<span class="status-badge status-${orderData.status}">${statusLabels[orderData.status] || orderData.status}</span>`;

    // 상품 목록
    renderOrderItems(orderData.items);

    // 배송 정보
    updateDeliveryInfo(orderData.delivery);

    // 추적 정보
    updateTrackingInfo(orderData.tracking);

    // 결제/금액
    updatePaymentInfo(orderData.payment, orderData);

    // 버튼 표시
    updateActionButtons(orderData.status);

    // 영수증/재주문에서 접근할 수 있도록 보관
    window.__currentOrderDetail = orderData;

    console.log('주문 상세 정보 로드 완료:', orderData);
  }

  function renderOrderItems(items) {
    const itemsList = document.getElementById('orderItemsList');
    itemsList.innerHTML = (items || []).map(item => `
      <div class="order-item-detail" data-product-id="${item.id}" onclick="goToProduct('${item.id || ''}')">
        <img src="${item.image}" alt="${item.name}" class="item-image-detail">
        <div class="item-info-detail">
          <div class="item-name-detail">${item.name}</div>
          <div class="item-details-detail">
            <div class="item-quantity">수량: ${item.quantity}${item.unit || ''}</div>
            <div class="item-unit-price">단가: ${formatPrice(item.unitPrice)}</div>
          </div>
        </div>
        <div class="item-total-price">${formatPrice(item.totalPrice)}</div>
      </div>
    `).join('');
  }

  function updateDeliveryInfo(delivery) {
    document.getElementById('recipientName').textContent = delivery.recipientName || '-';
    document.getElementById('recipientPhone').textContent = delivery.recipientPhone || '-';
    document.getElementById('deliveryAddress').textContent = delivery.address || '-';
    document.getElementById('deliveryNote').textContent = delivery.note || '-';
  }

  function updateTrackingInfo(tracking) {
    const trackingContainer = document.getElementById('deliveryTracking');
    if (!tracking || tracking.length === 0) {
      trackingContainer.innerHTML = `
        <h4>배송 추적</h4>
        <div class="tracking-empty">표시할 배송 이력이 없습니다.</div>
      `;
      return;
    }

    const trackingHtml = `
      <h4>배송 추적</h4>
      <div class="tracking-timeline">
        ${tracking.map(step => `
          <div class="tracking-step ${step.completed ? 'completed' : ''}">
            <div class="step-icon">${statusIcons[step.status] || '•'}</div>
            <div class="step-content">
              <div class="step-title">${step.status}</div>
              <div class="step-date">${step.date || '진행 예정'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    trackingContainer.innerHTML = trackingHtml;
  }

  function updatePaymentInfo(payment, orderData) {
    document.getElementById('paymentMethod').textContent = payment.method || '-';
    document.getElementById('paymentDate').textContent = payment.date || '-';
    document.getElementById('approvalNumber').textContent = payment.approvalNumber || '-';

    document.getElementById('productAmount').textContent = formatPrice(orderData.totalAmount);
    document.getElementById('shippingFee').textContent = orderData.shippingFee > 0 ? formatPrice(orderData.shippingFee) : '무료';
    document.getElementById('discountAmount').textContent = orderData.discountAmount > 0 ? `-${formatPrice(orderData.discountAmount)}` : '-0원';
    document.getElementById('totalAmount').textContent = formatPrice(orderData.finalAmount);
  }

  function updateActionButtons(status) {
    const returnExchangeBtn = document.getElementById('returnExchangeBtn');
    const reviewBtn = document.querySelector('button[onclick="writeReview()"]');

    if (returnExchangeBtn) returnExchangeBtn.style.display = 'none';
    if (reviewBtn) reviewBtn.style.display = 'none';

    switch (String(status)) {
      case 'completed':
        if (returnExchangeBtn) returnExchangeBtn.style.display = 'inline-block';
        if (reviewBtn) reviewBtn.style.display = 'inline-block';
        break;
      case 'shipping':
      case 'preparing':
        if (returnExchangeBtn) returnExchangeBtn.style.display = 'inline-block';
        break;
      case 'cancelled':
      default:
        break;
    }
  }

  // ===== 액션 함수 (전역에 노출) =====
  window.goToProduct = function(productId) {
    if (!productId) return;
    // TODO: 실제 상품상세 경로로 변경
    alert(`${productId} 상품 상세 페이지로 이동합니다.`);
    // window.location.href = `/product-detail?id=${productId}`;
  };

  window.showReceipt = function() {
    const orderData = window.__currentOrderDetail;
    if (!orderData) return;
    generateReceiptContent(orderData);
    document.getElementById('receiptModal').style.display = 'block';
  };

  window.closeReceipt = function() {
    document.getElementById('receiptModal').style.display = 'none';
  };

  window.downloadReceipt = function() {
    const modalContent = document.querySelector('.receipt-modal-content');

    const originalBorderRadius = modalContent.style.borderRadius;
    const originalBoxShadow = modalContent.style.boxShadow;

    modalContent.style.borderRadius = '0';
    modalContent.style.boxShadow = 'none';

    html2canvas(modalContent, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false
    }).then(canvas => {
      modalContent.style.borderRadius = originalBorderRadius;
      modalContent.style.boxShadow = originalBoxShadow;

      const link = document.createElement('a');
      link.download = `receipt_${orderId}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('영수증이 다운로드되었습니다.');
    }).catch(error => {
      modalContent.style.borderRadius = originalBorderRadius;
      modalContent.style.boxShadow = originalBoxShadow;
      console.error('영수증 다운로드 중 오류:', error);
      alert('영수증 다운로드 중 오류가 발생했습니다.');
    });
  };

  function generateReceiptContent(orderData) {
    const receiptBody = document.getElementById('receiptBody');
    receiptBody.innerHTML = `
      <div class="receipt-info">
        <div class="receipt-title">영수증</div>

        <div class="receipt-section">
          <h3>주문 정보</h3>
          <div class="receipt-row"><span class="receipt-label">주문번호</span><span class="receipt-value">${orderData.id}</span></div>
          <div class="receipt-row"><span class="receipt-label">주문일시</span><span class="receipt-value">${orderData.payment.date || '-'}</span></div>
          <div class="receipt-row"><span class="receipt-label">주문상태</span><span class="receipt-value">${statusLabels[orderData.status] || orderData.status}</span></div>
        </div>

        <div class="receipt-section">
          <h3>주문 상품</h3>
          ${orderData.items.map(item => `
            <div class="receipt-row">
              <span class="receipt-label">${item.name} (${item.quantity}${item.unit || ''})</span>
              <span class="receipt-value">${formatPrice(item.totalPrice)}</span>
            </div>
          `).join('')}
        </div>

        <div class="receipt-section">
          <h3>배송 정보</h3>
          <div class="receipt-row"><span class="receipt-label">받는 분</span><span class="receipt-value">${orderData.delivery.recipientName}</span></div>
          <div class="receipt-row"><span class="receipt-label">연락처</span><span class="receipt-value">${orderData.delivery.recipientPhone}</span></div>
          <div class="receipt-row"><span class="receipt-label">배송 주소</span><span class="receipt-value">${orderData.delivery.address}</span></div>
        </div>

        <div class="receipt-section">
          <h3>결제 정보</h3>
          <div class="receipt-row"><span class="receipt-label">결제 방법</span><span class="receipt-value">${orderData.payment.method}</span></div>
          <div class="receipt-row"><span class="receipt-label">승인 번호</span><span class="receipt-value">${orderData.payment.approvalNumber}</span></div>
        </div>

        <div class="receipt-total">
          <div class="receipt-row"><span class="receipt-label">상품 금액</span><span class="receipt-value">${formatPrice(orderData.totalAmount)}</span></div>
          <div class="receipt-row"><span class="receipt-label">배송비</span><span class="receipt-value">${orderData.shippingFee > 0 ? formatPrice(orderData.shippingFee) : '무료'}</span></div>
          <div class="receipt-row"><span class="receipt-label">할인 금액</span><span class="receipt-value">${orderData.discountAmount > 0 ? `-${formatPrice(orderData.discountAmount)}` : '-0원'}</span></div>
          <div class="receipt-row"><span class="receipt-label">총 결제 금액</span><span class="receipt-value">${formatPrice(orderData.finalAmount)}</span></div>
        </div>

        <div class="receipt-notes">
          <p>본 영수증은 구매내역 확인용도로만 사용하실 수 있으며, 법적인 효력은 없습니다.</p>
          <p>법적 증빙서류가 필요하신 경우는 현금영수증, 신용카드 전표에서 확인해주시기 바랍니다.</p>
        </div>
      </div>
    `;
  }

  // 장바구니 로컬 저장소
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

  window.reorder = function() {
    const orderData = window.__currentOrderDetail;
    if (!orderData) {
      alert('주문 정보를 찾을 수 없습니다.');
      return;
    }
    if (confirm('이 주문과 동일한 상품을 장바구니에 추가하시겠습니까?')) {
      let added = 0;
      orderData.items.forEach(item => {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          unit: item.unit,
          total: item.totalPrice,
          image: item.image
        });
        added++;
      });
      if (added > 0) {
        if (confirm(`${added}개 상품이 장바구니에 추가되었습니다.\n장바구니로 이동하시겠습니까?`)) {
          window.location.href = '/shoppinglist';
        }
      }
    }
  };

  window.writeReview = function() {
    window.location.href = '/review';
  };

  window.requestReturnExchange = function() {
    const choice = confirm('반품/교환을 신청하시겠습니까?\n\n확인: 반품/교환 신청\n취소: 취소');
    if (choice) alert('반품/교환 신청이 접수되었습니다.\n고객센터에서 1-2일 내에 연락드리겠습니다.');
  };

  // 모달 외부 클릭/ESC로 닫기
  window.onclick = function(event) {
    const modal = document.getElementById('receiptModal');
    if (event.target === modal) closeReceipt();
  };
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') closeReceipt();
  });

  // ===== 초기화: 서버 우선, 실패 시 더미 폴백 =====
  (async function init() {
    let data = await fetchOrderDetailFromServer(orderId);
    if (!data) {
      const fb = getFallback(orderId);
      if (!fb) {
        alert('주문 정보를 찾을 수 없습니다.');
        window.location.href = '/orderhistory';
        return;
      }
      data = fb;
    }
    renderAll(data);
  })();
});
