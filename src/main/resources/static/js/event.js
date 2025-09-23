// 이벤트 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 진행중인 혜택 배너 클릭 토글 기능
    const benefitsBanner = document.querySelector('.benefits-banner');
    const benefitsList = document.querySelector('.benefits-list');
    
    if (benefitsBanner && benefitsList) {
        benefitsBanner.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // active 클래스 토글
            this.classList.toggle('active');
        });
        
        // 혜택 리스트 외부 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (!benefitsBanner.contains(e.target)) {
                benefitsBanner.classList.remove('active');
            }
        });
    }

    // 반응형 배너 높이 조정
    function handleResize() {
        const windowWidth = window.innerWidth;
        const banners = document.querySelectorAll('.event-banner');
        
        if (windowWidth <= 768) {
            // 모바일에서 배너 높이 조정
            banners.forEach(banner => {
                banner.style.height = '30vh';
            });
        } else {
            // 데스크톱에서 배너 높이 복원
            banners.forEach(banner => {
                banner.style.height = '40vh';
            });
        }
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행

    // 신규입점 기념 배너들에 클릭 이벤트 추가
    const newStoreBanners = document.querySelectorAll('.event-banner');
    newStoreBanners.forEach((banner, index) => {
        // 푸릇푸릇한 채소, 한 상 가득 고기밥상, 싱싱한 활꽃게 신규입점 기념 배너들
        if (index >= 2) { // 3번째부터 (인덱스 2, 3, 4)
            banner.style.cursor = 'pointer';
            banner.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const bannerTitle = this.querySelector('.banner-title');
                const title = bannerTitle ? bannerTitle.textContent : '이벤트';
                
                showDevelopmentAlert(title);
            });
        }
    });

    // 개발중 알림 함수
    function showDevelopmentAlert(featureName) {
        // 기존 알림이 있다면 제거
        const existingAlert = document.querySelector('.development-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 알림 요소 생성
        const alertDiv = document.createElement('div');
        alertDiv.className = 'development-alert';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">🚧</div>
                <div class="alert-text">
                    <h3>${featureName} 이벤트</h3>
                    <p>현재 개발중입니다.<br>곧 만나보실 수 있습니다!</p>
                </div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // 스타일 적용
        alertDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .development-alert .alert-content {
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                position: relative;
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .development-alert .alert-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .development-alert .alert-text h3 {
                color: #2c5530;
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
            }
            .development-alert .alert-text p {
                color: #666;
                margin: 0;
                line-height: 1.5;
            }
            .development-alert .alert-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .development-alert .alert-close:hover {
                background: #f5f5f5;
                color: #333;
            }
        `;
        document.head.appendChild(style);

        // body에 추가
        document.body.appendChild(alertDiv);

        // 배경 클릭 시 닫기
        alertDiv.addEventListener('click', function(e) {
            if (e.target === alertDiv) {
                alertDiv.remove();
                style.remove();
            }
        });

        // ESC 키로 닫기
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                alertDiv.remove();
                style.remove();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }

    console.log('이벤트 페이지가 로드되었습니다.');
});