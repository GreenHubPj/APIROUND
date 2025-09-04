// 메인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                alert(`"${searchTerm}" 검색 기능은 준비 중입니다.`);
            }
        });
    }
    
    // 엔터키로 검색
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // 로그인/회원가입 버튼
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            alert('로그인 페이지로 이동합니다.');
        });
    }
    
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            alert('회원가입 페이지로 이동합니다.');
        });
    }
    
    // 네비게이션 링크
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = this.textContent;
            alert(`${linkText} 페이지로 이동합니다.`);
        });
    });
    
    // 카테고리 아이템 클릭
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-label').textContent;
            alert(`${categoryName} 카테고리로 이동합니다.`);
        });
    });
    
    // 상품 아이템 클릭
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
        item.addEventListener('click', function() {
            const productName = this.querySelector('.product-name').textContent;
            alert(`${productName} 상세 페이지로 이동합니다.`);
        });
    });
    
    // 요리법 아이템 클릭
    const recipeItems = document.querySelectorAll('.recipe-item');
    recipeItems.forEach(item => {
        item.addEventListener('click', function() {
            const recipeName = this.querySelector('.recipe-name').textContent;
            alert(`${recipeName} 요리법 페이지로 이동합니다.`);
        });
    });
    
    // 추천 요리 클릭
    const recommendedRecipe = document.querySelector('.recommended-recipe');
    if (recommendedRecipe) {
        recommendedRecipe.addEventListener('click', function() {
            alert('추천 요리 상세 페이지로 이동합니다.');
        });
    }
    
    // 스크롤 시 헤더 효과
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
    
    // 부드러운 스크롤 효과
    header.style.transition = 'transform 0.3s ease-in-out';
    
    // 이미지 로딩 에러 처리
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            console.warn('이미지 로딩 실패:', this.src);
        });
    });
    
    // 페이지 로딩 완료 후 애니메이션
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// 페이지 로딩 시 페이드인 효과
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease-in-out';
