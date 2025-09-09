// 주문 상세 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeOrderDetailPage();
});

// 페이지 초기화
function initializeOrderDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumber = urlParams.get('orderNumber');
    const type = urlParams.get('type') || 'return';
    
    loadOrderDetail(orderNumber, type);
    setupEventListeners();
}

// 주문 상세 정보 로드
function loadOrderDetail(orderNumber, type) {
    // 실제 구현에서는 서버에서 데이터를 가져옴
    // 현재는 URL 파라미터에 따라 다른 데이터 표시
    
    if (type === 'return') {
        loadReturnDetail(orderNumber);
    } else if (type === 'exchange') {
        loadExchangeDetail(orderNumber);
    }
}

// 반품 상세 정보 로드
function loadReturnDetail(orderNumber) {
    // 페이지 제목 변경
    document.getElementById('pageTitle').textContent = '취소 상세';
    
    // 주문 정보 설정
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('processLabel').textContent = '반품접수일';
    document.getElementById('processDate').textContent = '2025/09/02';
    
    // 상태 배지 설정
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = '취소완료';
    statusBadge.className = 'status-badge';
    
    // 상품 정보 설정 (주문번호에 따라 다른 상품 표시)
    setProductInfo(orderNumber);
    
    // 처리 내역 설정
    document.getElementById('processStep1').textContent = '반품 접수';
    document.getElementById('processDesc1').textContent = '반품 요청이 접수되었습니다.';
    document.getElementById('processStep2').textContent = '처리 완료';
    document.getElementById('processDesc2').textContent = '반품 처리가 완료되었습니다.';
    
    // 환불 정보 카드 표시
    document.getElementById('refundCard').style.display = 'block';
    document.getElementById('exchangeCard').style.display = 'none';
    
    // 환불 금액 설정
    const refundAmount = document.querySelector('.refund-amount');
    refundAmount.textContent = getProductPrice(orderNumber) + '원';
}

// 교환 상세 정보 로드
function loadExchangeDetail(orderNumber) {
    // 페이지 제목 변경
    document.getElementById('pageTitle').textContent = '교환 상세';
    
    // 주문 정보 설정
    document.getElementById('orderNumber').textContent = orderNumber;
    document.getElementById('processLabel').textContent = '교환접수일';
    document.getElementById('processDate').textContent = '2025/09/15';
    
    // 상태 배지 설정
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = '교환완료';
    statusBadge.className = 'status-badge exchange';
    
    // 상품 정보 설정
    setProductInfo(orderNumber);
    
    // 처리 내역 설정
    document.getElementById('processStep1').textContent = '교환 접수';
    document.getElementById('processDesc1').textContent = '교환 요청이 접수되었습니다.';
    document.getElementById('processStep2').textContent = '교환 완료';
    document.getElementById('processDesc2').textContent = '교환이 완료되었습니다.';
    
    // 교환 정보 카드 표시
    document.getElementById('refundCard').style.display = 'none';
    document.getElementById('exchangeCard').style.display = 'block';
    
    // 타임라인 아이템에 교환 클래스 추가
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.classList.add('exchange');
    });
}

// 상품 정보 설정
function setProductInfo(orderNumber) {
    const productData = getProductData(orderNumber);
    
    document.getElementById('productName').textContent = productData.name;
    document.getElementById('productDesc').textContent = productData.description;
    document.getElementById('productQuantity').textContent = productData.quantity;
    document.getElementById('productPrice').textContent = productData.price + '원';
    
    // 상품 아이콘 설정
    const productIcon = document.querySelector('.product-icon');
    productIcon.textContent = productData.icon;
}

// 상품 데이터 가져오기
function getProductData(orderNumber) {
    const productMap = {
        '9100136994478': {
            name: '우리 쌀 백미',
            description: '우리 쌀 백미, 10kg, 1개',
            quantity: '1개',
            price: '33,000',
            icon: '🌾'
        },
        '9100136994466': {
            name: '동글동글 감자',
            description: '동글동글 감자, 1kg, 3개',
            quantity: '3개',
            price: '24,900',
            icon: '🥔'
        },
        '910013698555': {
            name: '우리 가족 사과',
            description: '못난이 사과, 2kg, 2개',
            quantity: '2개',
            price: '20,000',
            icon: '🍎'
        },
        '9100136971222': {
            name: '말랑이 복숭아',
            description: '말랑한 물복, 1kg, 1개',
            quantity: '1개',
            price: '9,900',
            icon: '🍑'
        },
        '9100136995001': {
            name: '신선한 토마토',
            description: '신선한 토마토, 1kg, 2개',
            quantity: '2개',
            price: '15,000',
            icon: '🍅'
        },
        '9100136994888': {
            name: '달콤한 딸기',
            description: '달콤한 딸기, 500g, 1개',
            quantity: '1개',
            price: '12,000',
            icon: '🍓'
        },
        '9100136994777': {
            name: '아삭한 오이',
            description: '아삭한 오이, 1kg, 3개',
            quantity: '3개',
            price: '8,500',
            icon: '🥒'
        },
        '9100136994666': {
            name: '상큼한 레몬',
            description: '상큼한 레몬, 500g, 1개',
            quantity: '1개',
            price: '6,500',
            icon: '🍋'
        }
    };
    
    return productMap[orderNumber] || {
        name: '상품 정보',
        description: '상품 상세 정보',
        quantity: '1개',
        price: '0',
        icon: '📦'
    };
}

// 상품 가격 가져오기
function getProductPrice(orderNumber) {
    const productData = getProductData(orderNumber);
    return productData.price;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 고객센터 문의 버튼들
    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.service-title').textContent;
            if (title === '전화 문의') {
                showMessage('고객센터로 연결됩니다: 1588-0000', 'info');
            } else if (title === '온라인 문의') {
                showMessage('1:1 문의 페이지로 이동합니다.', 'info');
                // 실제로는 문의 페이지로 이동
                // window.location.href = '/inquiry';
            }
        });
    });
}

// 뒤로가기 함수
function goBack() {
    // 이전 페이지로 돌아가기
    if (document.referrer) {
        window.history.back();
    } else {
        // 이전 페이지가 없으면 환불 페이지로 이동
        window.location.href = '/refund';
    }
}

// 메시지 표시 함수
function showMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.order-detail-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `order-detail-message ${type}`;
    messageDiv.textContent = message;
    
    // 스타일 적용
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 타입별 색상 설정
    switch (type) {
        case 'success':
            messageDiv.style.background = '#28a745';
            break;
        case 'error':
            messageDiv.style.background = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.background = '#ffc107';
            messageDiv.style.color = '#333';
            break;
        default:
            messageDiv.style.background = '#17a2b8';
    }
    
    // 메시지 추가
    document.body.appendChild(messageDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 300);
        }
    }, 3000);
}

// 페이지 로드 완료 후 초기화
window.addEventListener('load', function() {
    // 카드 애니메이션 효과
    const cards = document.querySelectorAll('.order-info-card, .product-info-card, .process-history-card, .refund-info-card, .exchange-info-card, .customer-service-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
});

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
