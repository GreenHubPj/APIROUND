document.addEventListener('DOMContentLoaded', function() {
    console.log('Detail 페이지 로드됨');

    let isEditMode = false;
    let originalData = {};

    // 지역 특산품 데이터 (필요 시 유지)
    const regionalProducts = [
        { name: "사과", region: "문경", image: "/images/사과.jpg", description: "문경에서 유명한 사과" },
        { name: "돼지고기", region: "고흥", image: "/images/제철 돼지.jpg", description: "좋은 품질만 선별하는 고흥에서" },
        // ... 나머지 항목들
    ];

    // DOM 요소 캐싱
    const recipeTitleEl = document.getElementById('recipeTitle');
    const recipeServingsEl = document.getElementById('recipeServings');
    const recipeMainImageEl = document.getElementById('recipeMainImage');
    const ingredientsListEl = document.getElementById('ingredientsList');
    const recipeInstructionsEl = document.getElementById('recipeInstructions');
    const ingredientNoteEl = document.getElementById('ingredientNote');
    const recipeProductImageEl = document.getElementById('recipeProductImage');
    const ingredientNoteTextEl = document.getElementById('ingredientNoteText');

    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const imageUpload = document.getElementById('imageUpload');

    const params = new URLSearchParams(window.location.search);
    const recipeId = params.get('id');  // id 값
    const userId = params.get('userId');  // userId 값

   // URL에서 recipeId, userId 가져오기
   function getUrlParams() {
       const urlParams = new URLSearchParams(window.location.search);
       const recipeId = urlParams.get('id');    // '2'
       const userId = urlParams.get('userId');  //

       // console로 값 확인
       console.log('urlParams:', urlParams);  // URLSearchParams 객체 출력
       console.log('recipeId:', recipeId, 'userId:', userId);  // recipeId와 userId 출력

       return { recipeId, userId };
   }

    // 백엔드에서 레시피 데이터 가져오기
   function fetchRecipeData() {
       const { recipeId, userId } = getUrlParams();  // getUrlParams에서 값을 받아옴
       console.log('recipeId:', recipeId, 'userId:', userId);  // 값이 제대로 출력되는지 확인
       if (!recipeId || !userId) {
           console.error('recipeId 또는 userId가 URL에 없음');  // 오류 메시지
           return;
       }

       fetch(`/mypage/recipes/${recipeId}?userId=${userId}`)
           .then(response => {
               if (!response.ok) {
                   throw new Error(`HTTP error! status: ${response.status}`);
               }
               return response.json();
           })
           .then(recipe => {
               console.log('받아온 레시피 데이터:', recipe);
               renderRecipe(recipe);
               saveOriginalData(recipe);
           })
           .catch(error => {
               console.error('레시피 데이터 가져오기 실패:', error);
           });
   }

    // 받아온 데이터 화면에 렌더링
    function renderRecipe(recipe) {
        // 기본 정보
        recipeTitleEl.textContent = recipe.title || '';
        recipeServingsEl.textContent = recipe.servings || '';

        if (recipe.heroImageUrl) {
            recipeMainImageEl.src = recipe.heroImageUrl;
            recipeMainImageEl.alt = recipe.title;
        } else {
            // 기본 이미지나 alt 처리
            recipeMainImageEl.alt = recipe.title;
        }

        // 재료 리스트 렌더링
        ingredientsListEl.innerHTML = '';
        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            recipe.ingredients.forEach(ing => {
                const li = document.createElement('li');
                li.className = 'ingredient-item';
                li.innerHTML = `
                    <span class="ingredient-name" contenteditable="false">${ing.nameText}</span>
                    <span class="ingredient-amount" contenteditable="false">${ing.qtyValue}${ing.unitCode ? ' ' + ing.unitCode : ''}</span>
                    <button class="remove-ingredient" style="display: none;">×</button>
                `;
                ingredientsListEl.appendChild(li);
            });
        }

        // 조리법 섹션 렌더링
        recipeInstructionsEl.innerHTML = '';
        if (recipe.steps && Array.isArray(recipe.steps)) {
            recipe.steps.forEach((stepObj, idx) => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'instruction-section';
                sectionDiv.innerHTML = `
                    <h3 class="instruction-title" contenteditable="false">단계 ${idx + 1}</h3>
                    <ol class="instruction-steps">
                        <li contenteditable="false">${stepObj.name}</li>
                    </ol>
                    <button class="add-step" style="display: none;">+ 단계 추가</button>
                    <button class="remove-section" style="display: none;">섹션 삭제</button>
                `;
                recipeInstructionsEl.appendChild(sectionDiv);
            });
        }

        // 특산물 노트
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            const firstIngredientName = recipe.ingredients[0].nameText;
            const related = findRelatedProduct(firstIngredientName);
            if (related) {
                ingredientNoteEl.style.display = 'block';
                recipeProductImageEl.src = related.image;
                recipeProductImageEl.alt = related.name;
                ingredientNoteTextEl.textContent = `${related.region} ${related.name}`;
            } else {
                ingredientNoteEl.style.display = 'none';
            }
        } else {
            ingredientNoteEl.style.display = 'none';
        }
    }

    // 원본 데이터 저장 (수정 취소용)
    function saveOriginalData(recipe) {
        originalData = {
            title: recipe.title,
            servings: recipe.servings,
            heroImageUrl: recipe.heroImageUrl,
            ingredients: recipe.ingredients ? recipe.ingredients.map(ing => ({
                name: ing.nameText,
                amount: `${ing.qtyValue}${ing.unitCode ? ' ' + ing.unitCode : ''}`
            })) : [],
            steps: recipe.steps ? recipe.steps.map(st => st.name) : []
        };
    }

    function restoreOriginalData() {
        recipeTitleEl.textContent = originalData.title;
        recipeServingsEl.textContent = originalData.servings;
        if (originalData.heroImageUrl) {
            recipeMainImageEl.src = originalData.heroImageUrl;
        }
        // 재료 복원
        ingredientsListEl.innerHTML = '';
        originalData.ingredients.forEach(ing => {
            const li = document.createElement('li');
            li.className = 'ingredient-item';
            li.innerHTML = `
                <span class="ingredient-name" contenteditable="false">${ing.name}</span>
                <span class="ingredient-amount" contenteditable="false">${ing.amount}</span>
                <button class="remove-ingredient" style="display: none;">×</button>
            `;
            ingredientsListEl.appendChild(li);
        });
        // 조리법 복원
        recipeInstructionsEl.innerHTML = '';
        originalData.steps.forEach((stepName, idx) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'instruction-section';
            sectionDiv.innerHTML = `
                <h3 class="instruction-title" contenteditable="false">단계 ${idx + 1}</h3>
                <ol class="instruction-steps">
                    <li contenteditable="false">${stepName}</li>
                </ol>
                <button class="add-step" style="display: none;">+ 단계 추가</button>
                <button class="remove-section" style="display: none;">섹션 삭제</button>
            `;
            recipeInstructionsEl.appendChild(sectionDiv);
        });
    }

    // 기타 함수 (편집 모드 관련, 특산물 찾기 함수 등) 유지 또는 약간 수정

    function findRelatedProduct(ingredientName) {
        const cleanName = ingredientName.toLowerCase().trim();
        for (const product of regionalProducts) {
            const pn = product.name.toLowerCase();
            if (pn === cleanName || cleanName.includes(pn) || pn.includes(cleanName)) {
                return product;
            }
        }
        const keywords = {
            "돼지": "돼지고기",
            "소고기": "소고기",
            "닭고기": "닭고기",
            "생선": "생선",
            "버섯": "표고버섯",
            "쌀": "쌀",
            "과일": "사과"
        };
        for (const [keyword, productName] of Object.entries(keywords)) {
            if (cleanName.includes(keyword)) {
                return regionalProducts.find(p => p.name === productName);
            }
        }
        return null;
    }

    // 편집 관련 UI 함수들: enterEditMode, exitEditMode, enableEditing, disableEditing 등 유지하되
    // 이 코드들은 생략하고 필요하면 구조 비슷하게 수정

    // 최초 fetch
    fetchRecipeData();

    if (deleteRecipeBtn) {
        deleteRecipeBtn.addEventListener('click', () => {
            const confirmDelete = confirm('이 레시피를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.');
            if (!confirmDelete) return;

            const { recipeId, userId } = getUrlParams();
            if (!recipeId || !userId) {
                alert('필요한 정보가 없습니다.');
                return;
            }

            fetch(`/mypage/recipes/${recipeId}?userId=${userId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('삭제 실패');
                }
                alert('레시피가 삭제되었습니다.');
                // userId를 포함해서 목록 페이지로 이동
                window.location.href = `/myrecipe?userId=${userId}`;
            })
            .catch(error => {
                console.error('삭제 중 오류 발생:', error);
                alert('삭제 중 오류가 발생했습니다.');
            });
      });
    }
});
