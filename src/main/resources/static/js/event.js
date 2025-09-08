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

    console.log('이벤트 페이지가 로드되었습니다.');
});