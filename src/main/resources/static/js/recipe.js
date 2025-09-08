document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 요리법 페이지가 로드되었습니다.');

    // DOM 요소들
    const categoryButtons = document.querySelectorAll('.category-btn');
    const recipeCards = document.querySelectorAll('.recipe-card');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // 현재 활성화된 카테고리
    let currentCategory = 'all';

    // 카테고리 버튼 클릭 이벤트
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 버튼에서 active 클래스 제거
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 현재 카테고리 업데이트
            currentCategory = this.getAttribute('data-category');
            
            console.log('카테고리 변경:', currentCategory);
            
            // 요리법 필터링
            filterRecipes(currentCategory);
        });
    });

    // 검색 기능
    if (searchInput && searchBtn) {
        // 검색 버튼 클릭 이벤트
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm) {
                console.log('검색어:', searchTerm);
                searchRecipes(searchTerm);
            } else {
                // 검색어가 없으면 현재 카테고리로 필터링
                filterRecipes(currentCategory);
            }
        });

        // 엔터키 검색 이벤트
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim().toLowerCase();
                if (searchTerm) {
                    console.log('검색어:', searchTerm);
                    searchRecipes(searchTerm);
                } else {
                    filterRecipes(currentCategory);
                }
            }
        });

        // 검색 입력 필드 포커스 효과
        searchInput.addEventListener('focus', function() {
            this.style.transform = 'scale(1.02)';
        });

        searchInput.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    }

    // 요리법 카드 클릭 이벤트
    recipeCards.forEach(card => {
        card.addEventListener('click', function() {
            const recipeName = this.querySelector('.recipe-name').textContent;
            console.log('요리법 클릭:', recipeName);
            
            // 애플파이인 경우 recipe-detail 페이지로 이동
            if (recipeName === '애플파이') {
                window.location.href = '/recipe-detail';
            } else {
                // 다른 요리법인 경우 등록 메시지 표시
                alert(`${recipeName} 레시피를 등록해주세요!`);
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

    // 요리법 필터링 함수
    function filterRecipes(category) {
        recipeCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            
            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
                card.classList.add('active');
                
                // 애니메이션 효과
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.style.display = 'none';
                card.classList.remove('active');
            }
        });
    }

    // 검색 함수
    function searchRecipes(searchTerm) {
        recipeCards.forEach(card => {
            const recipeName = card.querySelector('.recipe-name').textContent.toLowerCase();
            const recipeDescription = card.querySelector('.recipe-description').textContent.toLowerCase();
            const cardCategory = card.getAttribute('data-category');
            
            // 검색어가 제목이나 설명에 포함되어 있고, 현재 카테고리와 일치하는 경우
            if ((recipeName.includes(searchTerm) || recipeDescription.includes(searchTerm)) &&
                (currentCategory === 'all' || cardCategory === currentCategory)) {
                card.style.display = 'block';
                card.classList.add('active');
                
                // 검색어 하이라이트 효과
                highlightSearchTerm(card, searchTerm);
                
                // 애니메이션 효과
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.style.display = 'none';
                card.classList.remove('active');
            }
        });
    }

    // 검색어 하이라이트 함수
    function highlightSearchTerm(card, searchTerm) {
        const recipeName = card.querySelector('.recipe-name');
        const recipeDescription = card.querySelector('.recipe-description');
        
        // 기존 하이라이트 제거
        recipeName.innerHTML = recipeName.textContent;
        recipeDescription.innerHTML = recipeDescription.textContent;
        
        // 새로운 하이라이트 적용
        if (recipeName.textContent.toLowerCase().includes(searchTerm)) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            recipeName.innerHTML = recipeName.textContent.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>');
        }
        
        if (recipeDescription.textContent.toLowerCase().includes(searchTerm)) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            recipeDescription.innerHTML = recipeDescription.textContent.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>');
        }
    }

    // 초기 로드시 모든 요리법 표시
    filterRecipes('all');

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

    // 애니메이션 대상 요소들
    const animatedElements = document.querySelectorAll('.recipe-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // 페이지 로드 완료 메시지
    console.log('요리법 페이지 초기화 완료');
});
