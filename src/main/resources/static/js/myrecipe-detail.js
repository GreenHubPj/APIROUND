document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 내 요리법 상세 페이지가 로드되었습니다.');

    // 편집 모드 상태
    let isEditMode = false;
    let originalData = {};

    // 지역별 특산품 데이터
    const regionalProducts = [
        { name: "사과", region: "문경", image: "/images/사과.jpg", description: "문경에서 유명한 사과" },
        { name: "돼지고기", region: "고흥", image: "/images/제철 돼지.jpg", description: "좋은 품질만 선별하는 고흥에서" },
        { name: "복숭아", region: "경산", image: "/images/제철 천도복숭아.jpg", description: "새콤달콤 복숭아" },
        { name: "당근", region: "구좌", image: "/images/제철 당근.jpg", description: "제주도 말들 조차 즐겨먹는!" },
        { name: "마늘", region: "의성", image: "/images/제철 마늘.jpg", description: "한국인에게 필수 음식" },
        { name: "감자", region: "강원도", image: "/images/인기 감자.jpg", description: "강원도 고랭지 감자" },
        { name: "귤", region: "제주", image: "/images/인기 귤.jpg", description: "제주도 유명한 귤" },
        { name: "새우", region: "서해", image: "/images/인기 새우.jpg", description: "서해안 신선한 새우" },
        { name: "표고버섯", region: "산청", image: "/images/인기 표고버섯.jpg", description: "산청의 유명한 표고버섯" },
        { name: "쌀", region: "이천", image: "/images/쌀.jpg", description: "이천의 명품 쌀" }
    ];

    // DOM 요소들
    const editModeBtn = document.getElementById('editModeBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteRecipeBtn = document.getElementById('deleteRecipeBtn');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const imageUpload = document.getElementById('imageUpload');
    const ingredientsList = document.getElementById('ingredientsList');

    // 편집 모드 토글
    editModeBtn.addEventListener('click', function() {
        enterEditMode();
    });

    // 저장 버튼
    saveBtn.addEventListener('click', function() {
        saveRecipe();
    });

    // 취소 버튼
    cancelBtn.addEventListener('click', function() {
        cancelEdit();
    });

    // 삭제하기 버튼
    deleteRecipeBtn.addEventListener('click', function() {
        deleteRecipe();
    });

    // 재료 추가 버튼
    addIngredientBtn.addEventListener('click', function() {
        addIngredient();
    });

    // 섹션 추가 버튼
    addSectionBtn.addEventListener('click', function() {
        addInstructionSection();
    });

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

    // 재료명에 따라 관련 특산품 찾기
    function findRelatedProduct(ingredientName) {
        // 재료명에서 키워드 추출 (공백 제거, 소문자 변환)
        const cleanName = ingredientName.toLowerCase().trim();
        
        // 특산품 데이터에서 매칭되는 항목 찾기
        for (const product of regionalProducts) {
            const productName = product.name.toLowerCase();
            
            // 정확한 매칭
            if (productName === cleanName) {
                return product;
            }
            
            // 부분 매칭 (예: "사과"가 "사과즙"에 포함)
            if (cleanName.includes(productName) || productName.includes(cleanName)) {
                return product;
            }
        }
        
        // 키워드 매칭 (예: "돼지" -> "돼지고기")
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
                const product = regionalProducts.find(p => p.name === productName);
                if (product) return product;
            }
        }
        
        return null;
    }

    // ingredient-note 업데이트
    function updateIngredientNote() {
        const ingredients = document.querySelectorAll('.ingredient-name');
        const ingredientNote = document.querySelector('.ingredient-note');
        
        if (!ingredientNote || ingredients.length === 0) return;
        
        // 첫 번째 재료를 기준으로 관련 특산품 찾기
        const firstIngredient = ingredients[0].textContent.trim();
        const relatedProduct = findRelatedProduct(firstIngredient);
        
        if (relatedProduct) {
            const productImage = ingredientNote.querySelector('.recipe-product-image');
            const productText = ingredientNote.querySelector('p');
            
            if (productImage) {
                productImage.src = relatedProduct.image;
                productImage.alt = relatedProduct.name;
            }
            
            if (productText) {
                productText.textContent = `${relatedProduct.region} ${relatedProduct.name}`;
            }
        }
    }

    // 편집 모드 진입
    function enterEditMode() {
        isEditMode = true;
        document.body.classList.add('edit-mode');
        
        // 원본 데이터 저장
        saveOriginalData();
        
        // 모든 편집 가능한 요소 활성화
        enableEditing();
        
        console.log('편집 모드 활성화');
    }

    // 편집 모드 종료
    function exitEditMode() {
        isEditMode = false;
        document.body.classList.remove('edit-mode');
        
        // 모든 편집 가능한 요소 비활성화
        disableEditing();
        
        console.log('편집 모드 비활성화');
    }

    // 원본 데이터 저장
    function saveOriginalData() {
        originalData = {
            title: document.querySelector('.recipe-title').textContent,
            servings: document.querySelector('.recipe-servings').textContent,
            ingredients: Array.from(document.querySelectorAll('.ingredient-item')).map(item => ({
                name: item.querySelector('.ingredient-name').textContent,
                amount: item.querySelector('.ingredient-amount').textContent
            })),
            instructions: Array.from(document.querySelectorAll('.instruction-section')).map(section => ({
                title: section.querySelector('.instruction-title').textContent,
                steps: Array.from(section.querySelectorAll('.instruction-steps li')).map(step => step.textContent)
            })),
            productNote: document.querySelector('.ingredient-note p').textContent,
            imageSrc: document.querySelector('.recipe-main-image').src
        };
    }

    // 편집 활성화
    function enableEditing() {
        // 모든 contenteditable 요소 활성화
        const editableElements = document.querySelectorAll('[contenteditable="false"]');
        editableElements.forEach(element => {
            element.setAttribute('contenteditable', 'true');
        });

        // 편집 버튼들 표시
        const editButtons = document.querySelectorAll('.remove-ingredient, .add-ingredient, .add-step, .remove-step, .remove-section, .add-section, .image-upload');
        editButtons.forEach(button => {
            button.style.display = 'block';
        });

        // 재료 삭제 버튼 이벤트 추가
        addIngredientDeleteEvents();
        
        // 단계 추가/삭제 버튼 이벤트 추가
        addStepEvents();
        
        // 섹션 삭제 버튼 이벤트 추가
        addSectionDeleteEvents();

        // 재료명 변경 시 ingredient-note 업데이트
        addIngredientChangeEvents();
    }

    // 편집 비활성화
    function disableEditing() {
        // 모든 contenteditable 요소 비활성화
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(element => {
            element.setAttribute('contenteditable', 'false');
        });

        // 편집 버튼들 숨기기
        const editButtons = document.querySelectorAll('.remove-ingredient, .add-ingredient, .add-step, .remove-section, .add-section, .image-upload');
        editButtons.forEach(button => {
            button.style.display = 'none';
        });
    }

    // 재료 추가
    function addIngredient() {
        const newIngredient = document.createElement('li');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <span class="ingredient-name" contenteditable="false">새 재료</span>
            <span class="ingredient-amount" contenteditable="false">1개</span>
            <button class="remove-ingredient">×</button>
        `;
        
        ingredientsList.appendChild(newIngredient);
        addIngredientDeleteEvents();
        addIngredientChangeEvents();
        
        // 새로 추가된 재료에 포커스
        const newName = newIngredient.querySelector('.ingredient-name');
        newName.focus();
        newName.select();
    }

    // 재료 삭제 이벤트 추가
    function addIngredientDeleteEvents() {
        const removeButtons = document.querySelectorAll('.remove-ingredient');
        removeButtons.forEach(button => {
            button.removeEventListener('click', removeIngredient);
            button.addEventListener('click', removeIngredient);
        });
    }

    // 재료명 변경 이벤트 추가
    function addIngredientChangeEvents() {
        const ingredientNames = document.querySelectorAll('.ingredient-name');
        ingredientNames.forEach(ingredient => {
            ingredient.removeEventListener('input', updateIngredientNote);
            ingredient.addEventListener('input', updateIngredientNote);
            ingredient.removeEventListener('blur', updateIngredientNote);
            ingredient.addEventListener('blur', updateIngredientNote);
        });
    }

    // 재료 삭제
    function removeIngredient(event) {
        if (confirm('이 재료를 삭제하시겠습니까?')) {
            event.target.closest('.ingredient-item').remove();
        }
    }

    // 단계 추가/삭제 이벤트 추가
    function addStepEvents() {
        const addStepButtons = document.querySelectorAll('.add-step');
        addStepButtons.forEach(button => {
            button.removeEventListener('click', addStep);
            button.addEventListener('click', addStep);
        });

        const removeStepButtons = document.querySelectorAll('.remove-step');
        removeStepButtons.forEach(button => {
            button.removeEventListener('click', removeStep);
            button.addEventListener('click', removeStep);
        });
    }

    // 단계 추가
    function addStep(event) {
        const instructionSteps = event.target.closest('.instruction-section').querySelector('.instruction-steps');
        const newStep = document.createElement('li');
        newStep.setAttribute('contenteditable', 'false');
        newStep.innerHTML = '새로운 요리 단계를 입력하세요.<button class="remove-step" style="display: none;">×</button>';
        
        instructionSteps.appendChild(newStep);
        
        // 새로 추가된 단계에 포커스
        const textNode = newStep.childNodes[0];
        if (textNode) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        // 새로 추가된 단계의 삭제 버튼 이벤트 추가
        addStepEvents();
    }

    // 단계 삭제
    function removeStep(event) {
        event.stopPropagation(); // 이벤트 버블링 방지
        
        const stepItem = event.target.closest('li');
        const instructionSteps = stepItem.closest('.instruction-steps');
        const totalSteps = instructionSteps.querySelectorAll('li').length;
        
        // 최소 1개 단계는 유지
        if (totalSteps <= 1) {
            alert('최소 하나의 단계는 유지해야 합니다.');
            return;
        }
        
        if (confirm('이 단계를 삭제하시겠습니까?')) {
            stepItem.remove();
        }
    }

    // 섹션 삭제 이벤트 추가
    function addSectionDeleteEvents() {
        const removeSectionButtons = document.querySelectorAll('.remove-section');
        removeSectionButtons.forEach(button => {
            button.removeEventListener('click', removeSection);
            button.addEventListener('click', removeSection);
        });
    }

    // 섹션 삭제
    function removeSection(event) {
        if (confirm('이 요리법 섹션을 삭제하시겠습니까?')) {
            event.target.closest('.instruction-section').remove();
        }
    }

    // 요리법 섹션 추가
    function addInstructionSection() {
        const instructionsContainer = document.querySelector('.recipe-instructions');
        const newSection = document.createElement('div');
        newSection.className = 'instruction-section';
        newSection.innerHTML = `
            <h3 class="instruction-title" contenteditable="false">새로운 요리법 섹션</h3>
            <ol class="instruction-steps">
                <li contenteditable="false">첫 번째 단계를 입력하세요.<button class="remove-step" style="display: none;">×</button></li>
            </ol>
            <button class="add-step" style="display: none;">+ 단계 추가</button>
            <button class="remove-section" style="display: none;">섹션 삭제</button>
        `;
        
        instructionsContainer.appendChild(newSection);
        
        // 새로 추가된 섹션의 이벤트 추가
        addStepEvents();
        addSectionDeleteEvents();
        
        // 새로 추가된 섹션 제목에 포커스
        const newTitle = newSection.querySelector('.instruction-title');
        newTitle.focus();
        newTitle.select();
    }

    // 요리법 저장
    function saveRecipe() {
        if (!isEditMode) return;

        // 현재 데이터 수집
        const currentData = {
            title: document.querySelector('.recipe-title').textContent,
            servings: document.querySelector('.recipe-servings').textContent,
            ingredients: Array.from(document.querySelectorAll('.ingredient-item')).map(item => ({
                name: item.querySelector('.ingredient-name').textContent,
                amount: item.querySelector('.ingredient-amount').textContent
            })),
            instructions: Array.from(document.querySelectorAll('.instruction-section')).map(section => ({
                title: section.querySelector('.instruction-title').textContent,
                steps: Array.from(section.querySelectorAll('.instruction-steps li')).map(step => step.textContent)
            })),
            productNote: document.querySelector('.ingredient-note p').textContent,
            imageSrc: document.querySelector('.recipe-main-image').src
        };

        // 유효성 검사
        if (!currentData.title.trim()) {
            alert('요리법 제목을 입력해주세요.');
            return;
        }

        if (currentData.ingredients.length === 0) {
            alert('최소 하나의 재료를 입력해주세요.');
            return;
        }

        if (currentData.instructions.length === 0) {
            alert('최소 하나의 요리법 섹션을 입력해주세요.');
            return;
        }

        // 저장 로직 (실제로는 서버에 전송)
        console.log('요리법 저장:', currentData);
        
        // 성공 메시지
        alert('요리법이 성공적으로 저장되었습니다!');
        
        // 편집 모드 종료
        exitEditMode();
    }

    // 편집 취소
    function cancelEdit() {
        if (confirm('변경사항을 취소하시겠습니까? 저장되지 않은 내용은 사라집니다.')) {
            // 원본 데이터로 복원
            restoreOriginalData();
            exitEditMode();
        }
    }

    // 원본 데이터 복원
    function restoreOriginalData() {
        document.querySelector('.recipe-title').textContent = originalData.title;
        document.querySelector('.recipe-servings').textContent = originalData.servings;
        document.querySelector('.ingredient-note p').textContent = originalData.productNote;
        document.querySelector('.recipe-main-image').src = originalData.imageSrc;

        // 재료 목록 복원
        ingredientsList.innerHTML = '';
        originalData.ingredients.forEach(ingredient => {
            const ingredientItem = document.createElement('li');
            ingredientItem.className = 'ingredient-item';
            ingredientItem.innerHTML = `
                <span class="ingredient-name" contenteditable="false">${ingredient.name}</span>
                <span class="ingredient-amount" contenteditable="false">${ingredient.amount}</span>
                <button class="remove-ingredient" style="display: none;">×</button>
            `;
            ingredientsList.appendChild(ingredientItem);
        });

        // 요리법 섹션 복원
        const instructionsContainer = document.querySelector('.recipe-instructions');
        instructionsContainer.innerHTML = '';
        originalData.instructions.forEach(instruction => {
            const section = document.createElement('div');
            section.className = 'instruction-section';
            section.innerHTML = `
                <h3 class="instruction-title" contenteditable="false">${instruction.title}</h3>
                <ol class="instruction-steps">
                    ${instruction.steps.map(step => `<li contenteditable="false">${step}</li>`).join('')}
                </ol>
                <button class="add-step" style="display: none;">+ 단계 추가</button>
                <button class="remove-section" style="display: none;">섹션 삭제</button>
            `;
            instructionsContainer.appendChild(section);
        });
    }

    // 기존 recipe-detail.js의 기능들 유지
    // 재료 항목 클릭 이벤트
    const ingredientItems = document.querySelectorAll('.ingredient-item');
    ingredientItems.forEach(item => {
        item.addEventListener('click', function() {
            if (!isEditMode) {
                const ingredientName = this.querySelector('.ingredient-name').textContent;
                const ingredientAmount = this.querySelector('.ingredient-amount').textContent;
                
                console.log(`재료 선택: ${ingredientName} ${ingredientAmount}`);
                
                // 시각적 피드백
                this.style.backgroundColor = '#fff5f2';
                this.style.borderColor = '#FF6B35';
                
                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.style.borderColor = '';
                }, 1000);
            }
        });
    });

    // 요리법 단계 클릭 이벤트
    const instructionSteps = document.querySelectorAll('.instruction-steps li');
    instructionSteps.forEach((step, index) => {
        step.addEventListener('click', function() {
            if (!isEditMode) {
                console.log(`요리법 단계 ${index + 1} 클릭됨`);
                
                // 시각적 피드백
                this.style.backgroundColor = '#fff5f2';
                this.style.borderLeft = '3px solid #FF6B35';
                this.style.paddingLeft = 'calc(3rem - 3px)';
                
                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.style.borderLeft = '';
                    this.style.paddingLeft = '';
                }, 2000);
            }
        });
    });

    // 요리법 이미지 클릭 이벤트
    const recipeImage = document.querySelector('.recipe-main-image');
    if (recipeImage) {
        recipeImage.addEventListener('click', function() {
            if (!isEditMode) {
                console.log('요리법 이미지 클릭됨');
                
                // 이미지 확대 효과
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.25)';
                
                setTimeout(() => {
                    this.style.transform = '';
                    this.style.boxShadow = '';
                }, 1000);
            }
        });
    }

    // 요리법 제목 클릭 이벤트
    const recipeTitle = document.querySelector('.recipe-title');
    if (recipeTitle) {
        recipeTitle.addEventListener('click', function() {
            if (!isEditMode) {
                console.log('요리법 제목 클릭됨');
                
                // 제목 강조 효과
                this.style.color = '#FF6B35';
                this.style.textShadow = '2px 2px 4px rgba(255, 107, 53, 0.3)';
                
                setTimeout(() => {
                    this.style.color = '';
                    this.style.textShadow = '';
                }, 1500);
            }
        });
    }

    // 인분 표시 클릭 이벤트
    const recipeServings = document.querySelector('.recipe-servings');
    if (recipeServings) {
        recipeServings.addEventListener('click', function() {
            if (!isEditMode) {
                console.log('인분 정보 클릭됨');
                
                // 인분 정보 강조
                this.style.backgroundColor = '#e55a2b';
                this.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    this.style.backgroundColor = '';
                    this.style.transform = '';
                }, 1000);
            }
        });
    }

    // 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 애니메이션 대상 요소들
    const animatedElements = document.querySelectorAll('.instruction-section, .ingredients-section, .recipe-image');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // 요리법 삭제 함수
    function deleteRecipe() {
        const recipeTitle = document.querySelector('.recipe-title').textContent;
        
        if (confirm(`"${recipeTitle}" 요리법을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            // 실제로는 서버에 삭제 요청을 보내야 함
            // fetch(`/api/recipes/${getRecipeId()}`, { method: 'DELETE' })
            //     .then(response => response.json())
            //     .then(data => {
            //         if (data.success) {
            //             showDeleteSuccess();
            //         } else {
            //             showDeleteError();
            //         }
            //     })
            //     .catch(error => {
            //         console.error('삭제 요청 실패:', error);
            //         showDeleteError();
            //     });
            
            // 임시로 성공 처리
            showDeleteSuccess();
        }
    }

    // URL에서 레시피 ID 가져오기
    function getRecipeId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || '1';
    }

    // 삭제 성공 처리
    function showDeleteSuccess() {
        // 페이지에 삭제 성공 메시지 표시
        const recipeCard = document.querySelector('.recipe-card');
        recipeCard.style.transition = 'all 0.5s ease';
        recipeCard.style.transform = 'scale(0.8)';
        recipeCard.style.opacity = '0';
        
        setTimeout(() => {
            // 성공 메시지 표시
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
                    font-family: 'Noto Sans KR', sans-serif;
                ">
                    <div style="
                        background: white;
                        padding: 3rem;
                        border-radius: 20px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        text-align: center;
                        max-width: 500px;
                        margin: 2rem;
                    ">
                        <div style="
                            font-size: 4rem;
                            margin-bottom: 1rem;
                        ">✅</div>
                        <h1 style="
                            color: #2c5530;
                            margin-bottom: 1rem;
                            font-size: 2rem;
                        ">요리법이 삭제되었습니다</h1>
                        <p style="
                            color: #666;
                            margin-bottom: 2rem;
                            font-size: 1.1rem;
                        ">요리법이 성공적으로 삭제되었습니다.</p>
                        <button onclick="window.location.href='/myrecipe'" style="
                            background-color: #28a745;
                            color: white;
                            border: none;
                            padding: 1rem 2rem;
                            border-radius: 25px;
                            font-size: 1.1rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.backgroundColor='#218838'" onmouseout="this.style.backgroundColor='#28a745'">
                            내 요리법으로 돌아가기
                        </button>
                    </div>
                </div>
            `;
        }, 500);
    }

    // 삭제 실패 처리
    function showDeleteError() {
        alert('요리법 삭제에 실패했습니다. 다시 시도해주세요.');
    }

    // 페이지 로드 시 초기 ingredient-note 업데이트
    updateIngredientNote();

    // 페이지 로드 완료 메시지
    console.log('내 요리법 상세 페이지 초기화 완료');
});
