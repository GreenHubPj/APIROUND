// 메인 페이지 JavaScript

// 제철왔어용 기본 이미지 넣기
 // === 이미지 폴백 공통 스니펫 (그대로 복붙) ===
 (function () {
   // 페이지 어디선가 바꾸고 싶으면 이 값만 수정
   const PLACEHOLDER = '/images/따봉 트럭.png';

   function arm(img) {
     if (!img || img.dataset.fallbackArmed === '1') return;
     img.dataset.fallbackArmed = '1';

     // 깨졌을 때(404 등)
     img.onerror = () => {
       img.onerror = null;
       img.src = PLACEHOLDER;
     };

     // 초기 src가 비었거나 "null" 같은 문자열이면 즉시 대체
     const raw = (img.getAttribute('src') || '').trim();
     if (!raw || raw.toLowerCase() === 'null' || raw === '#') {
       img.src = PLACEHOLDER;
     }
   }

   function armAll(root = document) {
     root.querySelectorAll(
       '.product-image img, img.related-product-image, img.thumbnail, #mainImage'
     ).forEach(arm);
   }

   document.addEventListener('DOMContentLoaded', () => {
     // 초기 렌더된 IMG 모두 무장
     armAll();

     // 이후 동적으로 추가되는 IMG도 자동 무장
     const mo = new MutationObserver(muts => {
       muts.forEach(m => {
         m.addedNodes.forEach(n => {
           if (n.nodeType !== 1) return;
           if (n.tagName === 'IMG') arm(n);
           else armAll(n);
         });
       });
     });
     mo.observe(document.body, { childList: true, subtree: true });
   });

   // 필요하면 외부에서 수동 호출도 가능
   window.__armImageFallback = arm;
   window.__armAllImageFallbacks = armAll;
 })();



document.addEventListener('DOMContentLoaded', function() {
    // 검색 기능
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // region 페이지로 검색어와 함께 이동
                window.location.href = `/region?search=${encodeURIComponent(searchTerm)}`;
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
            console.log('카테고리 클릭:', categoryName);
            
            // region 페이지로 이동하면서 해당 카테고리 선택 (한글 이름 그대로 전달)
            const url = `/region?type=${encodeURIComponent(categoryName)}`;
            console.log('이동할 URL:', url);
            window.location.href = url;
        });
    });

    // 상품 아이템 클릭
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
        item.addEventListener('click', function() {
            const productName = this.querySelector('.product-name').textContent;
        });
    });

    // 요리법 아이템 클릭
    const recipeItems = document.querySelectorAll('.recipe-item');
    recipeItems.forEach(item => {
        item.addEventListener('click', function() {
            const recipeName = this.querySelector('.recipe-name').textContent;
        });
    });

    // 추천 요리 클릭
    const recommendedRecipe = document.querySelector('.recommended-recipe');
    if (recommendedRecipe) {
        recommendedRecipe.addEventListener('click', function() {
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

                    console.log('API 응답:', data); // 디버깅용

                    if (data.error) {
                        alert(data.error);
                        closeModal();
                        return;
                    }

                    // 2초 후 결과 표시 (로딩 효과)
                    setTimeout(() => {
                        // 요리법 DB에서 가져온 실제 데이터 표시
                        const menuName = document.getElementById('menu-name');
                        const menuRegion = document.getElementById('menu-region');
                        const menuDescription = document.getElementById('menu-description');
                        const ingredientsContainer = document.getElementById('menu-ingredients');

                        // 실제 레시피 데이터 표시
                        if (menuName) menuName.innerText = data.name || '맛있는 요리';
                        if (menuRegion) menuRegion.innerText = data.region || '전국 지역 특산품';
                        if (menuDescription) menuDescription.innerText = data.description || '특별한 레시피입니다.';

                        // 실제 재료 데이터 표시
                        if (ingredientsContainer) {
                            ingredientsContainer.innerHTML = '';
                            if (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
                                // DB에서 가져온 실제 재료 표시
                                data.ingredients.forEach(ingredient => {
                                    const tag = document.createElement('span');
                                    tag.className = 'ingredient-tag';
                                    tag.textContent = ingredient;
                                    ingredientsContainer.appendChild(tag);
                                });
                            } else {
                                // 재료 데이터가 없을 경우 기본 재료 표시
                                const defaultIngredients = ['신선한 재료', '맛있는 양념', '특별한 소스'];
                                defaultIngredients.forEach(ingredient => {
                                    const tag = document.createElement('span');
                                    tag.className = 'ingredient-tag';
                                    tag.textContent = ingredient;
                                    ingredientsContainer.appendChild(tag);
                                });
                            }
                        }

                        // 레시피 보기 버튼에 실제 레시피 ID 링크 추가
                        const recipeBtn = document.querySelector('.recipe-btn');
                        if (recipeBtn) {
                            recipeBtn.onclick = () => {
                                if (data.recipeId) {
                                    // 실제 레시피 상세 페이지로 이동
                                    window.location.href = `/recipe/detail?id=${data.recipeId}`;
                                } else {
                                    // 레시피 ID가 없으면 레시피 목록으로 이동
                                    window.location.href = '/recipe';
                                }
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