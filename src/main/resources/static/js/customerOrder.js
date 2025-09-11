// 고객 주문관리 페이지 JavaScript

let salesChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // 날짜 필터 기능
    initializeDateFilters();
    
    // 탭 기능
    initializeTabs();
    
    // 차트 초기화
    initializeChart();
    
    // 차트 뷰 토글
    initializeChartToggle();
    
    // 주문 상태 업데이트
    initializeOrderStatusUpdates();
    
    // 빠른 날짜 선택
    initializeQuickDateButtons();
    
    // 애니메이션 효과
    initializeAnimations();
});

// 날짜 필터 초기화
function initializeDateFilters() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const applyBtn = document.querySelector('.apply-btn');
    
    // 기본 날짜 설정
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    if (startDateInput && endDateInput) {
        startDateInput.value = formatDate(oneMonthAgo);
        endDateInput.value = formatDate(today);
    }
    
    // 적용 버튼 클릭 이벤트
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            
            if (startDate && endDate) {
                filterOrdersByDate(startDate, endDate);
                showNotification('조회 기간이 적용되었습니다.', 'success');
            } else {
                showNotification('시작일과 종료일을 모두 선택해주세요.', 'error');
            }
        });
    }
}

// 빠른 날짜 선택 초기화
function initializeQuickDateButtons() {
    const quickButtons = document.querySelectorAll('.quick-btn');
    
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 버튼에서 active 클래스 제거
            quickButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            const period = this.getAttribute('data-period');
            setQuickDateRange(period);
        });
    });
}

// 빠른 날짜 범위 설정
function setQuickDateRange(period) {
    const today = new Date();
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    let startDate, endDate;
    
    switch(period) {
        case 'today':
            startDate = endDate = today;
            break;
        case 'yesterday':
            const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
            startDate = endDate = yesterday;
            break;
        case 'thisWeek':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startDate = startOfWeek;
            endDate = today;
            break;
        case 'lastWeek':
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            startDate = lastWeekStart;
            endDate = lastWeekEnd;
            break;
        case 'thisMonth':
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            startDate = startOfMonth;
            endDate = today;
            break;
        case 'lastMonth':
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            startDate = lastMonthStart;
            endDate = lastMonthEnd;
            break;
    }
    
    if (startDateInput && endDateInput) {
        startDateInput.value = formatDate(startDate);
        endDateInput.value = formatDate(endDate);
    }
    
    // 자동으로 필터 적용
    filterOrdersByDate(formatDate(startDate), formatDate(endDate));
}

// 탭 기능 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const orderItems = document.querySelectorAll('.order-item');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼에서 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭된 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 주문 아이템 필터링
            filterOrdersByStatus(targetTab);
        });
    });
}

// 주문 상태별 필터링
function filterOrdersByStatus(status) {
    const orderItems = document.querySelectorAll('.order-item');
    
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
    
    // 일별 요약 업데이트
    updateDailySummary(status);
}

// 차트 초기화
function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    // 일별 더미 데이터
    const dailyData = {
        labels: ['9/3', '9/4', '9/5', '9/6', '9/7', '9/8', '9/9'],
        datasets: [{
            label: '일별 매출',
            data: [85000, 92000, 78000, 105000, 88000, 95000, 567000],
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#28a745',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };
    
    // 시간별 더미 데이터
    const hourlyData = {
        labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        datasets: [{
            label: '시간별 매출',
            data: [0, 0, 0, 5000, 15000, 25000, 35000, 45000, 55000, 40000, 30000, 10000],
            borderColor: '#20c997',
            backgroundColor: 'rgba(32, 201, 151, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#20c997',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        }]
    };
    
    // 차트 생성
    salesChart = new Chart(ctx, {
        type: 'line',
        data: dailyData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Noto Sans KR',
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#28a745',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '매출: ₩' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Noto Sans KR',
                            size: 11
                        },
                        color: '#6c757d'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            family: 'Noto Sans KR',
                            size: 11
                        },
                        color: '#6c757d',
                        callback: function(value) {
                            return '₩' + value.toLocaleString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    // 차트 데이터 저장
    window.chartData = {
        daily: dailyData,
        hourly: hourlyData
    };
}

// 차트 뷰 토글 초기화
function initializeChartToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // 모든 토글 버튼에서 active 클래스 제거
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 차트 뷰 변경
            changeChartView(view);
        });
    });
}

// 차트 뷰 변경
function changeChartView(view) {
    if (!salesChart || !window.chartData) return;
    
    // 차트 데이터 업데이트
    if (view === 'daily') {
        salesChart.data = window.chartData.daily;
        salesChart.data.datasets[0].borderColor = '#28a745';
        salesChart.data.datasets[0].backgroundColor = 'rgba(40, 167, 69, 0.1)';
        salesChart.data.datasets[0].pointBackgroundColor = '#28a745';
    } else {
        salesChart.data = window.chartData.hourly;
        salesChart.data.datasets[0].borderColor = '#20c997';
        salesChart.data.datasets[0].backgroundColor = 'rgba(32, 201, 151, 0.1)';
        salesChart.data.datasets[0].pointBackgroundColor = '#20c997';
    }
    
    // 차트 업데이트
    salesChart.update('active');
}

