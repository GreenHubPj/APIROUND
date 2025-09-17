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

            // DB에서 랜덤 추천 데이터 가져오기

            const getRecommendation = async () => {
                showStep(2); // 로딩 단계

                try {
                    // DB API에서 랜덤 레시피 가져오기
                    const response = await fetch('/api/random-recipe');
                    const data = await response.json();
                    
                    if (data.error) {
                        alert(data.error);
                        closeModal();
                        return;
                    }

                    // 2초 후 결과 표시 (로딩 효과)
                    setTimeout(() => {
                        document.getElementById('menu-name').innerText = data.name;
                        document.getElementById('menu-region').innerText = data.region;
                        document.getElementById('menu-description').innerText = data.description;

                        // 재료 태그 생성
                        const ingredientsContainer = document.getElementById('menu-ingredients');
                        ingredientsContainer.innerHTML = '';
                        data.ingredients.forEach(ingredient => {
                            const tag = document.createElement('span');
                            tag.className = 'ingredient-tag';
                            tag.textContent = ingredient;
                            ingredientsContainer.appendChild(tag);
                        });

                        // 레시피 보기 버튼에 링크 추가
                        const recipeBtn = document.querySelector('.recipe-btn');
                        if (recipeBtn && data.recipeId) {
                            recipeBtn.onclick = () => {
                                window.location.href = `/recipe/detail?id=${data.recipeId}`;
                            };
                        }

                        showStep(3); // 결과 표시
                    }, 2000);
                    
                } catch (error) {
                    console.error('레시피 추천 API 오류:', error);
                    alert('레시피 추천 중 오류가 발생했습니다.');
                    closeModal();
                }
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