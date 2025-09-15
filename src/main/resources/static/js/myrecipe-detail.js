document.addEventListener('DOMContentLoaded', function () {
    console.log('Detail 페이지 로드됨');

    let isEditMode = false;
    let originalData = {};

    const regionalProducts = [
        { name: "사과", region: "문경", image: "/images/사과.jpg", description: "문경에서 유명한 사과" },
        { name: "돼지고기", region: "고흥", image: "/images/제철 돼지.jpg", description: "좋은 품질만 선별하는 고흥에서" },
        // 추가 지역 특산물
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

    function getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');
        const userId = urlParams.get('userId');

        console.log('recipeId:', recipeId, 'userId:', userId);
        return { recipeId, userId };
    }

    function fetchRecipeData() {
        const { recipeId, userId } = getUrlParams();
        if (!recipeId || !userId) {
            console.error('recipeId 또는 userId가 URL에 없음');
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

    function renderRecipe(recipe) {
        // 기본 정보 렌더링
        recipeTitleEl.textContent = recipe.title || '';
        recipeServingsEl.textContent = recipe.servings || '';

        if (recipe.heroImageUrl) {
            recipeMainImageEl.src = recipe.heroImageUrl;
            recipeMainImageEl.alt = recipe.title || '레시피 이미지';
        } else {
            recipeMainImageEl.alt = recipe.title || '레시피 이미지';
        }

    function formatAmount(value) {
        return value.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

        // 재료 리스트 렌더링
       ingredientsListEl.innerHTML = '';
       if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
           recipe.ingredients.forEach(ing => {
               const li = document.createElement('li');
               li.className = 'ingredient-item';

               const name = ing.name || ing.nameText || ing.ingredientName || '';
               const amount = ing.amount || (
                   typeof ing.qtyValue === 'number'
                       ? formatAmount(ing.qtyValue) + (ing.unitCode ? ' ' + ing.unitCode : '')
                       : ''
               );

               li.innerHTML = `
                   <span class="ingredient-name" contenteditable="false">${name}</span>
                   <span class="ingredient-amount" contenteditable="false">${amount}</span>
                   ${ing.note ? `<small>(${ing.note})</small>` : ''}
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
               // description 필드가 실제 텍스트임을 반영
               const stepText = stepObj.description || stepObj.instruction || stepObj.name || '';

               sectionDiv.innerHTML = `
                   <h3 class="instruction-title" contenteditable="false">단계 ${idx + 1}</h3>
                   <ol class="instruction-steps">
                       <li contenteditable="false">${stepText}</li>
                   </ol>
                   <button class="add-step" style="display: none;">+ 단계 추가</button>
                   <button class="remove-section" style="display: none;">섹션 삭제</button>
               `;
               recipeInstructionsEl.appendChild(sectionDiv);
           });
       }

        // 특산물 노트 렌더링
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            const firstIngredient = recipe.ingredients[0];
            const firstIngredientName = firstIngredient.nameText || firstIngredient.ingredientName;

            if (firstIngredientName) {
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
        } else {
            ingredientNoteEl.style.display = 'none';
        }
    }
    function addIngredient() {
            const newIngredient = document.createElement('li');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <span class="ingredient-name" contenteditable="true">새 재료</span>
                <span class="ingredient-amount" contenteditable="true">1개</span>
                <button class="remove-ingredient">×</button>
            `;
            ingredientsList.appendChild(newIngredient);

            const newName = newIngredient.querySelector('.ingredient-name');
            newName.focus();
            document.execCommand('selectAll', false, null);
        }

    function saveOriginalData(recipe) {
        originalData = {
            title: recipe.title,
            servings: recipe.servings,
            heroImageUrl: recipe.heroImageUrl,
            ingredients: recipe.ingredients ? recipe.ingredients.map(ing => ({
                name: ing.nameText || ing.ingredientName || '',
                amount: ing.note || `${ing.qtyValue || ''}${ing.unitCode ? ' ' + ing.unitCode : ''}`
            })) : [],
            steps: recipe.steps ? recipe.steps.map(st => st.instruction || st.name || '') : []
        };
    }


    function restoreOriginalData() {
        recipeTitleEl.textContent = originalData.title;
        recipeServingsEl.textContent = originalData.servings;

        if (originalData.heroImageUrl) {
            recipeMainImageEl.src = originalData.heroImageUrl;
        }

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

        recipeInstructionsEl.innerHTML = '';
        originalData.steps.forEach((stepText, idx) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'instruction-section';
            sectionDiv.innerHTML = `
                <h3 class="instruction-title" contenteditable="false">단계 ${idx + 1}</h3>
                <ol class="instruction-steps">
                    <li contenteditable="false">${stepText}</li>
                </ol>
                <button class="add-step" style="display: none;">+ 단계 추가</button>
                <button class="remove-section" style="display: none;">섹션 삭제</button>
            `;
            recipeInstructionsEl.appendChild(sectionDiv);
        });
    }

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

    // 최초 데이터 fetch
    fetchRecipeData();

    // 삭제 버튼 동작
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
                    window.location.href = `/myrecipe?userId=${userId}`;
                })
                .catch(error => {
                    console.error('삭제 중 오류 발생:', error);
                    alert('삭제 중 오류가 발생했습니다.');
                });
        });
    }
});
