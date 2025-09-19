// 구매 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
  console.log('GreenHub 구매 페이지가 로드되었습니다.');
  console.log('currentOrder raw:', localStorage.getItem('currentOrder'));

  initializeBuyingPage();
  setupEventListeners();
});

// 페이지 초기화
function initializeBuyingPage() {
  const currentOrder = safeGetCurrentOrder();

  if (!currentOrder || currentOrder.length === 0) {
    showMessage('주문할 상품이 없습니다.', 'error');
    setTimeout(() => { window.location.href = '/'; }, 1500);
    return;
  }

  displayOrderItems(currentOrder);
  calculateTotalAmount(currentOrder);
}

// localStorage에서 안전하게 읽기
function safeGetCurrentOrder() {
  try {
    const raw = localStorage.getItem('currentOrder');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch (e) {
    console.warn('currentOrder 파싱 실패:', e);
    return null;
  }
}

// 주문 상품 정보 표시
function displayOrderItems(orderItems) {
  const productItemContainer = document.getElementById('orderProductItem');
  if (!productItemContainer) return;

  if (!orderItems || orderItems.length === 0) {
    productItemContainer.innerHTML = '<p>주문할 상품이 없습니다.</p>';
    return;
  }

  const item = orderItems[0]; // 단일 상품 기준

  // 필드 보정
  const name = item.name || '상품';
  const category = item.category || '';
  const region = item.region ? ` | ${item.region}` : '';
  const qtyCount = typeof item.quantityCount === 'number' && item.quantityCount > 0 ? item.quantityCount : 1;
  const optionText = item.optionText || item.quantity || '';
  const unitPrice = (typeof item.unitPrice === 'number' && !isNaN(item.unitPrice))
    ? item.unitPrice
    : parsePrice(item.price);
  const lineTotal = (typeof item.priceRaw === 'number' && !isNaN(item.priceRaw))
    ? item.priceRaw
    : (unitPrice * qtyCount);

  const imgSrc = item.image && item.image !== '' ? item.image : null;
  const productImage = imgSrc
    ? `<img src="${imgSrc}" alt="${name}" class="product-thumbnail">`
    : `<div class="product-placeholder"><span class="product-icon">🛒</span></div>`;

  productItemContainer.innerHTML = `
    <div class="product-image">
      ${productImage}
    </div>
    <div class="product-details">
      <div class="product-name">${name}</div>
      <div class="product-category">${category}${region}</div>
      <div class="product-desc">${optionText}${qtyCount > 1 ? ` × ${qtyCount}` : ''}</div>
      <div class="product-price">
        <span class="quantity">${qtyCount}개</span>
        <span class="price">${formatPrice(lineTotal)}</span>
      </div>
      <div class="product-sub">
        <span class="unit">단가: ${formatPrice(unitPrice)}</span>
      </div>
    </div>
  `;
}

// 총 금액 계산
function calculateTotalAmount(orderItems) {
  if (!orderItems || orderItems.length === 0) return;

  const item = orderItems[0];

  const qtyCount = typeof item.quantityCount === 'number' && item.quantityCount > 0 ? item.quantityCount : 1;
  const unitPrice = (typeof item.unitPrice === 'number' && !isNaN(item.unitPrice))
    ? item.unitPrice
    : parsePrice(item.price);
  const productPrice = (typeof item.priceRaw === 'number' && !isNaN(item.priceRaw))
    ? item.priceRaw
    : (unitPrice * qtyCount);

  const deliveryFee = 3000; // 배송비 고정
  const totalAmount = productPrice + deliveryFee;

  document.getElementById('productAmount').textContent = formatPrice(productPrice);
  document.getElementById('deliveryFee').textContent = formatPrice(deliveryFee);
  document.getElementById('totalAmount').textContent = formatPrice(totalAmount);
  document.getElementById('orderAmount').textContent = formatPrice(totalAmount);
}

// 가격 파싱 (문자열에서 숫자 추출)
function parsePrice(priceString) {
  return parseInt(String(priceString || '').replace(/[^0-9]/g, ''), 10) || 0;
}

// 가격 포맷팅
function formatPrice(price) {
  return (Number(price) || 0).toLocaleString('ko-KR') + '원';
}

// 이벤트 리스너 설정
function setupEventListeners() {
  const form = document.querySelector('.buying-content');
  if (!form) return;

  const inputs = form.querySelectorAll('input[required], select[required]');

  inputs.forEach(input => {
    input.addEventListener('blur', validateField);
    input.addEventListener('input', clearFieldError);
  });

  const termsCheckbox = document.getElementById('termsAgreement');
  termsCheckbox && termsCheckbox.addEventListener('change', updateOrderButton);

  updateOrderButton();
}

// 필드 유효성 검사
function validateField(event) {
  const field = event.target;
  const value = String(field.value || '').trim();

  clearFieldError(event);

  if (!value) {
    showFieldError(field, '필수 입력 항목입니다.');
    return false;
  }

  if (field.id === 'recipientPhone') {
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(value)) {
      showFieldError(field, '올바른 전화번호 형식이 아닙니다. (010-0000-0000)');
      return false;
    }
  }

  return true;
}

