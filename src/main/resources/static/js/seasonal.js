document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 이달의 특산품 페이지가 로드되었습니다.');

    // 현재 월 정보
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 0-11을 1-12로 변환
    const seasonInfo = ['❄️ 겨울의 계절', '🌸 봄의 시작', '🌱 봄의 계절', '🌿 봄의 완성', 
                       '🌺 여름의 시작', '☀️ 여름의 계절', '🌻 여름의 절정', '🍃 여름의 끝',
                       '🍂 가을 수확의 계절', '🍁 가을의 계절', '🌰 가을의 완성', '❄️ 겨울의 계절'];

    // 월별 정보 업데이트
    updateMonthlyInfo(currentMonth);

    // 페이징 관련 변수
    let currentPage = 1;
    const itemsPerPage = 12;
    
    // DOM 요소들
    const productCards = document.querySelectorAll('.product-card');
    const paginationContainer = document.getElementById('paginationContainer');
    
    // 실제 데이터 개수 계산
    const totalItems = productCards.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    console.log(`총 상품 개수: ${totalItems}, 총 페이지 수: ${totalPages}`);

    // 상품 카드 클릭 이벤트
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productName = this.querySelector('.product-name').textContent;
            console.log('상품 클릭:', productName);
            
            // 상품 상세 정보 표시 (실제 구현시 상세 페이지로 이동)
            alert(`${productName} 상세 정보를 보여드립니다!`);
        });

        // 호버 효과
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 페이징 UI 생성 및 초기화
    createPaginationUI();

    // 동적 페이징 UI 생성 함수
    function createPaginationUI() {
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
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
        
        // 모든 상품 카드 숨기기
        productCards.forEach(card => {
            card.style.display = 'none';
        });
        
        // 현재 페이지의 상품만 보이기
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        for (let i = startIndex; i < endIndex; i++) {
            if (productCards[i]) {
                productCards[i].style.display = 'block';
            }
        }
        
        // 페이징 UI 업데이트
        updatePaginationUI();
        
        // 애니메이션 재시작
        animateVisibleCards();
    }
    
    // 페이징 UI 업데이트 함수
    function updatePaginationUI() {
        const pageNumbers = document.querySelectorAll('.page-number');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        
        // 페이지 번호 업데이트
        pageNumbers.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.getAttribute('data-page')) === currentPage) {
                btn.classList.add('active');
            }
        });
        
        // 이전/다음 버튼 상태 업데이트
        if (prevBtn) prevBtn.disabled = (currentPage === 1);
        if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
        
        // 페이지 정보 업데이트
        if (pageInfo) {
            const startItem = (currentPage - 1) * itemsPerPage + 1;
            const endItem = Math.min(currentPage * itemsPerPage, totalItems);
            pageInfo.textContent = `${currentPage}페이지 (${startItem}-${endItem} / 총 ${totalItems}개)`;
        }
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.product-card[style*="block"]');
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // 월별 정보 업데이트 함수
    function updateMonthlyInfo(month) {
        const monthBadge = document.querySelector('.month-badge');
        const seasonText = document.querySelector('.season-text');
        const pageSubtitle = document.querySelector('.page-subtitle');
        
        if (monthBadge) {
            monthBadge.textContent = monthNames[month - 1];
        }
        
        if (seasonText) {
            seasonText.textContent = seasonInfo[month - 1];
        }
        
        if (pageSubtitle) {
            const seasonNames = ['겨울철', '봄철', '봄철', '봄철', '여름철', '여름철', 
                               '여름철', '여름철', '가을철', '가을철', '가을철', '겨울철'];
            pageSubtitle.textContent = `${month}월, ${seasonNames[month - 1]} 최고의 신선함을 만나보세요`;
        }
    }

    // 초기 페이지 로드
    showPage(1);

    // 페이지 로드 완료 메시지
    console.log('이달의 특산품 페이지 초기화 완료');
});
