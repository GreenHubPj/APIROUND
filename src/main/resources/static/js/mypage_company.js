// 업체 마이페이지 JavaScript (서버 렌더 데이터 사용)
document.addEventListener('DOMContentLoaded', function() {
    // 모듈 클릭 이벤트 처리
    const moduleItems = document.querySelectorAll('.module-item');

    moduleItems.forEach(item => {
        item.addEventListener('click', function() {
            const moduleType = this.getAttribute('data-module');
            handleModuleClick(moduleType);
        });

        // 호버 효과
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 모듈 클릭 처리
    function handleModuleClick(moduleType) {
        switch(moduleType) {
            case 'orders':
                window.location.href = '/customerOrder';
                break;
            case 'delivery':
                window.location.href = '/sellerDelivery';
                break;
            case 'reviews':
                window.location.href = '/review-management';
                break;
            case 'company-edit':
                window.location.href = '/profile-edit-company';
                break;
            case 'refund':
                window.location.href = '/refund-management';
                break;
            case 'products':
                window.location.href = '/item-management';
                break;
            default:
                console.log('알 수 없는 모듈:', moduleType);
        }
    }

    // 반응형 처리
    function handleResize() {
        const modulesGrid = document.querySelector('.modules-grid');
        const companyStats = document.querySelector('.company-stats');
        if (!modulesGrid || !companyStats) return;

        if (window.innerWidth <= 480) {
            modulesGrid.style.gridTemplateColumns = '1fr';
            companyStats.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
    window.addEventListener('resize', handleResize);
    handleResize();

    // 모듈/통계 애니메이션
    function addAnimation() {
        const stats = document.querySelectorAll('.stat-item');
        const modules = document.querySelectorAll('.module-item');

        stats.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 100);
        });

        modules.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 400 + i * 100);
        });
    }
    setTimeout(addAnimation, 300);

    // 접근성
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focused = document.activeElement;
            if (focused && focused.classList.contains('module-item')) {
                e.preventDefault();
                focused.click();
            }
        }
    });
    moduleItems.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        const title = item.querySelector('.module-title')?.textContent || '';
        item.setAttribute('aria-label', `업체 마이페이지 기능: ${title}`);
    });

    // 통계 숫자 카운트 애니메이션 (표시값 기준)
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            const finalText = el.textContent.trim();
            const isDecimal = finalText.includes('.');
            const target = isDecimal ? parseFloat(finalText) : parseInt(finalText, 10);
            if (isNaN(target)) return;

            let current = 0;
            const steps = 50;
            const inc = target / steps;

            const timer = setInterval(() => {
                current += inc;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = isDecimal ? current.toFixed(1) : Math.round(current);
            }, 30);
        });
    }
    setTimeout(animateNumbers, 800);
});
