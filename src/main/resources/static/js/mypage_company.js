// 업체 마이페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 모듈 클릭 이벤트 처리
    const moduleItems = document.querySelectorAll('.module-item');
    
    moduleItems.forEach(item => {
        item.addEventListener('click', function() {
            const moduleType = this.getAttribute('data-module');
            handleModuleClick(moduleType);
        });
        
        // 호버 효과를 위한 이벤트 리스너
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // 모듈 클릭 처리 함수
    function handleModuleClick(moduleType) {
        switch(moduleType) {
            case 'orders':
                showCustomerOrders();
                break;
            case 'delivery':
                showDeliveryManagement();
                break;
            case 'posts':
                showPostManagement();
                break;
            case 'company-edit':
                showCompanyEdit();
                break;
            case 'refund':
                showRefundProcessing();
                break;
            case 'products':
                showProductManagement();
                break;
            default:
                console.log('알 수 없는 모듈:', moduleType);
        }
    }
    
    // 고객 주문건 페이지로 이동
    function showCustomerOrders() {
        alert('고객 주문건 관리 페이지로 이동합니다.');
        // window.location.href = '/company/orders';
    }
    
    // 배송건 관리 페이지로 이동
    function showDeliveryManagement() {
        alert('배송건 관리 페이지로 이동합니다.');
        // window.location.href = '/company/delivery';
    }
    
    // 게시물 관리 페이지로 이동
    function showPostManagement() {
        alert('게시물 관리 페이지로 이동합니다.');
        // window.location.href = '/company/posts';
    }
    
    // 업체정보수정 페이지로 이동
    function showCompanyEdit() {
        window.location.href = '/profile-edit-company';
    }
    
    // 환불처리 페이지로 이동
    function showRefundProcessing() {
        alert('환불처리 페이지로 이동합니다.');
        // window.location.href = '/company/refund';
    }
    
    // 상품관리 페이지로 이동
    function showProductManagement() {
        window.location.href = '/item-management';
    }
    
    // 업체 정보 로드 (실제 구현 시 서버에서 데이터 가져오기)
    function loadCompanyInfo() {
        // 예시 데이터 - 실제로는 서버에서 가져와야 함
        const companyInfo = {
            name: 'Yoyo 제주 마켓',
            email: 'Yoyofarm@gangwon.com',
            phone: '033-123-4567',
            address: '제주도 제주시 애월읍 326',
            businessNumber: '123-45-67890',
            membership: '인증 업체'
        };
        
        // 업체 정보 업데이트
        updateCompanyInfo(companyInfo);
    }
    
    // 업체 정보 업데이트
    function updateCompanyInfo(companyInfo) {
        const companyName = document.querySelector('.company-name');
        const companyEmail = document.querySelector('.company-info-item:nth-child(2) .info-text');
        const companyPhone = document.querySelector('.company-info-item:nth-child(3) .info-text');
        const companyAddress = document.querySelector('.company-info-item:nth-child(4) .info-text');
        const businessNumber = document.querySelector('.company-info-item:nth-child(5) .info-text');
        const companyBadge = document.querySelector('.badge-text');
        
        if (companyName) companyName.textContent = companyInfo.name;
        if (companyEmail) companyEmail.textContent = companyInfo.email;
        if (companyPhone) companyPhone.textContent = companyInfo.phone;
        if (companyAddress) companyAddress.textContent = companyInfo.address;
        if (businessNumber) businessNumber.textContent = `사업자등록번호: ${companyInfo.businessNumber}`;
        if (companyBadge) companyBadge.textContent = companyInfo.membership;
    }
    
    // 업체 통계 로드 (실제 구현 시 서버에서 데이터 가져오기)
    function loadCompanyStats() {
        // 예시 데이터 - 실제로는 서버에서 가져와야 함
        const stats = {
            totalOrders: 156,
            completedDeliveries: 142,
            pendingOrders: 14,
            rating: 4.8
        };
        
        // 통계 업데이트
        updateCompanyStats(stats);
    }
    
    // 업체 통계 업데이트
    function updateCompanyStats(stats) {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        if (statNumbers.length >= 4) {
            statNumbers[0].textContent = stats.totalOrders;
            statNumbers[1].textContent = stats.completedDeliveries;
            statNumbers[2].textContent = stats.pendingOrders;
            statNumbers[3].textContent = stats.rating;
        }
    }
    
    // 페이지 로드 시 업체 정보 및 통계 로드
    loadCompanyInfo();
    loadCompanyStats();
    
    // 반응형 처리
    function handleResize() {
        const modulesGrid = document.querySelector('.modules-grid');
        const companyStats = document.querySelector('.company-stats');
        
        // 모듈 그리드 반응형 처리
        if (window.innerWidth <= 480) {
            modulesGrid.style.gridTemplateColumns = '1fr';
            companyStats.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
    
    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    
    // 초기 반응형 설정
    handleResize();
    
    // 모듈 아이템에 애니메이션 효과 추가
    function addAnimationToModules() {
        const modules = document.querySelectorAll('.module-item');
        const stats = document.querySelectorAll('.stat-item');
        
        // 통계 애니메이션
        stats.forEach((stat, index) => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // 모듈 애니메이션
        modules.forEach((module, index) => {
            module.style.opacity = '0';
            module.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                module.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                module.style.opacity = '1';
                module.style.transform = 'translateY(0)';
            }, (index * 100) + 400);
        });
    }
    
    // 페이지 로드 시 애니메이션 실행
    setTimeout(addAnimationToModules, 300);
    
    // 키보드 접근성 개선
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('module-item')) {
                e.preventDefault();
                focusedElement.click();
            }
        }
    });
    
    // 모듈 아이템에 탭 인덱스 추가
    moduleItems.forEach((item, index) => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `업체 마이페이지 기능: ${item.querySelector('.module-title').textContent}`);
    });
    
    // 통계 숫자 카운트 애니메이션
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach((statNumber, index) => {
            const finalValue = statNumber.textContent;
            const isDecimal = finalValue.includes('.');
            
            if (isDecimal) {
                const targetValue = parseFloat(finalValue);
                let currentValue = 0;
                const increment = targetValue / 50;
                
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        currentValue = targetValue;
                        clearInterval(timer);
                    }
                    statNumber.textContent = currentValue.toFixed(1);
                }, 30);
            } else {
                const targetValue = parseInt(finalValue);
                let currentValue = 0;
                const increment = Math.ceil(targetValue / 50);
                
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        currentValue = targetValue;
                        clearInterval(timer);
                    }
                    statNumber.textContent = currentValue;
                }, 30);
            }
        });
    }
    
    // 통계 애니메이션 실행
    setTimeout(animateNumbers, 800);
});
