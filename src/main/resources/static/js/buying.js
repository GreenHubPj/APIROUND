// 구매 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 구매 페이지가 로드되었습니다.');
    
    // 페이지 초기화
    initializeBuyingPage();
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 페이지 초기화
function initializeBuyingPage() {
    // localStorage에서 주문 정보 가져오기
    const currentOrder = JSON.parse(localStorage.getItem('currentOrder'));
    
    if (!currentOrder || currentOrder.length === 0) {
        showMessage('주문할 상품이 없습니다.', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }
    
    // 주문 상품 정보 표시
    displayOrderItems(currentOrder);
    
    // 총 금액 계산
    calculateTotalAmount(currentOrder);
}

// 주문 상품 정보 표시
function displayOrderItems(orderItems) {
    const productItemContainer = document.getElementById('orderProductItem');
    
    if (orderItems.length === 0) {
        productItemContainer.innerHTML = '<p>주문할 상품이 없습니다.</p>';
        return;
    }
    
    const item = orderItems[0]; // 첫 번째 상품 (단일 상품 주문)
    
    // 상품 이미지 처리
    const productImage = item.image && item.image !== '' 
        ? `<img src="${item.image}" alt="${item.name}" class="product-thumbnail">`
        : `<div class="product-placeholder"><span class="product-icon">🛒</span></div>`;
    
    productItemContainer.innerHTML = `
        <div class="product-image">
            ${productImage}
        </div>
        <div class="product-details">
            <div class="product-name">${item.name}</div>
            <div class="product-category">${item.category || ''} | ${item.region || ''}</div>
            <div class="product-desc">${item.quantity}</div>
            <div class="product-price">
                <span class="quantity">1개</span>
                <span class="price">${item.priceFormatted || item.price}</span>
            </div>
        </div>
    `;
}

// 총 금액 계산
function calculateTotalAmount(orderItems) {
    if (!orderItems || orderItems.length === 0) return;
    
    const item = orderItems[0];
    // price가 숫자인 경우와 문자열인 경우 모두 처리
    const productPrice = typeof item.price === 'number' ? item.price : parsePrice(item.price);
    const deliveryFee = 3000; // 배송비 고정
    const totalAmount = productPrice + deliveryFee;
    
    console.log('가격 계산:', {
        productPrice: productPrice,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount
    });
    
    // UI 업데이트
    document.getElementById('productAmount').textContent = formatPrice(productPrice);
    document.getElementById('deliveryFee').textContent = formatPrice(deliveryFee);
    document.getElementById('totalAmount').textContent = formatPrice(totalAmount);
    document.getElementById('orderAmount').textContent = formatPrice(totalAmount);
}

// 가격 파싱 (문자열에서 숫자 추출)
function parsePrice(priceString) {
    return parseInt(priceString.replace(/[^0-9]/g, ''));
}

// 가격 포맷팅
function formatPrice(price) {
    return price.toLocaleString() + '원';
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 폼 유효성 검사
    const form = document.querySelector('.buying-content');
    const inputs = form.querySelectorAll('input[required], select[required]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // 약관 동의 체크박스
    const termsCheckbox = document.getElementById('termsAgreement');
    termsCheckbox.addEventListener('change', updateOrderButton);
    
    // 주문 버튼 상태 업데이트
    updateOrderButton();
}

// 필드 유효성 검사
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // 기존 에러 메시지 제거
    clearFieldError(event);
    
    if (!value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }
    
    // 특정 필드별 유효성 검사
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
    
    // 에러 메시지 생성
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
    if (errorDiv) {
        errorDiv.remove();
    }
}

// 주문 버튼 상태 업데이트
function updateOrderButton() {
    const orderBtn = document.getElementById('orderBtn');
    const termsCheckbox = document.getElementById('termsAgreement');
    
    // 필수 필드 검사
    const requiredFields = [
        'recipientName',
        'recipientPhone', 
        'deliveryAddress'
    ];
    
    let allFieldsValid = true;
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            allFieldsValid = false;
        }
    });
    
    // 약관 동의 확인
    const termsAgreed = termsCheckbox.checked;
    
    // 버튼 활성화/비활성화
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
    console.log('주문 처리 시작');
    
    // 폼 유효성 검사
    if (!validateForm()) {
        showMessage('입력 정보를 확인해주세요.', 'warning');
        return;
    }
    
    // 주문 정보 수집
    const orderData = collectOrderData();
    
    // 주문 처리 (실제로는 서버로 전송)
    processOrderRequest(orderData);
}

