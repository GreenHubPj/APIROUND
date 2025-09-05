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
    
    // 네비게이션 링크 (제철특산품 제외)
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 제철특산품 링크는 실제 페이지로 이동하도록 허용
            if (this.textContent === '제철특산품') {
                return; // 기본 동작 허용
            }
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
                        <p class="modal-title">오늘 뭐먹지?</p>
                        <p class="modal-subtitle">전국 지역 특산품으로 만드는 특별한 레시피를 추천해드립니다.</p>
                        <button class="modal-btn" id="start-recommend">
                            <span class="dice-icon">🎲</span>
                            랜덤 추천 받기
                        </button>
                    </div>
                    <div id="modal-step2" class="modal-step hidden">
                        <p class="modal-title">⏳ 추천 중입니다  ⏳</p>
                        <div class="loading-spinner"></div>
                    </div>
                    <div id="modal-step3" class="modal-step hidden">
                        <div class="recommendation-card">
                            <h2 id="menu-name" class="dish-name"></h2>
                            
                            <div class="origin-tag">
                                <span class="location-icon">📍</span>
                                <span id="menu-region" class="origin-text"></span>
                            </div>
                            
                            <div class="ingredients-section">
                                <h3 class="ingredients-title">
                                    <span class="ingredients-icon">⚫</span>
                                    주요 재료
                                </h3>
                                <div id="menu-ingredients" class="ingredients-tags"></div>
                            </div>
                            
                            <p id="menu-description" class="dish-description"></p>
                            
                            <div class="action-buttons">
                                <button class="action-btn recipe-btn">레시피 보기</button>
                                <button class="action-btn shopping-btn">장보기 리스트</button>
                            </div>
                        </div>
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
                    background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    width: auto;
                    transform: scale(0.8);
                    transition: transform 0.3s ease;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                .recommend-modal:not(.hidden) .modal-content {
                    transform: scale(1);
                }
                .hidden {
                    display: none !important;
                }
                .modal-btn {
                    margin: 8px;
                    padding: 15px 30px;
                    background: linear-gradient(135deg, #ff6b35 0%, #e55a2b 100%);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px auto;
                }
                .modal-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
                }
                .modal-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    color: #2c5530;
                    margin-bottom: 15px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .modal-step2 .modal-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif;
                    color: #555;
                }
                .modal-subtitle {
                    font-size: 1.1rem;
                    color: #666;
                    margin-bottom: 30px;
                    line-height: 1.5;
                }
                .dice-icon {
                    font-size: 1.2rem;
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
                .recommendation-card {
                    background: linear-gradient(135deg, #ff9a8b 0%, #FCC38B 50%, #fecfef 100%);
                    padding: 30px;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                    margin-bottom: 20px;
                    text-align: center;
                    width:500px;
                }
                .dish-name {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2c5530;
                    margin-bottom: 15px;
                }
                .origin-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(255, 255, 255, 0.8);
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 2px solid #ff6b35;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #2c5530;
                }
                .location-icon {
                    color: #e74c3c;
                    font-size: 1rem;
                }
                .ingredients-section {
                    margin-bottom: 20px;
                }
                .ingredients-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #2c5530;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .ingredients-icon {
                    font-size: 1.2rem;
                }
                .ingredients-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    justify-content: center;
                }
                .ingredient-tag {
                    background: rgba(255, 255, 255, 0.9);
                    color: #2c5530;
                    padding: 6px 12px;
                    border-radius: 15px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                .dish-description {
                    font-size: 0.95rem;
                    color: #555;
                    line-height: 1.5;
                    margin-bottom: 20px;
                    background: rgba(255, 255, 255, 0.7);
                    padding: 15px;
                    border-radius: 12px;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                }
                .action-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    flex-wrap: wrap;
                }
                .action-btn {
                    background: rgba(255, 255, 255, 0.9);
                    color: #2c5530;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
                    min-width: 100px;
                }
                .action-btn:hover {
                    background: #ff6b35;
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
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
                { name: "제주 흑돼지 양념구이", region: "제주특별자치도 특산품", ingredients: ["제주흑돼지", "깻잎", "마늘", "소금"], description: "제주의 청정 자연에서 키운 흑돼지의 고소하고 담백한 맛을 즐겨보세요." },
                { name: "전라도 김치찌개", region: "전라도 특산품", ingredients: ["김치", "돼지고기", "두부", "대파"], description: "전라도의 깊은 맛 김치로 끓인 시원하고 얼큰한 찌개입니다." },
                { name: "경기도 된장찌개", region: "경기도 특산품", ingredients: ["된장", "두부", "호박", "양파"], description: "경기도의 전통 된장으로 끓인 구수하고 진한 찌개입니다." },
                { name: "서울 불고기", region: "서울 특산품", ingredients: ["소고기", "양파", "당근", "버섯"], description: "서울의 대표적인 고기 요리로 달콤하고 부드러운 맛이 일품입니다." },
                { name: "전라도 비빔밥", region: "전라도 특산품", ingredients: ["밥", "나물", "고추장", "계란"], description: "전라도의 다양한 나물과 고추장으로 만든 건강한 한 끼 식사입니다." },
                { name: "부산 해물파전", region: "부산 특산품", ingredients: ["전복", "새우", "파", "밀가루"], description: "부산의 신선한 해산물로 만든 바삭하고 고소한 파전입니다." },
                { name: "경상도 닭볶음탕", region: "경상도 특산품", ingredients: ["닭고기", "감자", "당근", "양파"], description: "경상도의 매콤달콤한 양념으로 끓인 든든한 닭볶음탕입니다." },
                { name: "충청도 순두부찌개", region: "충청도 특산품", ingredients: ["순두부", "해물", "김치", "대파"], description: "충청도의 부드러운 순두부로 끓인 얼큰하고 시원한 찌개입니다." }
            ];

            const getRecommendation = () => {
                showStep(2); // 로딩 단계

                // 2초 후 랜덤 추천 결과 표시
                setTimeout(() => {
                    const randomItem = recommendations[Math.floor(Math.random() * recommendations.length)];
                    document.getElementById('menu-name').innerText = randomItem.name;
                    document.getElementById('menu-region').innerText = randomItem.region;
                    document.getElementById('menu-description').innerText = randomItem.description;
                    
                    // 재료 태그 생성
                    const ingredientsContainer = document.getElementById('menu-ingredients');
                    ingredientsContainer.innerHTML = '';
                    randomItem.ingredients.forEach(ingredient => {
                        const tag = document.createElement('span');
                        tag.className = 'ingredient-tag';
                        tag.textContent = ingredient;
                        ingredientsContainer.appendChild(tag);
                    });
                    
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


