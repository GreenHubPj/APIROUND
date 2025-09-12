// 메인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();

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
    
    // 헤더 관련 기능은 header.js에서 처리

    // 카테고리 아이템 클릭
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const categoryName = this.querySelector('.category-label').textContent;
            // region 페이지로 이동하면서 해당 카테고리 선택
            window.location.href = `/region?category=${encodeURIComponent(categoryName)}`;
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

    // 헤더 스크롤 효과는 header.js에서 처리

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

            // CSS는 별도 파일로 분리됨 (recommend-modal.css)

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


