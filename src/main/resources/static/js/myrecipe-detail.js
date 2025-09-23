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

    // 조리시간 및 난이도 관련 요소
    const cookingTimeDisplay = document.getElementById('cookingTimeDisplay');
    const difficultyDisplay = document.getElementById('difficultyDisplay');
    const timeSelection = document.getElementById('timeSelection');
    const difficultySelection = document.getElementById('difficultySelection');
    const cookMinutesSelect = document.getElementById('cookMinutes');
    const difficultySelect = document.getElementById('difficulty');

    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const imageUpload = document.getElementById('imageUpload');

    function enterEditMode() {
        isEditMode = true;

        // 헤더 수정 가능
        recipeTitleEl.contentEditable = 'true';
        recipeServingsEl.contentEditable = 'true';

        // 조리시간 및 난이도 선택기 표시
        cookingTimeDisplay.style.display = 'none';
        difficultyDisplay.style.display = 'none';
        timeSelection.style.display = 'block';
        difficultySelection.style.display = 'block';

        // 재료 수정 가능
        ingredientsListEl.querySelectorAll('.ingredient-name, .ingredient-amount').forEach(el => {
            el.contentEditable = 'true';
        });

        // 삭제 버튼 보이기
        ingredientsListEl.querySelectorAll('.remove-ingredient').forEach(btn => {
            btn.style.display = 'inline-block';
            btn.addEventListener('click', () => btn.parentElement.remove());
        });

        // 추가 버튼 보이기
        addIngredientBtn.style.display = 'inline-block';
        addSectionBtn.style.display = 'inline-block';

        // 이미지 업로드 버튼 보이기
        const imageUpload = document.querySelector('.image-upload');
        if (imageUpload) {
            imageUpload.style.display = 'block';
        }

        // 조리법 단계 수정 가능
        recipeInstructionsEl.querySelectorAll('.instruction-title, .instruction-steps li').forEach(el => {
            el.contentEditable = 'true';
        });

        // 기존 섹션들의 버튼들 보이기
        recipeInstructionsEl.querySelectorAll('.add-step, .remove-step, .remove-section').forEach(btn => {
            btn.style.display = 'inline-block';
        });

        // 기존 섹션들에 이벤트 리스너 추가
        recipeInstructionsEl.querySelectorAll('.instruction-section').forEach(section => {
            setupSectionEventListeners(section);
        });

        // 버튼 토글
        editModeBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    }

    function exitEditMode() {
        isEditMode = false;

        recipeTitleEl.contentEditable = 'false';
        recipeServingsEl.contentEditable = 'false';

        // 조리시간 및 난이도 표시 복원
        cookingTimeDisplay.style.display = 'block';
        difficultyDisplay.style.display = 'block';
        timeSelection.style.display = 'none';
        difficultySelection.style.display = 'none';

        ingredientsListEl.querySelectorAll('.ingredient-name, .ingredient-amount').forEach(el => {
            el.contentEditable = 'false';
        });

        ingredientsListEl.querySelectorAll('.remove-ingredient').forEach(btn => {
            btn.style.display = 'none';
        });

        addIngredientBtn.style.display = 'none';
        addSectionBtn.style.display = 'none';

        // 이미지 업로드 버튼 숨기기
        const imageUpload = document.querySelector('.image-upload');
        if (imageUpload) {
            imageUpload.style.display = 'none';
        }

        recipeInstructionsEl.querySelectorAll('.instruction-title, .instruction-steps li').forEach(el => {
            el.contentEditable = 'false';
        });

        // 섹션 버튼들 숨기기
        recipeInstructionsEl.querySelectorAll('.add-step, .remove-step, .remove-section').forEach(btn => {
            btn.style.display = 'none';
        });

        editModeBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    }
    editModeBtn.addEventListener('click', () => {
        enterEditMode();
    });

    cancelBtn.addEventListener('click', () => {
        restoreOriginalData();
        exitEditMode();
    });

    saveBtn.addEventListener('click', () => {
        const updatedRecipe = collectUpdatedRecipeData();
        const { recipeId, userId } = getUrlParams();

        console.log('저장할 데이터:', updatedRecipe);

        // 이미지 파일이 있는 경우 FormData 사용, 없으면 JSON 사용
        if (window.uploadedImageFile) {
            const formData = new FormData();
            formData.append('imageFile', window.uploadedImageFile);
            formData.append('recipeData', JSON.stringify(updatedRecipe));

            fetch(`/mypage/recipes/${recipeId}/with-image?userId=${userId}`, {
                method: 'PUT',
                body: formData
            })
            .then(handleSaveResponse)
            .catch(handleSaveError);
        } else {
            // 이미지 없이 텍스트 데이터만 업데이트
            fetch(`/mypage/recipes/${recipeId}?userId=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedRecipe)
            })
            .then(handleSaveResponse)
            .catch(handleSaveError);
        }
    });

    function handleSaveResponse(res) {
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(`저장 실패: ${res.status} - ${text}`);
            });
        }
        console.log('저장 완료');
        alert('레시피가 성공적으로 저장되었습니다.');

        // 업로드된 파일 정보 초기화
        window.uploadedImageFile = null;

        // 편집 모드 종료
        exitEditMode();

        // 페이지 새로고침하여 최신 데이터 로드
        window.location.reload();
    }

    function handleSaveError(err) {
        console.error('저장 오류:', err);
        alert(`저장 중 오류가 발생했습니다: ${err.message}`);
    }

    function collectUpdatedRecipeData() {
        // 재료 데이터 수집 - DTO 형식에 맞춤
        const updatedIngredients = Array.from(ingredientsListEl.querySelectorAll('.ingredient-item')).map(li => {
            const name = li.querySelector('.ingredient-name')?.textContent.trim() || '';
            const amount = li.querySelector('.ingredient-amount')?.textContent.trim() || '';

            return {
                name: name,
                amount: amount,
                note: null
            };
        });

        // 단계 데이터 수집 - DTO 형식에 맞춤
        const updatedSteps = [];
        let stepOrder = 1;
        Array.from(recipeInstructionsEl.querySelectorAll('.instruction-section')).forEach(section => {
            const steps = Array.from(section.querySelectorAll('.instruction-steps li'));
            steps.forEach(step => {
                const stepText = step.textContent.replace(/×$/, '').trim(); // 삭제 버튼 텍스트 제거
                if (stepText) {
                    updatedSteps.push({
                        stepOrder: stepOrder++,
                        description: stepText,
                        imageUrl: null
                    });
                }
            });
        });

        // 조리시간 및 난이도 수집
        const cookMinutes = cookMinutesSelect.value ? parseInt(cookMinutesSelect.value) : null;
        const difficulty = difficultySelect.value || null;

        return {
            title: recipeTitleEl.textContent.trim(),
            servings: recipeServingsEl.textContent.trim(),
            cookMinutes: cookMinutes,
            difficulty: difficulty,
            summary: null,
            badgeText: null,
            totalMinutes: null,
            heroImageUrl: null,
            ingredients: updatedIngredients,
            steps: updatedSteps
        };
    }


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

        // 조리시간 및 난이도 렌더링
        updateTimeAndDifficultyDisplay(recipe);
        updateTimeAndDifficultySelectors(recipe);

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
            <button class="remove-ingredient" style="display: inline-block;">×</button>
        `;
        ingredientsListEl.appendChild(newIngredient);

        // 삭제 버튼 이벤트 추가
        const removeBtn = newIngredient.querySelector('.remove-ingredient');
        removeBtn.addEventListener('click', () => newIngredient.remove());

        const newName = newIngredient.querySelector('.ingredient-name');
        newName.focus();
        document.execCommand('selectAll', false, null);
    }

    // 요리법 섹션 추가 함수
    function addRecipeSection() {
        const sectionCount = recipeInstructionsEl.querySelectorAll('.instruction-section').length;
        const newSection = document.createElement('div');
        newSection.className = 'instruction-section';
        newSection.innerHTML = `
            <h3 class="instruction-title" contenteditable="true">단계 ${sectionCount + 1}</h3>
            <ol class="instruction-steps">
                <li contenteditable="true">새로운 요리 단계를 입력하세요.
                    <button class="remove-step" style="display: inline-block;">×</button>
                </li>
            </ol>
            <button class="add-step" style="display: inline-block;">+ 단계 추가</button>
            <button class="remove-section" style="display: inline-block;">섹션 삭제</button>
        `;

        recipeInstructionsEl.appendChild(newSection);

        // 이벤트 리스너 추가
        setupSectionEventListeners(newSection);

        const newTitle = newSection.querySelector('.instruction-title');
        newTitle.focus();
        document.execCommand('selectAll', false, null);
    }

    // 섹션 내 이벤트 리스너 설정
    function setupSectionEventListeners(section) {
        const addStepBtn = section.querySelector('.add-step');
        const removeSectionBtn = section.querySelector('.remove-section');
        const removeStepBtns = section.querySelectorAll('.remove-step');

        addStepBtn.addEventListener('click', () => {
            const stepsList = section.querySelector('.instruction-steps');
            const stepCount = stepsList.querySelectorAll('li').length;
            const newStep = document.createElement('li');
            newStep.contentEditable = 'true';
            newStep.innerHTML = `새로운 단계를 입력하세요.
                <button class="remove-step" style="display: inline-block;">×</button>`;
            stepsList.appendChild(newStep);

            const removeBtn = newStep.querySelector('.remove-step');
            removeBtn.addEventListener('click', () => newStep.remove());

            newStep.focus();
            document.execCommand('selectAll', false, null);
        });

        removeSectionBtn.addEventListener('click', () => {
            if (confirm('이 섹션을 삭제하시겠습니까?')) {
                section.remove();
            }
        });

        removeStepBtns.forEach(btn => {
            btn.addEventListener('click', () => btn.parentElement.remove());
        });
    }

    function saveOriginalData(recipe) {
        originalData = {
            title: recipe.title,
            servings: recipe.servings,
            cookMinutes: recipe.cookMinutes,
            difficulty: recipe.difficulty,
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

        // 조리시간 및 난이도 복원
        updateTimeAndDifficultyDisplay(originalData);
        updateTimeAndDifficultySelectors(originalData);

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

    // 조리시간 및 난이도 표시 업데이트 함수
    function updateTimeAndDifficultyDisplay(recipe) {
        // 조리시간 표시 업데이트
        const timeValueEl = cookingTimeDisplay.querySelector('.time-value span') ||
                           cookingTimeDisplay.querySelector('span');
        if (timeValueEl) {
            if (recipe.cookMinutes) {
                timeValueEl.textContent = recipe.cookMinutes + '분';
            } else {
                timeValueEl.textContent = '미설정';
            }
        }

        // 난이도 표시 업데이트
        const difficultyValueEl = difficultyDisplay.querySelector('.difficulty-value span') ||
                                 difficultyDisplay.querySelector('span');
        if (difficultyValueEl) {
            if (recipe.difficulty === 'EASY') {
                difficultyValueEl.textContent = '쉬움 ⭐';
            } else if (recipe.difficulty === 'MEDIUM') {
                difficultyValueEl.textContent = '보통 ⭐⭐';
            } else if (recipe.difficulty === 'HARD') {
                difficultyValueEl.textContent = '어려움 ⭐⭐⭐';
            } else {
                difficultyValueEl.textContent = '미설정';
            }
        }
    }

    // 조리시간 및 난이도 선택기 업데이트 함수
    function updateTimeAndDifficultySelectors(recipe) {
        // 조리시간 선택기 설정
        if (cookMinutesSelect && recipe.cookMinutes) {
            cookMinutesSelect.value = recipe.cookMinutes.toString();
        } else if (cookMinutesSelect) {
            cookMinutesSelect.value = '';
        }

        // 난이도 선택기 설정
        if (difficultySelect && recipe.difficulty) {
            difficultySelect.value = recipe.difficulty;
        } else if (difficultySelect) {
            difficultySelect.value = '';
        }
    }

    // 이미지 업로드 처리 함수
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        // 이미지 미리보기
        const reader = new FileReader();
        reader.onload = function(e) {
            if (recipeMainImageEl) {
                recipeMainImageEl.src = e.target.result;
                recipeMainImageEl.alt = file.name;
            }
        };
        reader.readAsDataURL(file);

        // 업로드된 파일을 전역 변수에 저장 (저장 시 사용)
        window.uploadedImageFile = file;
    }

    // 이벤트 리스너 추가
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', addIngredient);
    }

    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', addRecipeSection);
    }

    // 이미지 업로드 이벤트 리스너
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
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