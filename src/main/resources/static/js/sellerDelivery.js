// 배송관리 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 탭 기능 구현
    const tabButtons = document.querySelectorAll('.tab-button');
    const orderItems = document.querySelectorAll('.order-item');
    
    // 탭 클릭 이벤트
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼에서 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭된 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 주문 아이템 필터링
            filterOrders(targetTab);
        });
    });
    
    // 주문 필터링 함수
    function filterOrders(status) {
        orderItems.forEach(item => {
            const itemStatus = item.getAttribute('data-status');
            
            if (status === 'all' || itemStatus === status) {
                item.style.display = 'block';
                // 애니메이션 효과
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 100);
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // 상태 버튼 클릭 이벤트
    const statusButtons = document.querySelectorAll('.status-button');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStatus = this.textContent;
            const orderItem = this.closest('.order-item');
            const orderNumber = orderItem.querySelector('.order-number').textContent;
            
            // 상태 변경 확인
            if (confirm(`주문 ${orderNumber}의 상태를 변경하시겠습니까?`)) {
                // 상태에 따른 다음 단계로 업데이트
                updateOrderStatus(this, orderItem);
            }
        });
    });
    
    // 주문 상태 업데이트 함수
    function updateOrderStatus(button, orderItem) {
        const currentStatus = button.textContent;
        let nextStatus, nextClass, nextText;
        
        switch(currentStatus) {
            case '배송 준비중':
                nextStatus = 'delivering';
                nextClass = 'delivering';
                nextText = '배송중';
                break;
            case '배송중':
                nextStatus = 'completed';
                nextClass = 'completed';
                nextText = '배송 완료';
                break;
            case '교환 요청':
                nextStatus = 'return';
                nextClass = 'return';
                nextText = '처리 완료';
                break;
            case '교환 진행중':
                nextStatus = 'exchange';
                nextClass = 'exchange';
                nextText = '교환 완료';
                break;
            default:
                return;
        }
        
        // 버튼 상태 업데이트
        button.className = `status-button ${nextClass}`;
        button.textContent = nextText;
        
        // 주문 아이템 상태 업데이트
        orderItem.setAttribute('data-status', nextStatus);
        
        // 액션 버튼 추가/제거
        updateActionButtons(orderItem, nextStatus);
        
        // 요약 카드 업데이트
        updateSummaryCards();
        
        // 성공 메시지
        showNotification('주문 상태가 업데이트되었습니다.', 'success');
    }
    
    // 액션 버튼 업데이트
    function updateActionButtons(orderItem, status) {
        const actionsContainer = orderItem.querySelector('.order-actions');
        const existingActionButton = actionsContainer.querySelector('.action-button');
        
        // 기존 액션 버튼 제거
        if (existingActionButton) {
            existingActionButton.remove();
        }
        
        // 상태에 따른 액션 버튼 추가
        if (status === 'delivering') {
            const invoiceButton = document.createElement('button');
            invoiceButton.className = 'action-button';
            invoiceButton.textContent = '송장 확인';
            invoiceButton.addEventListener('click', function() {
                showInvoiceModal(orderItem);
            });
            actionsContainer.appendChild(invoiceButton);
        } else if (status === 'completed') {
            const reviewButton = document.createElement('button');
            reviewButton.className = 'action-button';
            reviewButton.textContent = '리뷰 확인';
            reviewButton.addEventListener('click', function() {
                showReviewModal(orderItem);
            });
            actionsContainer.appendChild(reviewButton);
        } else if (status === 'return') {
            const processButton = document.createElement('button');
            processButton.className = 'action-button';
            processButton.textContent = '처리하기';
            processButton.addEventListener('click', function() {
                showReturnModal(orderItem);
            });
            actionsContainer.appendChild(processButton);
        } else if (status === 'exchange') {
            const progressButton = document.createElement('button');
            progressButton.className = 'action-button';
            progressButton.textContent = '진행상황';
            progressButton.addEventListener('click', function() {
                showExchangeProgressModal(orderItem);
            });
            actionsContainer.appendChild(progressButton);
        }
    }
    
    // 송장 확인 모달
    function showInvoiceModal(orderItem) {
        const orderNumber = orderItem.querySelector('.order-number').textContent;
        const productName = orderItem.querySelector('.product-name').textContent;
        
        const modal = createModal(`
            <h3>송장 정보</h3>
            <div class="invoice-info">
                <p><strong>주문번호:</strong> ${orderNumber}</p>
                <p><strong>상품명:</strong> ${productName}</p>
                <p><strong>송장번호:</strong> 1234567890</p>
                <p><strong>배송업체:</strong> CJ대한통운</p>
                <p><strong>예상배송일:</strong> 2024-01-15</p>
            </div>
            <div class="modal-actions">
                <button class="modal-button primary" onclick="closeModal()">확인</button>
                <button class="modal-button secondary" onclick="trackDelivery()">배송추적</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    // 리뷰 확인 모달
    function showReviewModal(orderItem) {
        const orderNumber = orderItem.querySelector('.order-number').textContent;
        const productName = orderItem.querySelector('.product-name').textContent;
        
        const modal = createModal(`
            <h3>고객 리뷰</h3>
            <div class="review-info">
                <p><strong>주문번호:</strong> ${orderNumber}</p>
                <p><strong>상품명:</strong> ${productName}</p>
                <div class="review-rating">
                    <span class="stars">⭐⭐⭐⭐⭐</span>
                    <span class="rating-text">5.0점</span>
                </div>
                <div class="review-content">
                    <p>"정말 신선하고 맛있었습니다! 다음에도 주문할 예정이에요."</p>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-button primary" onclick="closeModal()">확인</button>
                <button class="modal-button secondary" onclick="replyToReview()">답글달기</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    // 교환/환불 처리 모달
    function showReturnModal(orderItem) {
        const orderNumber = orderItem.querySelector('.order-number').textContent;
        const productName = orderItem.querySelector('.product-name').textContent;
        const recipientName = orderItem.querySelector('.recipient-name').textContent;
        
        const modal = createModal(`
            <h3>교환/환불 처리</h3>
            <div class="return-info">
                <p><strong>주문번호:</strong> ${orderNumber}</p>
                <p><strong>상품명:</strong> ${productName}</p>
                <p><strong>고객명:</strong> ${recipientName}</p>
                <div class="return-reason">
                    <h4>교환/환불 사유</h4>
                    <p>"상품이 손상되어 배송되었습니다. 교환을 요청드립니다."</p>
                </div>
                <div class="return-options">
                    <h4>처리 옵션</h4>
                    <div class="option-buttons">
                        <button class="option-btn" onclick="processReturn('exchange')">교환 처리</button>
                        <button class="option-btn" onclick="processReturn('refund')">환불 처리</button>
                        <button class="option-btn" onclick="processReturn('reject')">요청 거부</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-button primary" onclick="closeModal()">닫기</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    // 교환 진행상황 모달
    function showExchangeProgressModal(orderItem) {
        const orderNumber = orderItem.querySelector('.order-number').textContent;
        const productName = orderItem.querySelector('.product-name').textContent;
        const recipientName = orderItem.querySelector('.recipient-name').textContent;
        
        const modal = createModal(`
            <h3>교환 진행상황</h3>
            <div class="exchange-progress-info">
                <p><strong>주문번호:</strong> ${orderNumber}</p>
                <p><strong>상품명:</strong> ${productName}</p>
                <p><strong>고객명:</strong> ${recipientName}</p>
                
                <div class="progress-timeline">
                    <h4>교환 진행 단계</h4>
                    <div class="timeline-item completed">
                        <div class="timeline-icon">✅</div>
                        <div class="timeline-content">
                            <div class="timeline-title">교환 요청 접수</div>
                            <div class="timeline-date">2024-01-10 14:30</div>
                        </div>
                    </div>
                    <div class="timeline-item completed">
                        <div class="timeline-icon">📦</div>
                        <div class="timeline-content">
                            <div class="timeline-title">기존 상품 회수 완료</div>
                            <div class="timeline-date">2024-01-12 10:15</div>
                        </div>
                    </div>
                    <div class="timeline-item current">
                        <div class="timeline-icon">🔄</div>
                        <div class="timeline-content">
                            <div class="timeline-title">새 상품 준비중</div>
                            <div class="timeline-date">진행중</div>
                        </div>
                    </div>
                    <div class="timeline-item pending">
                        <div class="timeline-icon">🚚</div>
                        <div class="timeline-content">
                            <div class="timeline-title">새 상품 배송</div>
                            <div class="timeline-date">예정</div>
                        </div>
                    </div>
                </div>
                
                <div class="exchange-actions">
                    <h4>관리자 액션</h4>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="updateExchangeStatus('shipped')">배송 시작</button>
                        <button class="action-btn" onclick="updateExchangeStatus('completed')">교환 완료</button>
                        <button class="action-btn" onclick="contactCustomer()">고객 연락</button>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="modal-button primary" onclick="closeModal()">닫기</button>
            </div>
        `);
        
        document.body.appendChild(modal);
    }
    
    // 모달 생성 함수
    function createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        
        // 모달 배경 클릭시 닫기
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        return modal;
    }
    
    // 모달 닫기
    window.closeModal = function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    };
    
    // 배송 추적
    window.trackDelivery = function() {
        window.open('https://www.cjlogistics.com/ko/tool/parcel/tracking', '_blank');
        closeModal();
    };
    
    // 리뷰 답글
    window.replyToReview = function() {
        const reply = prompt('답글을 입력해주세요:');
        if (reply) {
            showNotification('답글이 등록되었습니다.', 'success');
            closeModal();
        }
    };
    
    // 교환/환불 처리
    window.processReturn = function(type) {
        let message = '';
        switch(type) {
            case 'exchange':
                message = '교환이 처리되었습니다.';
                break;
            case 'refund':
                message = '환불이 처리되었습니다.';
                break;
            case 'reject':
                message = '교환/환불 요청이 거부되었습니다.';
                break;
        }
        showNotification(message, 'success');
        closeModal();
    };
    
    // 교환 상태 업데이트
    window.updateExchangeStatus = function(status) {
        let message = '';
        switch(status) {
            case 'shipped':
                message = '새 상품 배송이 시작되었습니다.';
                break;
            case 'completed':
                message = '교환이 완료되었습니다.';
                break;
        }
        showNotification(message, 'success');
        closeModal();
    };
    
    // 고객 연락
    window.contactCustomer = function() {
        const phoneNumber = '010-1234-5678';
        const message = `고객 연락처: ${phoneNumber}`;
        showNotification(message, 'info');
        closeModal();
    };
    
    // 요약 카드 업데이트
    function updateSummaryCards() {
        const summaryCards = document.querySelectorAll('.summary-card');
        const orderItems = document.querySelectorAll('.order-item');
        
        const counts = {
            preparing: 0,
            delivering: 0,
            completed: 0,
            return: 0
        };
        
        orderItems.forEach(item => {
            const status = item.getAttribute('data-status');
            if (counts.hasOwnProperty(status)) {
                counts[status]++;
            }
        });
        
        // 카드 번호 업데이트
        summaryCards[0].querySelector('.summary-number').textContent = counts.preparing;
        summaryCards[1].querySelector('.summary-number').textContent = counts.delivering;
        summaryCards[2].querySelector('.summary-number').textContent = counts.completed;
        summaryCards[3].querySelector('.summary-number').textContent = counts.return;
    }
    
    // 알림 표시
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 스타일 적용
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // 타입별 색상
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db',
            warning: '#f39c12'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // 애니메이션
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 자동 제거
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 페이지 로드시 초기화
    updateSummaryCards();
    
    // 키보드 이벤트 (ESC로 모달 닫기)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});

// 모달 스타일 추가
const modalStyles = `
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .modal-content {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .modal-content h3 {
        margin: 0 0 1.5rem 0;
        color: #2c3e50;
        font-size: 1.5rem;
    }
    
    .invoice-info, .review-info {
        margin-bottom: 2rem;
    }
    
    .invoice-info p, .review-info p {
        margin: 0.5rem 0;
        color: #34495e;
    }
    
    .review-rating {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 1rem 0;
    }
    
    .stars {
        font-size: 1.2rem;
    }
    
    .rating-text {
        font-weight: 600;
        color: #f39c12;
    }
    
    .review-content {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .modal-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .modal-button.primary {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
    }
    
    .modal-button.secondary {
        background: #ecf0f1;
        color: #2c3e50;
    }
    
    .modal-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .return-info {
        margin-bottom: 2rem;
    }
    
    .return-info p {
        margin: 0.5rem 0;
        color: #34495e;
    }
    
    .return-reason {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .return-reason h4 {
        margin: 0 0 0.5rem 0;
        color: #2c3e50;
        font-size: 1rem;
    }
    
    .return-options h4 {
        margin: 1rem 0 0.5rem 0;
        color: #2c3e50;
        font-size: 1rem;
    }
    
    .option-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .option-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 100px;
    }
    
    .option-btn:nth-child(1) {
        background: #e8f5e8;
        color: #28a745;
        border: 1px solid #28a745;
    }
    
    .option-btn:nth-child(2) {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffc107;
    }
    
    .option-btn:nth-child(3) {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #dc3545;
    }
    
    .option-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    .exchange-progress-info {
        margin-bottom: 2rem;
    }
    
    .exchange-progress-info p {
        margin: 0.5rem 0;
        color: #34495e;
    }
    
    .progress-timeline {
        margin: 1.5rem 0;
    }
    
    .progress-timeline h4 {
        margin: 0 0 1rem 0;
        color: #2c3e50;
        font-size: 1rem;
    }
    
    .timeline-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.3s ease;
    }
    
    .timeline-item.completed {
        background: #e8f5e8;
        border-left: 4px solid #28a745;
    }
    
    .timeline-item.current {
        background: #d1ecf1;
        border-left: 4px solid #17a2b8;
        animation: pulse 2s infinite;
    }
    
    .timeline-item.pending {
        background: #f8f9fa;
        border-left: 4px solid #6c757d;
        opacity: 0.7;
    }
    
    .timeline-icon {
        font-size: 1.2rem;
        width: 30px;
        text-align: center;
    }
    
    .timeline-content {
        flex: 1;
    }
    
    .timeline-title {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 0.25rem;
    }
    
    .timeline-date {
        font-size: 0.9rem;
        color: #6c757d;
    }
    
    .exchange-actions {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #dee2e6;
    }
    
    .exchange-actions h4 {
        margin: 0 0 0.75rem 0;
        color: #2c3e50;
        font-size: 1rem;
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .action-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        flex: 1;
        min-width: 100px;
    }
    
    .action-btn:nth-child(1) {
        background: #e8f5e8;
        color: #28a745;
        border: 1px solid #28a745;
    }
    
    .action-btn:nth-child(2) {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #17a2b8;
    }
    
    .action-btn:nth-child(3) {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffc107;
    }
    
    .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;

// 스타일 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = modalStyles;
document.head.appendChild(styleSheet);
