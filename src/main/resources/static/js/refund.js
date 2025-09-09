// 환불/교환 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeRefundPage();
});

// 페이지 초기화
function initializeRefundPage() {
    setupTabSwitching();
    setupDetailButtons();
    loadOrderData();
}

// 탭 전환 기능
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼 비활성화
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 모든 탭 컨텐츠 숨기기
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 선택된 탭 활성화
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // 탭별 데이터 로드
            loadTabData(targetTab);
        });
    });
}

// 상세보기 버튼 기능
function setupDetailButtons() {
    const detailButtons = document.querySelectorAll('.detail-btn');
    
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderItem = this.closest('.order-item');
            const orderNumber = orderItem.querySelector('.order-number').textContent;
            
            showOrderDetail(orderNumber);
        });
    });
}

// 주문 상세 정보 표시
function showOrderDetail(orderNumber) {
    // 현재 활성 탭 확인
    const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
    
    // 상세 페이지로 이동
    window.location.href = `/order-detail?orderNumber=${orderNumber}&type=${activeTab}`;
}

// 탭별 데이터 로드
function loadTabData(tabType) {
    const orderList = document.querySelector(`#${tabType}-tab .order-list`);
    
    if (tabType === 'return') {
        // 반품 데이터는 이미 HTML에 있음
        return;
    } else if (tabType === 'exchange') {
        // 교환 데이터 로드 (현재는 빈 상태)
        loadExchangeData();
    }
}

// 교환 데이터 로드
function loadExchangeData() {
    // 실제 구현에서는 서버에서 데이터를 가져옴
    // 현재는 빈 상태만 표시
    console.log('교환 데이터 로드');
}

// 주문 데이터 로드
function loadOrderData() {
    // 실제 구현에서는 서버에서 주문 데이터를 가져옴
    console.log('주문 데이터 로드');
    
    // 로딩 상태 표시 (필요시)
    // showLoading();
    
    // 데이터 로드 시뮬레이션
    setTimeout(() => {
        // hideLoading();
        console.log('주문 데이터 로드 완료');
    }, 1000);
}

// 메시지 표시 함수
function showMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.refund-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `refund-message ${type}`;
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

// 로딩 상태 표시
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
    
    const orderList = document.querySelector('.order-list');
    if (orderList) {
        orderList.innerHTML = '';
        orderList.appendChild(loadingDiv);
    }
}

// 로딩 상태 숨기기
function hideLoading() {
    const loadingDiv = document.querySelector('.loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 주문 아이템 애니메이션
function animateOrderItems() {
    const orderItems = document.querySelectorAll('.order-item');
    
    orderItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

// 페이지 스크롤 시 애니메이션
function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });
}

// 반응형 처리
function handleResize() {
    const orderDetails = document.querySelectorAll('.order-details');
    
    if (window.innerWidth <= 768) {
        orderDetails.forEach(detail => {
            detail.style.flexDirection = 'column';
            detail.style.alignItems = 'flex-start';
        });
    } else {
        orderDetails.forEach(detail => {
            detail.style.flexDirection = 'row';
            detail.style.alignItems = 'center';
        });
    }
}

// 이벤트 리스너 등록
window.addEventListener('resize', handleResize);

// 페이지 로드 완료 후 초기화
window.addEventListener('load', function() {
    animateOrderItems();
    setupScrollAnimations();
    handleResize();
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
