document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 요리법 상세 페이지가 로드되었습니다.');

    // 재료 항목 클릭 이벤트
    const ingredientItems = document.querySelectorAll('.ingredient-item');
    ingredientItems.forEach(item => {
        item.addEventListener('click', function() {
            const ingredientName = this.querySelector('.ingredient-name').textContent;
            const ingredientAmount = this.querySelector('.ingredient-amount').textContent;
            
            console.log(`재료 선택: ${ingredientName} ${ingredientAmount}`);
            
            // 시각적 피드백
            this.style.backgroundColor = '#fff5f2';
            this.style.borderColor = '#FF6B35';
            
            setTimeout(() => {
                this.style.backgroundColor = '';
                this.style.borderColor = '';
            }, 1000);
        });
    });

    // 요리법 단계 클릭 이벤트
    const instructionSteps = document.querySelectorAll('.instruction-steps li');
    instructionSteps.forEach((step, index) => {
        step.addEventListener('click', function() {
            console.log(`요리법 단계 ${index + 1} 클릭됨`);
            
            // 시각적 피드백
            this.style.backgroundColor = '#fff5f2';
            this.style.borderLeft = '3px solid #FF6B35';
            this.style.paddingLeft = 'calc(3rem - 3px)';
            
            setTimeout(() => {
                this.style.backgroundColor = '';
                this.style.borderLeft = '';
                this.style.paddingLeft = '';
            }, 2000);
        });
    });

    // 요리법 이미지 클릭 이벤트
    const recipeImage = document.querySelector('.recipe-main-image');
    if (recipeImage) {
        recipeImage.addEventListener('click', function() {
            console.log('요리법 이미지 클릭됨');
            
            // 이미지 확대 효과
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.25)';
            
            setTimeout(() => {
                this.style.transform = '';
                this.style.boxShadow = '';
            }, 1000);
        });
    }

    // 요리법 제목 클릭 이벤트
    const recipeTitle = document.querySelector('.recipe-title');
    if (recipeTitle) {
        recipeTitle.addEventListener('click', function() {
            console.log('요리법 제목 클릭됨');
            
            // 제목 강조 효과
            this.style.color = '#FF6B35';
            this.style.textShadow = '2px 2px 4px rgba(255, 107, 53, 0.3)';
            
            setTimeout(() => {
                this.style.color = '';
                this.style.textShadow = '';
            }, 1500);
        });
    }

    // 인분 표시 클릭 이벤트
    const recipeServings = document.querySelector('.recipe-servings');
    if (recipeServings) {
        recipeServings.addEventListener('click', function() {
            console.log('인분 정보 클릭됨');
            
            // 인분 정보 강조
            this.style.backgroundColor = '#e55a2b';
            this.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                this.style.backgroundColor = '';
                this.style.transform = '';
            }, 1000);
        });
    }

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
    const animatedElements = document.querySelectorAll('.instruction-section, .ingredients-section, .recipe-image');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // 페이지 로드 완료 메시지
    console.log('요리법 상세 페이지 초기화 완료');


});
