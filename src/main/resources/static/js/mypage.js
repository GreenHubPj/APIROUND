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
            case 'review':
                showReviewWrite();
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
        // 주문 내역 페이지로 이동
        window.location.href = '/orderhistory';
    }

    // 교환/환불 페이지로 이동
    function showRefundApplication() {
        window.location.href = '/refund';
    }

    // 리뷰작성 페이지로 이동
    function showReviewWrite() {
        window.location.href = '/review';
    }

    // 장바구니 페이지로 이동
    function showShoppingCart() {
        window.location.href = '/shoppinglist';
    }

    // 내 레시피 페이지로 이동
    function showMyRecipes() {
        window.location.href = '/myrecipe';
    }

    // 프로필 수정 페이지로 이동
    function showProfileEdit() {
        window.location.href = '/profile-edit';
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

    // 주문/배송조회 기능 초기화
    initializeOrderTracking();

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

    // 주문/배송조회 기능 초기화
    function initializeOrderTracking() {
        // 플로우 스텝 클릭 이벤트
        const flowSteps = document.querySelectorAll('.flow-step');

        flowSteps.forEach((step, index) => {
            step.addEventListener('click', function() {
                const stepLabel = this.querySelector('.step-label').textContent;
                showStepDetails(stepLabel, index);
            });

            // 호버 효과
            step.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
            });

            step.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // 주문 상태 업데이트 (실제 구현 시 서버에서 데이터 가져오기)
        updateOrderStatus();

        // 애니메이션 효과 추가
        addTrackingAnimations();
    }

    // 스텝 상세 정보 표시
    function showStepDetails(stepLabel, stepIndex) {
        const stepDetails = {
            0: '주문이 성공적으로 접수되었습니다.',
            1: '결제가 완료되었습니다.',
            2: '상품을 준비하고 있습니다. 곧 배송을 시작합니다.',
            3: '상품이 배송 중입니다.',
            4: '배송이 완료되었습니다.'
        };

        alert(`${stepLabel}: ${stepDetails[stepIndex] || '상태 정보가 없습니다.'}`);
    }

    // 주문 상태 업데이트
    function updateOrderStatus() {
        // 실제 구현 시 서버에서 주문 상태 데이터를 가져와서 업데이트
        const orderStatus = {
            received: 1,
            paid: 1,
            preparing: 0,
            shipping: 0,
            delivered: 0
        };

        const stepBoxes = document.querySelectorAll('.step-box');
        const stepLabels = ['주문접수', '결제완료', '상품준비중', '배송중', '배송완료'];

        stepBoxes.forEach((stepBox, index) => {
            const count = Object.values(orderStatus)[index];
            stepBox.textContent = count;
        });
    }

    // 트래킹 애니메이션 효과 추가
    function addTrackingAnimations() {
        const trackingFlow = document.querySelector('.tracking-flow');
        const flowSteps = document.querySelectorAll('.flow-step');

        // 플로우 컨테이너 애니메이션
        trackingFlow.style.opacity = '0';
        trackingFlow.style.transform = 'translateY(20px)';

        setTimeout(() => {
            trackingFlow.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            trackingFlow.style.opacity = '1';
            trackingFlow.style.transform = 'translateY(0)';
        }, 300);

        // 각 스텝 순차 애니메이션
        flowSteps.forEach((step, index) => {
            step.style.opacity = '0';
            step.style.transform = 'scale(0.9)';

            setTimeout(() => {
                step.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                step.style.opacity = '1';
                step.style.transform = 'scale(1)';
            }, 400 + (index * 100));
        });
    }

    // 주문 상태 실시간 업데이트 (실제 구현 시)
    function startRealTimeUpdates() {
        // 실제 구현 시 WebSocket이나 주기적 API 호출로 실시간 업데이트
        setInterval(() => {
            // updateOrderStatus();
        }, 30000); // 30초마다 업데이트
    }

    // 실시간 업데이트 시작
    startRealTimeUpdates();
});