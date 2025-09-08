document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 요리법 페이지가 로드되었습니다.');

    // DOM 요소들
    const categoryButtons = document.querySelectorAll('.category-btn');
    const recipeCards = document.querySelectorAll('.recipe-card');
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // 현재 활성화된 카테고리
    let currentCategory = 'all';

    // 페이징 관련 변수
    let currentPage = 1;
    const itemsPerPage = 12;
    
    // 실제 데이터 개수 계산
    const totalItems = recipeCards.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    console.log(`총 요리법 개수: ${totalItems}, 총 페이지 수: ${totalPages}`);

    // 동적 페이징 UI 생성 함수
    function createPaginationUI() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) {
            console.log('페이징 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            console.log('페이징이 필요하지 않습니다. 모든 요리법이 1페이지에 표시됩니다.');
            return;
        }
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                <span id="pageInfo">1페이지 (1-${Math.min(itemsPerPage, totalItems)} / 총 ${totalItems}개)</span>
            </div>
            <div class="pagination">
                <button class="page-btn prev-btn" id="prevBtn" disabled>
                    <span>← 이전</span>
                </button>
                <div class="page-numbers" id="pageNumbers">
                    ${generatePageNumbers()}
                </div>
                <button class="page-btn next-btn" id="nextBtn" ${totalPages === 1 ? 'disabled' : ''}>
                    <span>다음 →</span>
                </button>
            </div>
        `;
        
        // 이벤트 리스너 추가
        addPaginationEventListeners();
    }
    
    // 페이지 번호 생성 함수
    function generatePageNumbers() {
        let pageNumbersHTML = '';
        const maxVisiblePages = 5; // 최대 5개 페이지 번호 표시
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // 시작 페이지 조정
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHTML += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        return pageNumbersHTML;
    }
    
    // 페이징 이벤트 리스너 추가
    function addPaginationEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.querySelectorAll('.page-number');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    showPage(currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    showPage(currentPage + 1);
                }
            });
        }
        
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                showPage(page);
            });
        });
    }

    // 페이지 표시 함수
    function showPage(page) {
        currentPage = page;
        
        // 모든 요리법 카드 숨기기
        recipeCards.forEach(card => {
            card.classList.add('hidden');
        });
        
        // 현재 페이지의 요리법만 보이기
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        for (let i = startIndex; i < endIndex; i++) {
            if (recipeCards[i]) {
                recipeCards[i].classList.remove('hidden');
            }
        }
        
        // 페이징 UI 업데이트
        updatePaginationUI();
        
        // 애니메이션 적용
        animateVisibleCards();
    }
    
    // 페이징 UI 업데이트 함수
    function updatePaginationUI() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const pageNumbers = document.querySelectorAll('.page-number');
        
        // 이전/다음 버튼 상태 업데이트
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }
        
        // 페이지 번호 활성화 상태 업데이트
        pageNumbers.forEach(btn => {
            const page = parseInt(btn.getAttribute('data-page'));
            btn.classList.toggle('active', page === currentPage);
        });
        
        // 페이지 정보 업데이트
        if (pageInfo) {
            const startIndex = (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
            pageInfo.textContent = `${currentPage}페이지 (${startIndex}-${endIndex} / 총 ${totalItems}개)`;
        }
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.recipe-card:not(.hidden)');
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

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
                card.classList.remove('hidden');
                card.classList.add('active');
                
                // 애니메이션 효과
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.classList.add('hidden');
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
                card.classList.remove('hidden');
                card.classList.add('active');
                
                // 검색어 하이라이트 효과
                highlightSearchTerm(card, searchTerm);
                
                // 애니메이션 효과
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.classList.add('hidden');
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

    // 페이징 UI 생성 및 초기화
    createPaginationUI();
    
    // 총 페이지가 1개 이하면 페이징 적용하지 않음
    if (totalPages > 1) {
        // 첫 번째 페이지 표시
        showPage(1);
    } else {
        // 모든 카드가 1페이지에 표시되므로 페이징 적용하지 않음
        console.log('모든 요리법이 1페이지에 표시됩니다.');
    }

    // 페이지 로드 완료 메시지
    console.log('요리법 페이지 초기화 완료');
});
