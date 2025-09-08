// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 지역별 특산품 페이지가 로드되었습니다.');

    // 지역 필터링 관련 변수
    let currentRegion = 'all'; // 현재 선택된 지역

    // DOM 요소들
    const productCards = document.querySelectorAll('.product-card');
    const productsSection = document.getElementById('productsSection');
    const regionLabels = document.querySelectorAll('.region-label');

    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

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
        if (searchTerm) {
            console.log('검색어:', searchTerm);
            // 검색어로 필터링
            filterProductsBySearch(searchTerm);
        } else {
            // 검색어가 없으면 현재 지역의 모든 상품 표시
            filterProductsByRegion(currentRegion);
        }
    }

    // 검색어로 상품 필터링
    function filterProductsBySearch(searchTerm) {
        const allProducts = Array.from(productCards);
        allProducts.forEach(card => {
            const title = card.querySelector('.product-title').textContent.toLowerCase();
            const description = card.querySelector('.product-description').textContent.toLowerCase();
            const place = card.querySelector('.product-place').textContent.toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            if (title.includes(searchLower) || 
                description.includes(searchLower) || 
                place.includes(searchLower)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // 지역별 필터링 함수
    function filterProductsByRegion(region) {
        currentRegion = region;
        
        productCards.forEach(card => {
            if (region === 'all') {
                // 모든 상품 표시
                card.classList.remove('hidden');
            } else {
                // 선택된 지역의 상품만 표시
                const cardRegion = card.getAttribute('data-region');
                if (cardRegion === region) {
                    card.classList.remove('hidden');
                } else {
                    card.classList.add('hidden');
                }
            }
        });
        
        // 애니메이션 적용
        animateVisibleCards();
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.product-card[style*="block"]');
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
            
            // 해당 지역 상품 필터링
            filterProductsByRegion(regionName);
            
            // 지도 오버레이 표시
            showRegionSelection(regionName);
        });
    });

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

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        // 반응형 처리
        filterProductsByRegion(currentRegion);
    });
    
    console.log('지역별 특산품 페이지 초기화 완료');
});