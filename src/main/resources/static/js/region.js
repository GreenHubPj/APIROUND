// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 지역별 특산품 페이지가 로드되었습니다.');

    // URL 파라미터에서 지역 및 카테고리 정보 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const regionFromUrl = urlParams.get('region');
    const categoryFromUrl = urlParams.get('category');

    // 지역 필터링 관련 변수
    let currentRegion = regionFromUrl || 'all'; // URL에서 지역 정보가 있으면 사용, 없으면 'all'
    let currentCategory = categoryFromUrl || 'all'; // URL에서 카테고리 정보가 있으면 사용, 없으면 'all'
    const itemsPerPage = 5; // 한 페이지에 표시할 상품 수
    let displayedCount = 0; // 현재 표시된 상품 수

    // DOM 요소들
    const productCards = document.querySelectorAll('.product-card');
    const productsSection = document.getElementById('productsSection');
    const regionLabels = document.querySelectorAll('.region-label');
    const categoryButtons = document.querySelectorAll('.category-btn');

    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // 상품 카드 클릭 이벤트
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            const region = this.getAttribute('data-region');
            if (productId) {
                window.location.href = `/region-detail?id=${productId}&region=${region}`;
            }
        });
    });

    // 카테고리 버튼 클릭 이벤트
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 모든 카테고리 버튼에서 active 클래스 제거
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // 클릭한 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 현재 카테고리 업데이트
            currentCategory = this.getAttribute('data-category');
            
            // 상품 필터링
            filterProducts();
        });
    });

    // 검색 버튼 클릭 이벤트
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
    }
    
    // 엔터키로 검색
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // 검색 실행 함수
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        console.log('검색어:', searchTerm);
        // 통합 필터링 함수 사용
        filterProducts();
    }

    // 통합 상품 필터링 (지역 + 카테고리 + 검색)
    function filterProducts() {
        displayedCount = 0; // 표시된 상품 수 초기화
        
        productCards.forEach(card => {
            const cardRegion = card.getAttribute('data-region');
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = card.querySelector('.product-title').textContent.toLowerCase();
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
            
            let shouldShow = true;
            
            // 지역 필터링
            if (currentRegion !== 'all' && cardRegion !== currentRegion) {
                shouldShow = false;
            }
            
            // 카테고리 필터링
            if (currentCategory !== 'all' && cardCategory !== currentCategory) {
                shouldShow = false;
            }
            
            // 검색어 필터링
            if (searchTerm && !cardTitle.includes(searchTerm)) {
                shouldShow = false;
            }
            
            if (shouldShow) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
        
        // 페이지네이션 적용
        applyPagination();
        updateLoadMoreButton();
        animateVisibleCards();
    }

    // 검색어로 상품 필터링
    function filterProductsBySearch(searchTerm) {
        displayedCount = 0; // 표시된 상품 수 초기화
        
        // 모든 상품을 숨김
        productCards.forEach(card => {
            card.classList.add('hidden');
        });
        
        // 검색어에 맞는 상품만 처음 5개 표시
        showNextProductsBySearch(searchTerm);
        
        // 더보기 버튼 상태 업데이트
        updateLoadMoreButtonBySearch(searchTerm);
        
        // 애니메이션 적용
        animateVisibleCards();
    }
    
    // 검색 결과에서 다음 상품들을 표시하는 함수
    function showNextProductsBySearch(searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const visibleCards = [];
        
        productCards.forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const description = card.querySelector('.product-description').textContent.toLowerCase();
            const place = card.querySelector('.product-place').textContent.toLowerCase();
            
            if (title.includes(searchLower) || 
                description.includes(searchLower) || 
                place.includes(searchLower)) {
                visibleCards.push(card);
            }
        });
        
        // 현재 표시된 수부터 itemsPerPage만큼 더 표시
        const endIndex = Math.min(displayedCount + itemsPerPage, visibleCards.length);
        
        for (let i = displayedCount; i < endIndex; i++) {
            visibleCards[i].classList.remove('hidden');
        }
        
        displayedCount = endIndex;
        
        // 더 표시할 상품이 있는지 반환
        return displayedCount < visibleCards.length;
    }
    
    // 검색 결과에 대한 더보기 버튼 상태 업데이트
    function updateLoadMoreButtonBySearch(searchTerm) {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;
        
        const searchLower = searchTerm.toLowerCase();
        const visibleCards = [];
        
        productCards.forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const description = card.querySelector('.product-description').textContent.toLowerCase();
            const place = card.querySelector('.product-place').textContent.toLowerCase();
            
            if (title.includes(searchLower) || 
                description.includes(searchLower) || 
                place.includes(searchLower)) {
                visibleCards.push(card);
            }
        });
        
        // 모든 상품이 표시되었으면 더보기 버튼 숨김
        if (displayedCount >= visibleCards.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // 지역별 필터링 함수
    function filterProductsByRegion(region) {
        currentRegion = region;
        displayedCount = 0; // 표시된 상품 수 초기화
        
        // 모든 상품을 숨김
        productCards.forEach(card => {
            card.classList.add('hidden');
        });
        
        // 선택된 지역의 상품만 처음 5개 표시
        showNextProducts();
        
        // 더보기 버튼 상태 업데이트
        updateLoadMoreButton();
        
        // 애니메이션 적용
        animateVisibleCards();
    }

    // 다음 상품들을 표시하는 함수
    function showNextProducts() {
        const visibleCards = [];
        
        productCards.forEach(card => {
            if (currentRegion === 'all') {
                visibleCards.push(card);
            } else {
                const cardRegion = card.getAttribute('data-region');
                if (cardRegion === currentRegion) {
                    visibleCards.push(card);
                }
            }
        });
        
        // 현재 표시된 수부터 itemsPerPage만큼 더 표시
        const endIndex = Math.min(displayedCount + itemsPerPage, visibleCards.length);
        
        for (let i = displayedCount; i < endIndex; i++) {
            visibleCards[i].classList.remove('hidden');
        }
        
        displayedCount = endIndex;
        
        // 더 표시할 상품이 있는지 반환
        return displayedCount < visibleCards.length;
    }
    
    // 더보기 버튼 상태 업데이트
    function updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;
        
        const visibleCards = [];
        
        productCards.forEach(card => {
            if (currentRegion === 'all') {
                visibleCards.push(card);
            } else {
                const cardRegion = card.getAttribute('data-region');
                if (cardRegion === currentRegion) {
                    visibleCards.push(card);
                }
            }
        });
        
        // 모든 상품이 표시되었으면 더보기 버튼 숨김
        if (displayedCount >= visibleCards.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.product-card:not(.hidden)');
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

    // 지역 라벨 클릭 이벤트
    regionLabels.forEach(label => {
        label.addEventListener('click', function() {
            const regionName = this.getAttribute('data-region');
            console.log('클릭된 지역:', regionName);
            
            // 지역 라벨 활성화 상태 업데이트
            regionLabels.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 현재 지역 업데이트
            currentRegion = regionName;
            
            // 통합 필터링 함수 사용
            filterProducts();
            
            // 지도 오버레이 표시
            showRegionSelection(regionName);
        });
    });

    // 더보기 버튼 클릭 이벤트
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            console.log('더보기 버튼 클릭');
            
            // 검색어가 있는지 확인
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            
            if (searchTerm) {
                // 검색 결과에서 더보기
                const hasMore = showNextProductsBySearch(searchTerm);
                updateLoadMoreButtonBySearch(searchTerm);
                if (!hasMore) {
                    showNoMoreProductsMessage();
                }
            } else {
                // 지역 필터에서 더보기
                const hasMore = showNextProducts();
                updateLoadMoreButton();
                if (!hasMore) {
                    showNoMoreProductsMessage();
                }
            }
            
            animateVisibleCards();
        });
    }

    // 더 이상 상품이 없을 때 메시지 표시
    function showNoMoreProductsMessage() {
        const loadMoreContainer = document.querySelector('.load-more-container');
        if (loadMoreContainer) {
            loadMoreContainer.innerHTML = `
                <div class="no-more-products-message">
                    <p>더 이상 표시할 상품이 없습니다.</p>
                    <p>새로운 상품을 추가해주세요!</p>
                </div>
            `;
        }
    }

    // 상품 카드 호버 효과
    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 지도 관련 변수들
    const koreaMap = document.querySelector('#koreaMap');
    const overlays = {
        gangwon: document.querySelector('#gangwonOverlay'),
        gyeonggi: document.querySelector('#gyeonggiOverlay'),
        gyeongnam: document.querySelector('#gyeongnamOverlay'),
        gyeongbuk: document.querySelector('#gyeongbukOverlay'),
        gwangju: document.querySelector('#gwangjuOverlay'),
        daegu: document.querySelector('#daeguOverlay'),
        daejeon: document.querySelector('#daejeonOverlay'),
        busan: document.querySelector('#busanOverlay'),
        seoul: document.querySelector('#seoulOverlay'),
        ulsan: document.querySelector('#ulsanOverlay'),
        incheon: document.querySelector('#incheonOverlay'),
        jeonnam: document.querySelector('#jeonnamOverlay'),
        jeonbuk: document.querySelector('#jeonbukOverlay'),
        jeju: document.querySelector('#jejuOverlay'),
        chungnam: document.querySelector('#chungnamOverlay'),
        chungbuk: document.querySelector('#chungbukOverlay')
    };
    
    // 지역 선택 표시 함수
    function showRegionSelection(region) {
        const overlay = overlays[region];
        if (overlay) {
            // 지도에 선택 효과 적용 (블러)
            if (koreaMap) {
                koreaMap.classList.add('selected');
            }
            
            // 오버레이 표시
            overlay.style.display = 'flex';
            
            // 애니메이션 재시작
            const provinceMap = overlay.querySelector('.province-map');
            const selectionMessage = overlay.querySelector('.selection-message');
            
            if (provinceMap && selectionMessage) {
                provinceMap.style.animation = 'none';
                selectionMessage.style.animation = 'none';
                
                // 강제 리플로우
                provinceMap.offsetHeight;
                selectionMessage.offsetHeight;
                
                // 애니메이션 재시작
                provinceMap.style.animation = 'scaleIn 0.5s ease-out';
                selectionMessage.style.animation = 'fadeInUp 0.6s ease-out 0.3s both';
            }
            
            // 3초 후 자동으로 숨기기
            setTimeout(() => {
                hideRegionSelection(region);
            }, 3000);
            
            console.log(`${region}이(가) 선택되었습니다`);
        }
    }
    
    // 지역 선택 숨기기 함수
    function hideRegionSelection(region) {
        const overlay = overlays[region];
        if (overlay) {
            // 지도 선택 효과 제거
            if (koreaMap) {
                koreaMap.classList.remove('selected');
            }
            
            overlay.style.display = 'none';
        }
    }
    
    // 모든 오버레이 숨기기 함수
    function hideAllOverlays() {
        if (koreaMap) {
            koreaMap.classList.remove('selected');
        }
        Object.values(overlays).forEach(overlay => {
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    }
    
    // 오버레이 외부 클릭 시 숨기기
    document.addEventListener('click', function(e) {
        const isOverlayVisible = Object.values(overlays).some(overlay => 
            overlay && overlay.style.display === 'flex'
        );
        
        if (isOverlayVisible) {
            const clickedOverlay = Object.values(overlays).find(overlay => 
                overlay && overlay.contains(e.target)
            );
            
            // 클릭된 요소가 오버레이나 한국 지도가 아니면 모든 오버레이 숨김
            if (!clickedOverlay && !koreaMap?.contains(e.target) && !e.target.classList.contains('region-label')) {
                hideAllOverlays();
            }
        }
    });
    
    // 스크롤 시 헤더 고정 효과
    let lastScrollTop = 0;
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // 스크롤 다운
            if (header) {
                header.style.transform = 'translateY(-100%)';
            }
        } else {
            // 스크롤 업
            if (header) {
                header.style.transform = 'translateY(0)';
            }
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

    // URL에서 지역 정보가 있으면 해당 지역 자동 선택
    if (regionFromUrl) {
        console.log('URL에서 지역 정보 감지:', regionFromUrl);
        
        // 해당 지역 라벨 찾기 및 활성화
        const targetRegionLabel = document.querySelector(`[data-region="${regionFromUrl}"]`);
        if (targetRegionLabel) {
            // 모든 지역 라벨에서 active 클래스 제거
            regionLabels.forEach(label => label.classList.remove('active'));
            
            // 해당 지역 라벨에 active 클래스 추가
            targetRegionLabel.classList.add('active');
            
            // 지도 오버레이 표시
            showRegionSelection(regionFromUrl);
            
            console.log('지역 자동 선택 완료:', regionFromUrl);
        }
    }

    // URL에서 카테고리 정보가 있으면 해당 카테고리 자동 선택
    if (categoryFromUrl) {
        console.log('URL에서 카테고리 정보 감지:', categoryFromUrl);
        
        // 해당 카테고리 버튼 찾기 및 활성화
        const targetCategoryButton = document.querySelector(`[data-category="${categoryFromUrl}"]`);
        if (targetCategoryButton) {
            // 모든 카테고리 버튼에서 active 클래스 제거
            categoryButtons.forEach(button => button.classList.remove('active'));
            
            // 해당 카테고리 버튼에 active 클래스 추가
            targetCategoryButton.classList.add('active');
            
            console.log('카테고리 자동 선택 완료:', categoryFromUrl);
        }
    }
    
    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        // 반응형 처리
        filterProducts();
    });
    
    // 초기 로드 시 페이징 적용
    filterProducts();
    
    console.log('지역별 특산품 페이지 초기화 완료');
});