// 필드 에러 표시
function showFieldError(field, message) {
  field.style.borderColor = '#dc3545';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.color = '#dc3545';
  errorDiv.style.fontSize = '12px';
  errorDiv.style.marginTop = '5px';

  field.parentNode.appendChild(errorDiv);
}

// 필드 에러 제거
function clearFieldError(event) {
  const field = event.target;
  field.style.borderColor = '#e1e8ed';
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) errorDiv.remove();
}

// 주문 버튼 상태 업데이트
function updateOrderButton() {
  const orderBtn = document.getElementById('orderBtn');
  if (!orderBtn) return;

  const termsCheckbox = document.getElementById('termsAgreement');

  const requiredFields = ['recipientName', 'recipientPhone', 'deliveryAddress'];
  let allFieldsValid = true;

  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field || !String(field.value || '').trim()) {
      allFieldsValid = false;
    }
  });

  const termsAgreed = !!(termsCheckbox && termsCheckbox.checked);

  if (allFieldsValid && termsAgreed) {
    orderBtn.disabled = false;
    orderBtn.style.opacity = '1';
  } else {
    orderBtn.disabled = true;
    orderBtn.style.opacity = '0.6';
  }
}

// 주문 처리
function processOrder() {
  if (!validateForm()) {
    showMessage('입력 정보를 확인해주세요.', 'warning');
    return;
  }

  const orderData = collectOrderData();
  processOrderRequest(orderData);
}

// 폼 유효성 검사
function validateForm() {
  const requiredFields = ['recipientName', 'recipientPhone', 'deliveryAddress'];
  let isValid = true;

  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!validateField({ target: field })) isValid = false;
  });

  const termsAgreed = document.getElementById('termsAgreement').checked;
  if (!termsAgreed) {
    showMessage('약관에 동의해주세요.', 'warning');
    isValid = false;
  }

  return isValid;
}

// 주문 데이터 수집
function collectOrderData() {
  const currentOrder = safeGetCurrentOrder();

  return {
    items: currentOrder,
    recipient: {
      name: document.getElementById('recipientName').value,
      phone: document.getElementById('recipientPhone').value,
      address: document.getElementById('deliveryAddress').value,
      detailAddress: document.getElementById('detailAddress').value,
      memo: document.getElementById('deliveryMemo').value
    },
    payment: {
      method: document.querySelector('input[name="paymentMethod"]:checked').value
    },
    totalAmount: parsePrice(document.getElementById('totalAmount').textContent),
    orderDate: new Date().toISOString()
  };
}

// 주문 요청 처리(데모)
function processOrderRequest(orderData) {
  console.log('주문 데이터:', orderData);

  const orderBtn = document.getElementById('orderBtn');
  const originalText = orderBtn.innerHTML;
  orderBtn.innerHTML = '<span class="order-icon">⏳</span><span class="order-text">처리 중...</span>';
  orderBtn.disabled = true;

  setTimeout(() => {
    handleOrderSuccess(orderData);
    orderBtn.innerHTML = originalText;
  }, 1000);
}

