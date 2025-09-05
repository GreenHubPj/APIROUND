// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener('click', function() {
        performSearch();
    });
    
    // 엔터키로 검색
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 검색 실행 함수
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            console.log('검색어:', searchTerm);
            // 실제 검색 로직은 서버와 연동하여 구현
            alert(`"${searchTerm}"에 대한 검색 결과를 표시합니다.`);
        } else {
            alert('검색어를 입력해주세요.');
        }
    }
    
    // 네비게이션 메뉴 활성화
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 모든 링크에서 active 클래스 제거
            navLinks.forEach(l => l.classList.remove('active'));
            
            // 클릭된 링크에 active 클래스 추가
            this.classList.add('active');
            
            // 페이지 이동 로직 (실제 구현시)
            const menuText = this.textContent;
            console.log(`${menuText} 메뉴로 이동합니다.`);
        });
    });
    
    // 로그인/회원가입 버튼 이벤트
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    
    loginBtn.addEventListener('click', function() {
        console.log('로그인 페이지로 이동');
        // 실제 로그인 페이지로 이동하는 로직
        alert('로그인 페이지로 이동합니다.');
    });
    
    signupBtn.addEventListener('click', function() {
        console.log('회원가입 페이지로 이동');
        // 실제 회원가입 페이지로 이동하는 로직
        alert('회원가입 페이지로 이동합니다.');
    });
    
    // 상품 카드 호버 효과 강화
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // 가격 정보 클릭 이벤트
    const prices = document.querySelectorAll('.price');
    prices.forEach(price => {
        price.addEventListener('click', function() {
            const priceText = this.textContent;
            console.log(`선택된 가격: ${priceText}`);
            // 실제 주문/장바구니 로직
            alert(`${priceText} 상품을 선택했습니다.`);
        });
    });
    
    // 업체 정보 클릭 이벤트
    const companyInfos = document.querySelectorAll('.company-info');
    companyInfos.forEach(info => {
        info.addEventListener('click', function() {
            const companyName = this.querySelector('p:last-child').textContent;
            console.log(`업체 연락: ${companyName}`);
            // 실제 연락처 표시 또는 연락 로직
            alert(`${companyName} 업체에 연락합니다.`);
        });
    });
    
    // 한국 지도 클릭 이벤트 (지역별 특산품으로 이동)
    const koreaMap = document.querySelector('.korea-map');
    if (koreaMap) {
        koreaMap.addEventListener('click', function() {
            console.log('지역별 특산품 페이지로 이동');
            // 실제 지역별 특산품 페이지로 이동하는 로직
            alert('지역별 특산품 페이지로 이동합니다.');
        });
    }
    
    // 스크롤 시 헤더 고정 효과
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 스크롤 다운
            header.style.transform = 'translateY(-100%)';
        } else {
            // 스크롤 업
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // 이미지 로드 에러 처리
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            console.log('이미지 로드 실패:', this.src);
            // 기본 이미지로 대체하거나 에러 메시지 표시
            this.style.display = 'none';
        });
    });
    
    // 반응형 메뉴 토글 (모바일용)
    function createMobileMenu() {
        if (window.innerWidth <= 768) {
            const navContainer = document.querySelector('.nav-container');
            const navMenu = document.querySelector('.nav-menu');
            
            // 모바일 메뉴 버튼이 없으면 생성
            if (!document.querySelector('.mobile-menu-btn')) {
                const mobileMenuBtn = document.createElement('button');
                mobileMenuBtn.className = 'mobile-menu-btn';
                mobileMenuBtn.innerHTML = '☰';
                mobileMenuBtn.style.cssText = `
                    display: block;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #333;
                `;
                
                navContainer.insertBefore(mobileMenuBtn, navMenu);
                
                mobileMenuBtn.addEventListener('click', function() {
                    navMenu.style.display = navMenu.style.display === 'none' ? 'flex' : 'none';
                });
            }
        }
    }
    
    // 초기 모바일 메뉴 설정
    createMobileMenu();
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        createMobileMenu();
    });
    
    console.log('GreenHub 제철 특산품 페이지가 로드되었습니다.');
});
