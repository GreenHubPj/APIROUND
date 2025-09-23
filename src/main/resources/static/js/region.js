// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 지역별 특산품 페이지가 로드되었습니다.');

    // URL 파라미터에서 지역 및 카테고리 정보 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const regionFromUrl = urlParams.get('region');
    const categoryFromUrl = urlParams.get('type'); // 서버에서는 'type' 파라미터 사용
    
    console.log('URL 파라미터 - region:', regionFromUrl, 'type:', categoryFromUrl);

    // DOM 요소들
    const productCards = document.querySelectorAll('.product-card');
    const searchInput = document.getElementById('searchInput');
    const regionLabels = document.querySelectorAll('.region-label');
    const categoryLabels = document.querySelectorAll('.category-btn');
    
    // 가격 정보 로드 (서버에서 이미 페이징된 상품들만)
    loadProductPrices();
    
    // 가격 정보 로드 함수 (서버에서 페이징된 상품들만)
    async function loadProductPrices() {
        
        // 모든 상품에 대해 가격 정보 로드 (서버에서 이미 페이징됨)
        productCards.forEach(async (card) => {
            const productId = card.getAttribute('data-product-id');
            if (!productId) return;
            
            try {
                const response = await fetch(`/api/product-prices/${productId}`);
                if (response.ok) {
                    const prices = await response.json();
                    const priceContainer = card.querySelector('.product-prices');
                    if (priceContainer && prices.length > 0) {
                        // 최저가 표시
                        const minPrice = Math.min(...prices.map(p => p.price));
                        priceContainer.innerHTML = `
                            <div class="price-display">
                                <span class="price-amount">${minPrice.toLocaleString()}원~</span>
                            </div>
                        `;
                    } else if (priceContainer) {
                        // 가격 정보가 없는 경우
                        priceContainer.innerHTML = `
                            <div class="price-display">
                                <span class="price-amount">업체 문의</span>
                            </div>
                        `;
                    }
                }
            } catch (error) {
                const priceContainer = card.querySelector('.product-prices');
                if (priceContainer) {
                    priceContainer.innerHTML = `
                        <div class="price-display">
                            <span class="price-amount">업체 문의</span>
                        </div>
                    `;
                }
            }
        });
    }
    
    // 지역 필터링
    regionLabels.forEach(label => {
        label.addEventListener('click', function() {
            const regionCode = this.getAttribute('data-region');
            const regionName = this.textContent.trim();
            
            // 부드러운 전환 시작
            startSmoothTransition();
            
            // 모든 지역 라벨에서 active 클래스 제거
            regionLabels.forEach(l => l.classList.remove('active'));
            // 클릭한 라벨에 active 클래스 추가
            this.classList.add('active');
            
            // URL 파라미터로 지역 필터링
            const url = new URL(window.location);
            if (regionCode === 'all') {
                url.searchParams.delete('region');
            } else {
                url.searchParams.set('region', regionCode);
            }
            url.searchParams.delete('page'); // 페이지를 0으로 리셋
            
            // 부드러운 전환 시작
            startSmoothTransition();
            setTimeout(() => {
                window.location.href = url.toString();
            }, 200);
        });
    });

    // 카테고리 필터링
    categoryLabels.forEach(label => {
        label.addEventListener('click', function() {
            const categoryCode = this.getAttribute('data-category');
            
            // 모든 카테고리 라벨에서 active 클래스 제거
            categoryLabels.forEach(l => l.classList.remove('active'));
            // 클릭한 라벨에 active 클래스 추가
            this.classList.add('active');
            
            // 부드러운 전환 시작
            startSmoothTransition();
            
            // URL 파라미터로 카테고리 필터링
            const url = new URL(window.location);
            if (categoryCode === 'all') {
                url.searchParams.delete('type');
            } else {
                url.searchParams.set('type', categoryCode);
            }
            url.searchParams.delete('page'); // 페이지를 0으로 리셋
            
            // 부드러운 전환 시작
            startSmoothTransition();
            setTimeout(() => {
                window.location.href = url.toString();
            }, 200);
        });
    });

    // 검색 기능
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim();
        
        // 부드러운 전환 시작
        startSmoothTransition();
        
        if (searchTerm === '') {
            // 검색어가 없으면 필터 제거
            const url = new URL(window.location);
            url.searchParams.delete('search');
            url.searchParams.delete('page');
            startSmoothTransition();
            setTimeout(() => {
                window.location.href = url.toString();
            }, 200);
            return;
        }
        
        // URL 파라미터로 검색어 전달
        const url = new URL(window.location);
        url.searchParams.set('search', searchTerm);
        url.searchParams.delete('page');
        startSmoothTransition();
        setTimeout(() => {
            window.location.href = url.toString();
        }, 200);
    }
    
    // 검색 버튼 이벤트
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
        // 현재 선택된 지역/카테고리 표시
        const currentRegion = regionFromUrl || 'all';
        const currentCategory = categoryFromUrl || 'all';
        
        // 지역 라벨 활성화
        regionLabels.forEach(label => {
            const regionCode = label.getAttribute('data-region');
            if (regionCode === currentRegion) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
        
        // 카테고리 라벨 활성화
        categoryLabels.forEach(label => {
            const categoryCode = label.getAttribute('data-category');
            if (categoryCode === currentCategory) {
                label.classList.add('active');
        } else {
                label.classList.remove('active');
            }
        });
        
        // 선택된 지역 섹션 표시
        updateSelectedRegionSection(currentRegion);
    
        // 검색어 표시
        const searchTerm = urlParams.get('search');
        if (searchInput && searchTerm) {
            searchInput.value = searchTerm;
        }
        
        // 페이지 로드 시 페이드 인 효과
        startPageLoadAnimation();
        
        // 모든 링크 클릭에 부드러운 전환 적용
        document.addEventListener('click', function(e) {
            // 페이징 링크 클릭 감지
            if (e.target.closest('.page-btn, .page-number')) {
                e.preventDefault();
                const link = e.target.closest('a');
                if (link && link.href) {
                    // 부드러운 전환 시작
                    startSmoothTransition();
                    // 200ms 후 페이지 이동 (간단하고 빠른 방식)
                    setTimeout(() => {
                        window.location.href = link.href;
                    }, 200);
                }
            }
        });
    });
    
    // 선택된 지역 섹션 업데이트 함수
    function updateSelectedRegionSection(regionCode) {
    const selectedRegionSection = document.getElementById('selectedRegionSection');
    const selectedRegionName = document.getElementById('selectedRegionName');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');

        if (!selectedRegionSection || !selectedRegionName || !clearSelectionBtn) {
            console.log('선택된 지역 섹션 요소를 찾을 수 없습니다.');
            return;
        }
        
        if (regionCode && regionCode !== 'all') {
            // 지역 코드를 한글 지역명으로 변환
            const regionName = getKoreanRegionName(regionCode);
            selectedRegionName.textContent = regionName;
            selectedRegionSection.style.display = 'block';
            
            // 선택 해제 버튼 이벤트
            clearSelectionBtn.onclick = function() {
                const url = new URL(window.location);
                url.searchParams.delete('region');
                url.searchParams.delete('page');
                window.location.href = url.toString();
            };
        } else {
            selectedRegionSection.style.display = 'none';
        }
    }
    
    // 지역 코드를 한글 지역명으로 변환하는 함수
    function getKoreanRegionName(regionCode) {
        const regionMap = {
            'seoul': '서울',
            'gyeonggi': '경기도',
            'incheon': '인천',
            'gangwon': '강원도',
            'chungbuk': '충청북도',
            'chungnam': '충청남도',
            'daejeon': '대전',
            'jeonbuk': '전라북도',
            'jeonnam': '전라남도',
            'gwangju': '광주',
            'gyeongbuk': '경상북도',
            'gyeongnam': '경상남도',
            'daegu': '대구',
            'busan': '부산',
            'ulsan': '울산',
            'jeju': '제주도'
        };
        return regionMap[regionCode] || regionCode;
    }

    // 부드러운 전환 효과 시작
    function startSmoothTransition() {
        // 상품 카드들에 페이드 아웃 효과
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-out');
            }, index * 20); // 순차적으로 페이드 아웃
        });
    }
    
    // 페이지 로드 시 페이드 인 애니메이션
    function startPageLoadAnimation() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
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
    
