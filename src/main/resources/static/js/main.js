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

        // 🍽️ "오늘 뭐먹지?" 추천 버튼 클릭 시 모달 띄우기
        const recommendBtn = document.getElementById('recommend-btn');

        if (recommendBtn) {
            // 모달 요소 생성
            const modal = document.createElement('div');
            modal.id = 'recommend-modal';
            modal.className = 'recommend-modal hidden';
            modal.innerHTML = `
                <div class="modal-content">
                    <div id="modal-step1" class="modal-step">
                        <p class="modal-title">오늘 뭐먹지? 🍽️</p>
                        <button class="modal-btn" id="start-recommend">랜덤 추천 받기</button>
                    </div>
                    <div id="modal-step2" class="modal-step hidden">
                        <p class="modal-title">추천 중입니다... ⏳</p>
                        <div class="loading-spinner"></div>
                    </div>
                    <div id="modal-step3" class="modal-step hidden">
                        <h4 id="menu-name" class="modal-result-title"></h4>
                        <p id="menu-region" class="modal-result-text"></p>
                        <p id="menu-ingredients" class="modal-result-text"></p>
                        <button class="modal-btn" id="retry-btn">다시 추천</button>
                        <button class="modal-btn" id="close-btn">닫기</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // 스타일 생성
            const style = document.createElement('style');
            style.innerHTML = `
                .recommend-modal {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100vw; height: 100vh;
                    background-color: rgba(0,0,0,0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                .recommend-modal:not(.hidden) {
                    opacity: 1;
                }
                .modal-content {
                    background: #fff;
                    padding: 30px;
                    border-radius: 15px;
                    text-align: center;
                    width: 300px;
                    transform: scale(0.8);
                    transition: transform 0.3s ease;
                }
                .recommend-modal:not(.hidden) .modal-content {
                    transform: scale(1);
                }
                .hidden {
                    display: none !important;
                }
                .modal-btn {
                    margin: 8px;
                    padding: 10px 20px;
                    background-color: #FF914D;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .modal-btn:hover {
                    background-color: #ff7c2a;
                    transform: translateY(-2px);
                }
                .modal-result-title {
                    font-size: 22px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #2c5530;
                }
                .modal-result-text {
                    font-size: 16px;
                    margin: 5px 0;
                    color: #666;
                }
                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #FF914D;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);

            // 모달 단계 전환 함수
            const showStep = (step) => {
                ['modal-step1', 'modal-step2', 'modal-step3'].forEach(id =>
                    document.getElementById(id).classList.add('hidden')
                );
                document.getElementById(`modal-step${step}`).classList.remove('hidden');
                modal.classList.remove('hidden');
            };

            const closeModal = () => {
                modal.classList.add('hidden');
            };

            // 랜덤 추천 데이터
            const recommendations = [
                { name: "김치찌개", region: "전라도", ingredients: "김치, 돼지고기, 두부, 대파" },
                { name: "된장찌개", region: "경기도", ingredients: "된장, 두부, 호박, 양파" },
                { name: "불고기", region: "서울", ingredients: "소고기, 양파, 당근, 버섯" },
                { name: "비빔밥", region: "전라도", ingredients: "밥, 나물, 고추장, 계란" },
                { name: "갈비탕", region: "경기도", ingredients: "갈비, 무, 대파, 마늘" },
                { name: "해물파전", region: "부산", ingredients: "전복, 새우, 파, 밀가루" },
                { name: "닭볶음탕", region: "경상도", ingredients: "닭고기, 감자, 당근, 양파" },
                { name: "순두부찌개", region: "충청도", ingredients: "순두부, 해물, 김치, 대파" }
            ];

            const getRecommendation = () => {
                showStep(2); // 로딩 단계

                // 2초 후 랜덤 추천 결과 표시
                setTimeout(() => {
                    const randomItem = recommendations[Math.floor(Math.random() * recommendations.length)];
                    document.getElementById('menu-name').innerText = randomItem.name;
                    document.getElementById('menu-region').innerText = '지역: ' + randomItem.region;
                    document.getElementById('menu-ingredients').innerText = '재료: ' + randomItem.ingredients;
                    showStep(3); // 결과 표시
                }, 2000);
            };

            // 이벤트 바인딩
            recommendBtn.addEventListener('click', () => showStep(1));

            document.body.addEventListener('click', function(e) {
                if (e.target.id === 'start-recommend') getRecommendation();
                if (e.target.id === 'retry-btn') getRecommendation();
                if (e.target.id === 'close-btn') closeModal();
                // 모달 배경 클릭 시 닫기
                if (e.target === modal) closeModal();
            });
        }


});

// 페이지 로딩 시 페이드인 효과
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease-in-out';