// 폼 유효성 검사
function validateForm() {
    const requiredFields = [
        'recipientName',
        'recipientPhone',
        'deliveryAddress'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // 약관 동의 확인
    const termsAgreed = document.getElementById('termsAgreement').checked;
    if (!termsAgreed) {
        showMessage('약관에 동의해주세요.', 'warning');
        isValid = false;
    }
    
    return isValid;
}

// 주문 데이터 수집
function collectOrderData() {
    const currentOrder = JSON.parse(localStorage.getItem('currentOrder'));
    
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

// 주문 요청 처리
function processOrderRequest(orderData) {
    console.log('주문 데이터:', orderData);
    
    // 로딩 상태 표시
    const orderBtn = document.getElementById('orderBtn');
    const originalText = orderBtn.innerHTML;
    orderBtn.innerHTML = '<span class="order-icon">⏳</span><span class="order-text">처리 중...</span>';
    orderBtn.disabled = true;
    
    // 실제로는 서버 API 호출
    setTimeout(() => {
        // 주문 완료 처리
        handleOrderSuccess(orderData);
    }, 2000);
}

// 주문 성공 처리
function handleOrderSuccess(orderData) {
    // 주문 번호 생성 (실제로는 서버에서 받아옴)
    const orderNumber = 'ORD' + Date.now();
    
    // 주문 정보를 localStorage에 저장
    const orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
    orderHistory.unshift({
        orderNumber: orderNumber,
        ...orderData,
        status: '주문완료',
        orderDate: new Date().toLocaleDateString()
    });
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    
    // currentOrder 초기화
    localStorage.removeItem('currentOrder');
    
    // 성공 메시지 표시
    showMessage('주문이 완료되었습니다!', 'success');
    
    // 주문 완료 페이지로 이동
    setTimeout(() => {
        window.location.href = `/orderdetails?id=${orderNumber}`;
    }, 2000);
}

// 카카오 우편번호 API 관련 변수
let element_wrap;

// 주소 검색 (카카오 주소 API 사용)
function searchAddress() {
    // 카카오 우편번호 API 실행
    sample3_execDaumPostcode();
}

// 우편번호 찾기 화면 접기
function foldDaumPostcode() {
    // iframe을 넣은 element를 안보이게 한다.
    if (element_wrap) {
        element_wrap.style.display = 'none';
    }
}

// 카카오 우편번호 API 실행 함수
function sample3_execDaumPostcode() {
    // element_wrap 초기화
    element_wrap = document.getElementById('wrap');
    
    if (!element_wrap) {
        console.error('주소 검색 창을 찾을 수 없습니다.');
        return;
    }
    
    // 현재 scroll 위치를 저장해놓는다.
    var currentScroll = Math.max(document.body.scrollTop, document.documentElement.scrollTop);
    
    new daum.Postcode({
        oncomplete: function(data) {
            // 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기 한다.
            var addr = ''; // 주소 변수
            var extraAddr = ''; // 참고항목 변수

            //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
            if(data.userSelectedType === 'R'){
                // 법정동명이 있을 경우 추가한다. (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가한다.
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ')';
                }
                // 조합된 참고항목을 해당 필드에 넣는다.
                document.getElementById("deliveryAddress").value = addr + extraAddr;

            } else {
                document.getElementById("deliveryAddress").value = addr;
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            document.getElementById('postcode').value = data.zonecode;
            // 커서를 상세주소 필드로 이동한다.
            document.getElementById("detailAddress").focus();

            // iframe을 넣은 element를 안보이게 한다.
            // (autoClose:false 기능을 이용한다면, 아래 코드를 제거해야 화면에서 사라지지 않는다.)
            element_wrap.style.display = 'none';

            // 우편번호 찾기 화면이 보이기 이전으로 scroll 위치를 되돌린다.
            document.body.scrollTop = currentScroll;
        },
        // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분. iframe을 넣은 element의 높이값을 조정한다.
        onresize : function(size) {
            element_wrap.style.height = size.height+'px';
        },
        width : '100%',
        height : '100%'
    }).embed(element_wrap);

    // iframe을 넣은 element를 보이게 한다.
    element_wrap.style.display = 'block';
}

// 뒤로가기
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
}

// 메시지 표시 함수
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.buying-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `buying-message ${type}`;
    messageDiv.textContent = message;
    
    // 스타일 적용
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
    
    // 타입별 스타일
    switch (type) {
        case 'success':
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.style.border = '1px solid #c3e6cb';
            break;
        case 'warning':
            messageDiv.style.background = '#fff3cd';
            messageDiv.style.color = '#856404';
            messageDiv.style.border = '1px solid #ffeaa7';
            break;
        case 'error':
            messageDiv.style.background = '#f8d7da';
            messageDiv.style.color = '#721c24';
            messageDiv.style.border = '1px solid #f5c6cb';
            break;
        case 'info':
            messageDiv.style.background = '#d1ecf1';
            messageDiv.style.color = '#0c5460';
            messageDiv.style.border = '1px solid #bee5eb';
            break;
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
