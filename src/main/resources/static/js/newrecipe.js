document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 새 레시피 작성 페이지가 로드되었습니다.');

    // DOM 요소들
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const imageUpload = document.getElementById('imageUpload');
    const ingredientsList = document.getElementById('ingredientsList');
    const recipeInstructions = document.querySelector('.recipe-instructions');

    // 저장 버튼
    saveBtn.addEventListener('click', saveRecipe);

    // 취소 버튼
    cancelBtn.addEventListener('click', cancelRecipe);

    // 재료 추가 버튼
    addIngredientBtn.addEventListener('click', addIngredient);

    // 섹션 추가 버튼
    addSectionBtn.addEventListener('click', addInstructionSection);

    // 이미지 업로드
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const recipeImage = document.querySelector('.recipe-main-image');
                    if (recipeImage) {
                        recipeImage.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 재료 리스트 내 클릭 이벤트 위임 (삭제 버튼)
    ingredientsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-ingredient')) {
            if (confirm('이 재료를 삭제하시겠습니까?')) {
                e.target.closest('.ingredient-item').remove();
            }
        }
    });

    // 요리법 섹션 내 클릭 이벤트 위임 (단계 추가/삭제, 섹션 삭제)
    recipeInstructions.addEventListener('click', (e) => {
        // 단계 추가
        if (e.target.classList.contains('add-step')) {
            addStep(e);
        }

        // 단계 삭제
        else if (e.target.classList.contains('remove-step')) {
            removeStep(e);
        }

        // 섹션 삭제
        else if (e.target.classList.contains('remove-section')) {
            if (confirm('이 요리법 섹션을 삭제하시겠습니까?')) {
                e.target.closest('.instruction-section').remove();
            }
        }
    });

    // 재료 추가 함수
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

    // 단계 추가 함수
    function addStep(event) {
        const instructionSteps = event.target.closest('.instruction-section').querySelector('.instruction-steps');
        const newStep = document.createElement('li');
        newStep.setAttribute('contenteditable', 'true');
        newStep.innerHTML = '새로운 요리 단계를 입력하세요.<button class="remove-step">×</button>';
        instructionSteps.appendChild(newStep);

        // 커서 위치 조정
        const textNode = newStep.childNodes[0];
        if (textNode) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    // 단계 삭제 함수
    function removeStep(event) {
        event.stopPropagation();
        const stepItem = event.target.closest('li');
        const instructionSteps = stepItem.closest('.instruction-steps');
        const totalSteps = instructionSteps.querySelectorAll('li').length;

        if (totalSteps <= 1) {
            alert('최소 하나의 단계는 유지해야 합니다.');
            return;
        }

        if (confirm('이 단계를 삭제하시겠습니까?')) {
            stepItem.remove();
        }
    }

    // 요리법 섹션 추가 함수
    function addInstructionSection() {
        const instructionsContainer = document.querySelector('.recipe-instructions');
        const newSection = document.createElement('div');
        newSection.className = 'instruction-section';
        newSection.innerHTML = `
            <h3 class="instruction-title" contenteditable="true">새로운 요리법 섹션</h3>
            <ol class="instruction-steps">
                <li contenteditable="true">첫 번째 단계를 입력하세요.<button class="remove-step">×</button></li>
            </ol>
            <button class="add-step">+ 단계 추가</button>
            <button class="remove-section">섹션 삭제</button>
        `;
        instructionsContainer.appendChild(newSection);

        const newTitle = newSection.querySelector('.instruction-title');
        newTitle.focus();
        document.execCommand('selectAll', false, null);
    }

    // 레시피 저장 함수
    function saveRecipe() {
        const title = document.querySelector('.recipe-title').textContent.trim();
        const servings = document.querySelector('.recipe-servings').textContent.trim();
        const imageSrc = document.querySelector('.recipe-main-image').src;

        const ingredients = Array.from(document.querySelectorAll('.ingredient-item')).map(item => ({
            name: item.querySelector('.ingredient-name').textContent.trim(),
            amount: item.querySelector('.ingredient-amount').textContent.trim()
        })).filter(ing => ing.name && ing.name !== '새 재료');

        const instructions = Array.from(document.querySelectorAll('.instruction-section')).map(section => ({
            title: section.querySelector('.instruction-title').textContent.trim(),
            steps: Array.from(section.querySelectorAll('.instruction-steps li')).map(step => step.textContent.replace('×', '').trim())
        }));

        if (!title) {
            alert('요리법 제목을 입력해주세요.');
            return;
        }
        if (ingredients.length === 0) {
            alert('최소 하나의 재료를 입력해주세요.');
            return;
        }
        if (instructions.length === 0) {
            alert('최소 하나의 요리법 섹션을 입력해주세요.');
            return;
        }

        const allSteps = [];
        instructions.forEach(instruction => {
            instruction.steps.forEach(stepText => {
                allSteps.push({
                    stepOrder: allSteps.length + 1,
                    description: stepText,
                    imageUrl: null
                });
            });
        });

        const recipeData = {
            title: title,
            summary: `${title} - 맛있는 요리법입니다.`,
            badgeText: "신규 레시피",
            difficulty: "EASY",
            cookMinutes: 30,
            totalMinutes: 45,
            servings: servings,
            heroImageUrl: imageSrc,
            ingredients: ingredients,
            steps: allSteps,
            instructions: instructions
        };

        console.log('새 레시피 저장:', recipeData);

        fetch('/mypage/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData)
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('저장 성공:', data);
            alert('새 레시피가 성공적으로 저장되었습니다!');
            window.location.href = '/myrecipe';
        })
        .catch(error => {
            console.error('저장 실패:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        });
    }

    // 레시피 작성 취소 함수
    function cancelRecipe() {
        if (confirm('작성 중인 레시피를 취소하시겠습니까? 저장되지 않은 내용은 사라집니다.')) {
            window.location.href = '/myrecipe';
        }
    }

    console.log('새 레시피 작성 페이지 초기화 완료');
});