// 주문 성공 처리 → 사용자별 주문히스토리에 저장 후 /orderhistory 이동
function handleOrderSuccess(orderData) {
  const orderNumber = 'ORD-' + new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0,14);
  const nowISO = new Date().toISOString();

  // currentOrder(아이템) → orderhistory 스키마로 변환
  const items = (orderData.items || []).map(it => {
    const qty = typeof it.quantityCount === 'number' && it.quantityCount > 0 ? it.quantityCount : 1;
    const lineTotal = (typeof it.priceRaw === 'number' && !isNaN(it.priceRaw))
      ? it.priceRaw
      : (Number(it.unitPrice || 0) * qty);

    return {
      id: it.productId || it.id || null,       // 재주문 등에 사용
      name: it.name || '상품',
      image: it.image || '/images/default-product.jpg',
      quantity: qty,                            // 숫자 (재주문 계산용)
      unit: '개',                               // 표시용 기본 단위
      optionText: it.optionText || '',          // 옵션(예: 2kg)
      price: lineTotal                          // 라인 합계
    };
  });

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const shippingFee = 3000;
  const finalAmount = totalAmount + shippingFee;

  const newOrder = {
    id: orderNumber,
    date: nowISO,
    status: 'preparing',   // 기본값: 준비중
    items,
    totalAmount,
    shippingFee,
    finalAmount
  };

  // 사용자별 key
  const userId = (typeof window.__USER_ID__ !== 'undefined' && window.__USER_ID__ != null)
    ? String(window.__USER_ID__)
    : 'guest';
  const key = `orderHistory:${userId}`;

  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.unshift(newOrder);
  localStorage.setItem(key, JSON.stringify(history));

  // 장바구니/현재 주문 비우기
  localStorage.removeItem('currentOrder');

  showMessage('주문이 완료되었습니다! 주문내역으로 이동합니다.', 'success');

  setTimeout(() => {
    window.location.href = `/orderhistory?from=checkout`;
  }, 800);
}

// 카카오 우편번호 API 관련
let element_wrap;

function searchAddress() {
  sample3_execDaumPostcode();
}

function foldDaumPostcode() {
  if (element_wrap) element_wrap.style.display = 'none';
}

function sample3_execDaumPostcode() {
  element_wrap = document.getElementById('wrap');
  if (!element_wrap) return;

  var currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);

  new daum.Postcode({
    oncomplete: function(data) {
      var addr = '';
      var extraAddr = '';

      if (data.userSelectedType === 'R') addr = data.roadAddress;
      else addr = data.jibunAddress;

      if (data.userSelectedType === 'R') {
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) extraAddr += data.bname;
        if (data.buildingName !== '' && data.apartment === 'Y') extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
        if (extraAddr !== '') extraAddr = ' (' + extraAddr + ')';
        document.getElementById("deliveryAddress").value = addr + extraAddr;
      } else {
        document.getElementById("deliveryAddress").value = addr;
      }

      document.getElementById('postcode').value = data.zonecode;
      document.getElementById("detailAddress").focus();

      element_wrap.style.display = 'none';
      document.body.scrollTop = currentScroll;
    },
    onresize : function(size) {
      element_wrap.style.height = size.height+'px';
    },
    width : '100%',
    height : '100%'
  }).embed(element_wrap);

  element_wrap.style.display = 'block';
}

// 뒤로가기
function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.href = '/';
}

// 메시지 표시 함수
function showMessage(message, type) {
  const existingMessage = document.querySelector('.buying-message');
  if (existingMessage) existingMessage.remove();

  const messageDiv = document.createElement('div');
  messageDiv.className = `buying-message ${type}`;
  messageDiv.textContent = message;

  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    padding: 15px 25px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;

  switch (type) {
    case 'success':
      messageDiv.style.background = '#d4edda'; messageDiv.style.color = '#155724'; messageDiv.style.border = '1px solid #c3e6cb'; break;
    case 'warning':
      messageDiv.style.background = '#fff3cd'; messageDiv.style.color = '#856404'; messageDiv.style.border = '1px solid #ffeaa7'; break;
    case 'error':
      messageDiv.style.background = '#f8d7da'; messageDiv.style.color = '#721c24'; messageDiv.style.border = '1px solid #f5c6cb'; break;
    case 'info':
      messageDiv.style.background = '#d1ecf1'; messageDiv.style.color = '#0c5460'; messageDiv.style.border = '1px solid #bee5eb'; break;
  }

  document.body.appendChild(messageDiv);
  setTimeout(() => { if (messageDiv.parentNode) messageDiv.remove(); }, 3000);
}