// 주문 상태 업데이트 초기화
function initializeOrderStatusUpdates() {
    const statusButtons = document.querySelectorAll('.status-button');
    
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStatus = this.textContent;
            const orderItem = this.closest('.order-item');
            const orderNumber = orderItem.querySelector('.order-number').textContent;
            
            // 상태 변경 확인
            if (confirm(`주문 ${orderNumber}의 상태를 변경하시겠습니까?`)) {
                updateOrderStatus(this, orderItem);
            }
        });
    });
}

// 주문 상태 업데이트
function updateOrderStatus(button, orderItem) {
    const currentStatus = button.textContent;
    let nextStatus, nextClass, nextText;
    
    switch(currentStatus) {
        case '신규 주문':
            nextStatus = 'confirmed';
            nextClass = 'confirmed';
            nextText = '주문 확인';
            break;
        case '주문 확인':
            nextStatus = 'preparing';
            nextClass = 'preparing';
            nextText = '배송 준비';
            break;
        case '배송 준비':
            nextStatus = 'shipping';
            nextClass = 'shipping';
            nextText = '배송중';
            break;
        case '배송중':
            nextStatus = 'completed';
            nextClass = 'completed';
            nextText = '완료';
            break;
        default:
            return;
    }
    
    // 버튼 상태 업데이트
    button.className = `status-button ${nextClass}`;
    button.textContent = nextText;
    
    // 주문 아이템 상태 업데이트
    orderItem.setAttribute('data-status', nextStatus);
    
    // 요약 카드 업데이트
    updateStatusCards();
    
    // 성공 메시지
    showNotification('주문 상태가 업데이트되었습니다.', 'success');
}

// 상태 카드 업데이트
function updateStatusCards() {
    const orderItems = document.querySelectorAll('.order-item');
    
    const counts = {
        new: 0,
        confirmed: 0,
        preparing: 0,
        shipping: 0,
        completed: 0,
        cancelled: 0
    };
    
    orderItems.forEach(item => {
        const status = item.getAttribute('data-status');
        if (counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });
    
    // 카드 번호 업데이트
    const newOrdersCard = document.querySelector('.new-orders .card-number');
    const confirmedOrdersCard = document.querySelector('.confirmed-orders .card-number');
    const cancelledOrdersCard = document.querySelector('.cancelled-orders .card-number');
    const totalOrdersCard = document.querySelector('.total-orders .card-number');
    
    if (newOrdersCard) newOrdersCard.textContent = counts.new;
    if (confirmedOrdersCard) confirmedOrdersCard.textContent = counts.confirmed;
    if (cancelledOrdersCard) cancelledOrdersCard.textContent = counts.cancelled;
    if (totalOrdersCard) totalOrdersCard.textContent = orderItems.length;
}

// 일별 요약 업데이트
function updateDailySummary(status) {
    const orderItems = document.querySelectorAll('.order-item');
    const summaryText = document.querySelector('.summary-text');
    
    let visibleOrders = 0;
    let totalAmount = 0;
    
    orderItems.forEach(item => {
        if (item.style.display !== 'none') {
            visibleOrders++;
            const amountText = item.querySelector('.order-amount').textContent;
            const amount = parseInt(amountText.replace(/[^\d]/g, ''));
            totalAmount += amount;
        }
    });
    
    if (summaryText) {
        summaryText.textContent = `주문 ${visibleOrders}건 매출 ₩${totalAmount.toLocaleString()}`;
    }
}

// 날짜별 주문 필터링
function filterOrdersByDate(startDate, endDate) {
    // 실제 구현에서는 서버에서 데이터를 가져와야 함
    console.log(`날짜 필터링: ${startDate} ~ ${endDate}`);
    
    // 예시: 모든 주문을 표시 (실제로는 필터링된 데이터를 표시)
    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach(item => {
        item.style.display = 'block';
    });
    
    // 일별 요약 업데이트
    updateDailySummary('all');
}

// 애니메이션 초기화
function initializeAnimations() {
    // 카드 애니메이션
    const cards = document.querySelectorAll('.status-card, .summary-item');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // 주문 아이템 애니메이션
    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, (index * 100) + 500);
    });
}

// 유틸리티 함수들
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
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

// 키보드 이벤트 (ESC로 알림 닫기)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }
});

// 페이지 로드 시 초기화
setTimeout(() => {
    updateStatusCards();
    updateDailySummary('all');
}, 1000);
