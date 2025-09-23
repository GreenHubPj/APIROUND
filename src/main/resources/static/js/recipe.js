document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 요리법 페이지가 로드되었습니다.');

    // DOM 요소들
    const recipeCards = document.querySelectorAll('.recipe-card');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // URL 파라미터에서 검색어 정보 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const searchFromUrl = urlParams.get('search');
    
    // 검색어 표시
    if (searchInput && searchFromUrl) {
        searchInput.value = searchFromUrl;
    }


    // 요리법 카드 클릭 이벤트
    recipeCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 내부에 a.recipe-link가 있으면 그 링크로 이동
            const link = this.querySelector('a.recipe-link');
            if (link && link.href) {
                // 혹시 자식 요소 클릭이라도 항상 링크로
                e.preventDefault();
                e.stopPropagation();
                window.location.href = link.href;
            }
        });

        // 호버 효과
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 초기 로드 시 페이드 인 애니메이션
    startPageLoadAnimation();

    // 부드러운 페이징 전환을 위한 AJAX 로딩
    async function loadPageContentSmooth(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 새로운 컨텐츠 추출
            const newRecipesGrid = doc.querySelector('.recipes-grid');
            const newPaginationContainer = doc.querySelector('.pagination-container');
            
            // 현재 컨텐츠 교체
            const currentRecipesGrid = document.querySelector('.recipes-grid');
            const currentPaginationContainer = document.querySelector('.pagination-container');
            
            if (newRecipesGrid && currentRecipesGrid) {
                currentRecipesGrid.innerHTML = newRecipesGrid.innerHTML;
            }
            
            if (newPaginationContainer && currentPaginationContainer) {
                currentPaginationContainer.innerHTML = newPaginationContainer.innerHTML;
            }
            
            // URL 업데이트 (히스토리 API 사용)
            window.history.pushState({}, '', url);
            
            // 새로운 레시피들에 페이드 인 애니메이션 적용
            setTimeout(() => {
                startPageLoadAnimation();
            }, 100);
            
        } catch (error) {
            console.error('페이지 로딩 오류:', error);
            // 오류 시 전체 페이지 리로드
            window.location.href = url;
        }
    }
    
    // 부드러운 전환 효과 시작
    function startSmoothTransition() {
        // 레시피 카드들에 페이드 아웃 효과
        const recipeCards = document.querySelectorAll('.recipe-card');
        recipeCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-out');
            }, index * 20);
        });
    }
    
    // 페이지 로드 시 페이드 인 애니메이션
    function startPageLoadAnimation() {
        const recipeCards = document.querySelectorAll('.recipe-card');
        recipeCards.forEach((card, index) => {
            // 초기 상태 설정
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            // 순차적으로 페이드 인
            setTimeout(() => {
                card.style.transition = 'all 0.4s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50); // 50ms 간격으로 순차 애니메이션
        });
    }
    
    // 페이징 링크에 부드러운 전환 적용
    document.addEventListener('click', function(e) {
        // 페이징 링크 클릭 감지
        if (e.target.closest('.page-btn, .page-number')) {
            e.preventDefault();
            const link = e.target.closest('a');
            if (link && link.href) {
                // 부드러운 전환 시작
                startSmoothTransition();
                // AJAX로 부드러운 페이지 로딩
                loadPageContentSmooth(link.href);
            }
        }
    });

    console.log('요리법 페이지 초기화 완료');
});
