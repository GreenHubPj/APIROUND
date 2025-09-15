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
    
    // 선택된 지역 표시 관련 요소들
    const selectedRegionSection = document.getElementById('selectedRegionSection');
    const selectedRegionName = document.getElementById('selectedRegionName');
    const clearSelectionBtn = document.getElementById('clearSelectionBtn');

    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    // 지역명을 한글로 변환하는 함수
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
            'ulsan': '울산',
            'busan': '부산',
            'jeju': '제주도'
        };
        return regionMap[regionCode] || regionCode;
    }

    // 지역명 매칭 함수 (다양한 형태의 지역명을 매칭)
    function isRegionMatch(regionCode, regionText) {
        if (!regionText) return false;
        
        const regionTextLower = regionText.toLowerCase();
        
        // 지역 코드에 따른 매칭 패턴
        const regionPatterns = {
            'seoul': ['서울', '서울특별시', '서울시'],
            'gyeonggi': ['경기', '경기도', '경기시'],
            'incheon': ['인천', '인천광역시', '인천시'],
            'gangwon': ['강원', '강원도', '강원시'],
            'chungbuk': ['충북', '충청북도', '충북시'],
            'chungnam': ['충남', '충청남도', '충남시'],
            'daejeon': ['대전', '대전광역시', '대전시'],
            'jeonbuk': ['전북', '전라북도', '전북시'],
            'jeonnam': ['전남', '전라남도', '전남시'],
            'gwangju': ['광주', '광주광역시', '광주시'],
            'gyeongbuk': ['경북', '경상북도', '경북시'],
            'gyeongnam': ['경남', '경상남도', '경남시'],
            'daegu': ['대구', '대구광역시', '대구시'],
            'ulsan': ['울산', '울산광역시', '울산시'],
            'busan': ['부산', '부산광역시', '부산시'],
            'jeju': ['제주', '제주도', '제주특별자치도']
        };
        
        const patterns = regionPatterns[regionCode];
        if (!patterns) return false;
        
        // 패턴 중 하나라도 매칭되면 true
        return patterns.some(pattern => 
            regionTextLower.includes(pattern.toLowerCase())
        );
    }

    // 선택된 지역 표시 함수
    function showSelectedRegion(regionName) {
        if (selectedRegionSection && selectedRegionName) {
            const koreanName = getKoreanRegionName(regionName);
            selectedRegionName.textContent = koreanName;
            selectedRegionSection.style.display = 'block';
        }
    }

    // 선택된 지역 숨기기 함수
    function hideSelectedRegion() {
        if (selectedRegionSection) {
            selectedRegionSection.style.display = 'none';
        }
    }

    // 선택 취소 함수
    function clearRegionSelection() {
        currentRegion = 'all';
        hideSelectedRegion();
        
        // 모든 지역 라벨에서 active 클래스 제거
        regionLabels.forEach(label => {
            label.classList.remove('active');
        });
        
        // 상품 필터링 다시 실행
        filterProducts();
    }

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

    // 선택 취소 버튼 이벤트 리스너
    if (clearSelectionBtn) {
        clearSelectionBtn.addEventListener('click', function() {
            clearRegionSelection();
        });
    }

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
        
        // 먼저 모든 상품을 숨김
        productCards.forEach(card => {
            card.classList.add('hidden');
        });
        
        // 필터링된 상품들을 처음 5개만 표시
        showNextProducts();
        
        // 더보기 버튼 상태 업데이트
        updateLoadMoreButton();
        animateVisibleCards();
    }

    // 페이지네이션 적용 함수
    function applyPagination() {
        // 현재 표시된 상품 수를 초기화하고 처음 5개만 표시
        displayedCount = 0;
        showNextProducts();
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
        
        console.log('showNextProducts 호출됨');
        console.log('현재 지역:', currentRegion);
        console.log('현재 카테고리:', currentCategory);
        console.log('현재 표시된 수:', displayedCount);
        
        productCards.forEach(card => {
            const cardRegion = card.getAttribute('data-region');
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = card.querySelector('.product-title').textContent.toLowerCase();
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
            
            let shouldShow = true;
            
            // 지역 필터링
            if (currentRegion !== 'all') {
                const regionTextElement = card.querySelector('.product-place');
                const regionText = regionTextElement ? regionTextElement.textContent : '';
                
                if (!isRegionMatch(currentRegion, regionText) && cardRegion !== currentRegion) {
                    shouldShow = false;
                }
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
                visibleCards.push(card);
            }
        });
        
        console.log('필터링된 상품 수:', visibleCards.length);
        
        // 현재 표시된 수부터 itemsPerPage만큼 더 표시
        const endIndex = Math.min(displayedCount + itemsPerPage, visibleCards.length);
        console.log('표시할 범위:', displayedCount, '~', endIndex);
        
        for (let i = displayedCount; i < endIndex; i++) {
            visibleCards[i].classList.remove('hidden');
            console.log('상품 표시됨:', i, visibleCards[i].querySelector('.product-title').textContent);
        }
        
        displayedCount = endIndex;
        console.log('업데이트된 표시된 수:', displayedCount);
        
        // 더 표시할 상품이 있는지 반환
        const hasMore = displayedCount < visibleCards.length;
        console.log('더 표시할 상품이 있는가:', hasMore);
        
        return hasMore;
    }
    
    // 더보기 버튼 상태 업데이트
    function updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (!loadMoreBtn) return;
        
        const visibleCards = [];
        
        productCards.forEach(card => {
            const cardRegion = card.getAttribute('data-region');
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = card.querySelector('.product-title').textContent.toLowerCase();
            const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
            
            let shouldShow = true;
            
            // 지역 필터링
            if (currentRegion !== 'all') {
                const regionTextElement = card.querySelector('.product-place');
                const regionText = regionTextElement ? regionTextElement.textContent : '';
                
                if (!isRegionMatch(currentRegion, regionText) && cardRegion !== currentRegion) {
                    shouldShow = false;
                }
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
            
            // 선택된 지역 표시
            showSelectedRegion(regionName);
            
            // 통합 필터링 함수 사용
            filterProducts();
        });
    });

    // 더보기 버튼 클릭 이벤트
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    console.log('더보기 버튼 요소:', loadMoreBtn);
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            console.log('더보기 버튼 클릭됨');
            console.log('현재 표시된 상품 수:', displayedCount);
            
            // 다음 상품들을 표시
            const hasMore = showNextProducts();
            console.log('더 표시할 상품이 있는가:', hasMore);
            console.log('클릭 후 표시된 상품 수:', displayedCount);
            
            // 더보기 버튼 상태 업데이트
            updateLoadMoreButton();
            
            // 더 이상 상품이 없으면 메시지 표시
            if (!hasMore) {
                console.log('더 이상 표시할 상품이 없음');
                showNoMoreProductsMessage();
            }
            
            // 애니메이션 적용
            animateVisibleCards();
        });
    } else {
        console.error('더보기 버튼을 찾을 수 없습니다!');
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
            
            // 선택된 지역 표시
            showSelectedRegion(regionFromUrl);
            
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
    
    // 상품 ID와 타입에 따른 일관된 가격 생성 (region-detail.js와 동일한 로직)
    function generateConsistentPrices(productId, productType) {
        const basePrices = {
            '농산물': { min: 5000, max: 15000 },
            '축산물': { min: 15000, max: 35000 },
            '수산물': { min: 10000, max: 25000 },
            '가공식품': { min: 3000, max: 12000 }
        };
        
        const priceRange = basePrices[productType] || { min: 5000, max: 20000 };
        
        // 상품 ID를 시드로 사용하여 일관된 가격 생성
        const seed = productId * 12345; // 간단한 시드 생성
        const random = (seed * 9301 + 49297) % 233280; // 선형 합동 생성기
        const normalizedRandom = random / 233280;
        
        const price1 = Math.floor(normalizedRandom * (priceRange.max - priceRange.min + 1)) + priceRange.min;
        const price2 = Math.floor(price1 * 1.8); // 1.8배
        const price3 = Math.floor(price1 * 2.5); // 2.5배
        
        return [
            { quantity: 1, unit: 'kg', price: price1 },
            { quantity: 2, unit: 'kg', price: price2 },
            { quantity: 3, unit: 'kg', price: price3 }
        ];
    }
function renderProductPrices() {
  productCards.forEach(card => {
    const priceContainer = card.querySelector('.product-prices');
    const minPrice = card.getAttribute('data-min-price'); // 서버에서 내려줄 값

    priceContainer.innerHTML = '';
    if (minPrice && parseInt(minPrice) > 0) {
      priceContainer.innerHTML = `<p class="price">최저가 ${parseInt(minPrice).toLocaleString()}원~</p>`;
    } else {
      priceContainer.innerHTML = '<p class="no-price">업체에 문의해주세요</p>';
    }
  });
}


    // 초기 로드 시 페이징 적용
    console.log('초기 로드 시작');
    console.log('총 상품 카드 수:', productCards.length);
    
    // 가격 렌더링
    renderProductPrices();
    
    filterProducts();
    
    console.log('지역별 특산품 페이지 초기화 완료');
});

(function () {
  const PLACEHOLDER = '/images/따봉 트럭.png';

  function arm(img) {
    if (!img || img.dataset.fallbackArmed === '1') return;
    img.dataset.fallbackArmed = '1';

    // 404 등 깨질 때
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER;
    };

    // 초기 값이 비었거나 'null' 등일 때
    const raw = (img.getAttribute('src') || '').trim();
    if (!raw || raw.toLowerCase() === 'null' || raw === '#') {
      img.src = PLACEHOLDER;
    }
  }

  function armAll(root = document) {
    root.querySelectorAll(
      // region, region-detail 전부 커버
      '.product-image img, img.product-image, img.related-product-image, img.thumbnail, #mainImage'
    ).forEach(arm);
  }

  document.addEventListener('DOMContentLoaded', () => {
    armAll();

    // 동적 IMG도 자동 무장
    const mo = new MutationObserver(muts => {
      muts.forEach(m => {
        m.addedNodes.forEach(n => {
          if (n.nodeType !== 1) return;
          if (n.tagName === 'IMG') arm(n);
          else armAll(n);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  });

  // 필요시 수동 호출용
  window.__armImageFallback = arm;
  window.__armAllImageFallbacks = armAll;
})();
