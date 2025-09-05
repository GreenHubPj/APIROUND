// 헤더 관련 JavaScript 기능들

// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
});

// 헤더 초기화 함수
function initializeHeader() {
    setupMenuInteractions();
    setupButtonAnimations();
    setupResponsiveMenu();
    console.log('GreenHub 헤더가 초기화되었습니다.');
}

// 메뉴 상호작용 설정
function setupMenuInteractions() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 활성 메뉴 표시
            removeActiveMenu();
            this.classList.add('active');
            
            // 메뉴 클릭 로그
            const menuText = this.textContent;
            console.log(`${menuText} 메뉴가 클릭되었습니다.`);
            
            // 실제 페이지 이동 로직 (추후 구현)
            handleMenuNavigation(menuText);
        });
        
        // 호버 효과 강화
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 활성 메뉴 제거
function removeActiveMenu() {
    const activeMenus = document.querySelectorAll('.menu-link.active');
    activeMenus.forEach(menu => menu.classList.remove('active'));
}

// 메뉴 네비게이션 처리
function handleMenuNavigation(menuText) {
    const menuRoutes = {
        '지역별 특산품': '/region',
        '인기 특산품': '/popular',
        '제철 특산품': '/seasonal',
        '요리법': '/recipes',
        '공지': '/notice'
    };
    
    const route = menuRoutes[menuText];
    if (route) {
        // 실제 라우팅 로직 (추후 구현)
        console.log(`${menuText} 페이지로 이동: ${route}`);
        // window.location.href = route;
    }
}

// 버튼 애니메이션 설정
function setupButtonAnimations() {
    const buttons = document.querySelectorAll('.btn-login, .btn-signup');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px) scale(1.05)';
        });
    });
}

// 반응형 메뉴 설정
function setupResponsiveMenu() {
    const header = document.querySelector('.main-header');
    const menuList = document.querySelector('.menu-list');
    
    // 모바일 메뉴 토글 기능 (추후 구현)
    if (window.innerWidth <= 768) {
        createMobileMenuToggle();
    }
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (!document.querySelector('.mobile-menu-toggle')) {
                createMobileMenuToggle();
            }
        } else {
            const mobileToggle = document.querySelector('.mobile-menu-toggle');
            if (mobileToggle) {
                mobileToggle.remove();
            }
        }
    });
}

// 모바일 메뉴 토글 생성
function createMobileMenuToggle() {
    const headerContainer = document.querySelector('.header-container');
    const menuList = document.querySelector('.menu-list');
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.innerHTML = '☰';
    toggleButton.style.cssText = `
        display: none;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 5px;
    `;
    
    if (window.innerWidth <= 768) {
        toggleButton.style.display = 'block';
    }
    
    headerContainer.insertBefore(toggleButton, menuList);
    
    toggleButton.addEventListener('click', function() {
        menuList.classList.toggle('mobile-open');
    });
}

// 로그인 처리 함수
function handleLogin() {
    console.log('로그인 버튼이 클릭되었습니다.');
    
    // 로그인 모달 또는 페이지 이동 로직
    showLoginModal();
}

// 회원가입 처리 함수
function handleSignup() {
    console.log('회원가입 버튼이 클릭되었습니다.');
    
    // 회원가입 모달 또는 페이지 이동 로직
    showSignupModal();
}

// 로그인 모달 표시 (추후 구현)
function showLoginModal() {
    console.log('로그인 모달을 표시합니다.');
    // 모달 표시 로직 구현 예정
}

// 회원가입 모달 표시 (추후 구현)
function showSignupModal() {
    console.log('회원가입 모달을 표시합니다.');
    // 모달 표시 로직 구현 예정
}

// 스크롤 시 헤더 효과 (선택사항)
function setupScrollEffects() {
    let lastScrollTop = 0;
    const header = document.querySelector('.main-header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 스크롤 다운 - 헤더 숨기기
            header.style.transform = 'translateY(-100%)';
        } else {
            // 스크롤 업 - 헤더 보이기
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// 헤더 스타일 동적 업데이트
function updateHeaderStyle() {
    const header = document.querySelector('.main-header');
    const currentHour = new Date().getHours();
    
    // 시간대별 테마 변경 (선택사항)
    if (currentHour >= 6 && currentHour < 12) {
        header.classList.add('morning-theme');
    } else if (currentHour >= 12 && currentHour < 18) {
        header.classList.add('afternoon-theme');
    } else {
        header.classList.add('evening-theme');
    }
}

// 유틸리티 함수들
const HeaderUtils = {
    // 현재 활성 메뉴 가져오기
    getActiveMenu: function() {
        return document.querySelector('.menu-link.active');
    },
    
    // 메뉴 활성화
    setActiveMenu: function(menuText) {
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            if (link.textContent === menuText) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },
    
    // 헤더 높이 가져오기
    getHeaderHeight: function() {
        return document.querySelector('.main-header').offsetHeight;
    }
};

// 전역 함수로 노출
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.HeaderUtils = HeaderUtils;
