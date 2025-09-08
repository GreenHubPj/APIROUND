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

    // 로그인/회원가입 버튼은 모달과 링크로 처리되므로 별도 이벤트 불필요
    
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

    // 한국 지도 클릭 이벤트 (강원도 선택)
    const koreaMap = document.querySelector('#koreaMap');
    const provinceOverlay = document.querySelector('#provinceOverlay');
    const gangwonMap = document.querySelector('#gangwonMap');
    const selectionMessage = document.querySelector('#selectionMessage');
    
    // JavaScript에서 위치 설정 비활성화 - CSS에서 직접 관리
    // const regionCoordinates = { ... };
    // function setRegionLabelPositions() { ... };
    // setRegionLabelPositions();
    
    // 모든 지역 오버레이 요소들
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
    
    // 지역 라벨 클릭 이벤트 추가
    const regionLabels = document.querySelectorAll('.region-label');
    regionLabels.forEach(label => {
        label.addEventListener('click', function() {
            // data-region 속성에서 지역 이름 가져오기
            const regionName = this.getAttribute('data-region');
            console.log('클릭된 지역:', regionName);
            
            if (regionName) {
                showRegionSelection(regionName);
            }
        });
    });
    
    if (koreaMap) {
        koreaMap.addEventListener('click', function(e) {
            // 클릭된 위치를 기준으로 강원도 영역인지 확인
            const rect = koreaMap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 강원도 영역 클릭 감지 (대략적인 좌표 범위)
            // 실제 SVG의 강원도 영역에 맞게 조정 필요
            if (x >= 150 && x <= 250 && y >= 80 && y <= 200) {
                showGangwonSelection();
            }
        });
    }
    
    // 지역 선택 표시 함수
    function showRegionSelection(region) {
        const overlay = overlays[region];
        if (overlay) {
            // 지도에 선택 효과 적용 (블러)
            koreaMap.classList.add('selected');
            
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
    
    // 강원도 선택 표시 함수 (기존 코드 유지)
    function showGangwonSelection() {
        if (provinceOverlay && gangwonMap && selectionMessage) {
            // 지도에 선택 효과 적용 (블러)
            koreaMap.classList.add('selected');
            
            // 오버레이 표시
            provinceOverlay.style.display = 'flex';
            
            // 애니메이션 재시작을 위해 클래스 제거 후 추가
            gangwonMap.style.animation = 'none';
            selectionMessage.style.animation = 'none';
            
            // 강제 리플로우
            gangwonMap.offsetHeight;
            selectionMessage.offsetHeight;
            
            // 애니메이션 재시작
            gangwonMap.style.animation = 'scaleIn 0.5s ease-out';
            selectionMessage.style.animation = 'fadeInUp 0.6s ease-out 0.3s both';
            
            // 3초 후 자동으로 숨기기
            setTimeout(() => {
                hideGangwonSelection();
            }, 3000);
            
            console.log('강원도가 선택되었습니다');
        }
    }
    
    // 지역 선택 숨기기 함수
    function hideRegionSelection(region) {
        const overlay = overlays[region];
        if (overlay) {
            // 지도 선택 효과 제거
            koreaMap.classList.remove('selected');
            
            overlay.style.display = 'none';
        }
    }
    
    // 강원도 선택 숨기기 함수 (기존 코드 유지)
    function hideGangwonSelection() {
        if (provinceOverlay) {
            // 지도 선택 효과 제거
            koreaMap.classList.remove('selected');
            
            provinceOverlay.style.display = 'none';
        }
    }
    
    // 모든 오버레이 숨기기 함수
    function hideAllOverlays() {
        koreaMap.classList.remove('selected');
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
            if (!clickedOverlay && !koreaMap.contains(e.target) && !e.target.classList.contains('region-label')) {
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

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', function() {
        createMobileMenu();
    });
    
    console.log('GreenHub 제철 특산품 페이지가 로드되었습니다.');
});
