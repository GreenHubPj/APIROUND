// 마이페이지 JavaScript
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
            case 'payment':
                showPaymentHistory();
                break;
            case 'refund':
                showRefundApplication();
                break;
            case 'return':
                showReturnExchange();
                break;
            case 'cart':
                showShoppingCart();
                break;
            case 'recipe':
                showMyRecipes();
                break;
            case 'profile':
                showProfileEdit();
                break;
            default:
                console.log('알 수 없는 모듈:', moduleType);
        }
    }
    
    // 결제 내역 페이지로 이동
    function showPaymentHistory() {
        // 실제 구현 시 결제 내역 페이지로 라우팅
        alert('결제 내역 페이지로 이동합니다.');
        // window.location.href = '/payment-history';
    }
    
    // 환불 신청 페이지로 이동
    function showRefundApplication() {
        alert('환불 신청 페이지로 이동합니다.');
        // window.location.href = '/refund-application';
    }
    
    // 반품/교환 페이지로 이동
    function showReturnExchange() {
        alert('반품/교환 페이지로 이동합니다.');
        // window.location.href = '/return-exchange';
    }
    
    // 장바구니 페이지로 이동
    function showShoppingCart() {
        window.location.href = '/shoppinglist';
    }
    
    // 내 레시피 페이지로 이동
    function showMyRecipes() {
        alert('내 레시피 페이지로 이동합니다.');
        // window.location.href = '/my-recipes';
    }
    
    // 프로필 수정 페이지로 이동
    function showProfileEdit() {
        alert('프로필 수정 페이지로 이동합니다.');
        // window.location.href = '/profile-edit';
    }
    
    // 사용자 정보 로드 (실제 구현 시 서버에서 데이터 가져오기)
    function loadUserInfo() {
        // 예시 데이터 - 실제로는 서버에서 가져와야 함
        const userInfo = {
            name: 'Yoyo Kang',
            email: 'yoyo@example.com',
            phone: '010-1234-5678',
            address: '경기도 성남시 수정구 123',
            membership: 'VIP 소비자'
        };
        
        // 사용자 정보 업데이트
        updateUserInfo(userInfo);
    }
    
    // 사용자 정보 업데이트
    function updateUserInfo(userInfo) {
        const userName = document.querySelector('.user-name');
        const userEmail = document.querySelector('.user-info-item:nth-child(2) .info-text');
        const userPhone = document.querySelector('.user-info-item:nth-child(3) .info-text');
        const userAddress = document.querySelector('.user-info-item:nth-child(4) .info-text');
        const vipBadge = document.querySelector('.badge-text');
        
        if (userName) userName.textContent = userInfo.name + '님';
        if (userEmail) userEmail.textContent = userInfo.email;
        if (userPhone) userPhone.textContent = userInfo.phone;
        if (userAddress) userAddress.textContent = userInfo.address;
        if (vipBadge) vipBadge.textContent = userInfo.membership;
    }
    
    // 페이지 로드 시 사용자 정보 로드
    loadUserInfo();
    
    // 반응형 처리
    function handleResize() {
        const modulesGrid = document.querySelector('.modules-grid');
        const container = document.querySelector('.container');
        
        if (window.innerWidth <= 480) {
            modulesGrid.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }
    
    // 윈도우 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize);
    
    // 초기 반응형 설정
    handleResize();
    
    // 모듈 아이템에 애니메이션 효과 추가
    function addAnimationToModules() {
        const modules = document.querySelectorAll('.module-item');
        
        modules.forEach((module, index) => {
            module.style.opacity = '0';
            module.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                module.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                module.style.opacity = '1';
                module.style.transform = 'translateY(0)';
            }, index * 100);
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
        item.setAttribute('aria-label', `마이페이지 기능: ${item.querySelector('.module-title').textContent}`);
    });
});
