document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 새 레시피 작성 페이지가 로드되었습니다.');

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
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addSectionBtn = document.getElementById('addSectionBtn');
    const imageUpload = document.getElementById('imageUpload');
    const ingredientsList = document.getElementById('ingredientsList');

    // 저장 버튼
    saveBtn.addEventListener('click', function() {
        saveRecipe();
    });

    // 취소 버튼
    cancelBtn.addEventListener('click', function() {
        cancelRecipe();
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
        const cleanName = ingredientName.toLowerCase().trim();
        
        for (const product of regionalProducts) {
            const productName = product.name.toLowerCase();
            
            if (productName === cleanName) {
                return product;
            }
            
            if (cleanName.includes(productName) || productName.includes(cleanName)) {
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

    // 재료 추가
    function addIngredient() {
        const newIngredient = document.createElement('li');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <span class="ingredient-name" contenteditable="true">새 재료</span>
            <span class="ingredient-amount" contenteditable="true">1개</span>
            <button class="remove-ingredient">×</button>
        `;
        
        ingredientsList.appendChild(newIngredient);
        addIngredientDeleteEvents();
        addIngredientChangeEvents();
        
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
        newStep.setAttribute('contenteditable', 'true');
        newStep.innerHTML = '새로운 요리 단계를 입력하세요.<button class="remove-step">×</button>';
        
        instructionSteps.appendChild(newStep);
        
        const textNode = newStep.childNodes[0];
        if (textNode) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        addStepEvents();
    }

    // 단계 삭제
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
            <h3 class="instruction-title" contenteditable="true">새로운 요리법 섹션</h3>
            <ol class="instruction-steps">
                <li contenteditable="true">첫 번째 단계를 입력하세요.<button class="remove-step">×</button></li>
            </ol>
            <button class="add-step">+ 단계 추가</button>
            <button class="remove-section">섹션 삭제</button>
        `;
        
        instructionsContainer.appendChild(newSection);
        
        addStepEvents();
        addSectionDeleteEvents();
        
        const newTitle = newSection.querySelector('.instruction-title');
        newTitle.focus();
        newTitle.select();
    }

    // 레시피 저장
    function saveRecipe() {
        // 기본 데이터 수집
        const title = document.querySelector('.recipe-title').textContent;
        const servings = document.querySelector('.recipe-servings').textContent;
        const imageSrc = document.querySelector('.recipe-main-image').src;
        
        // 재료 데이터 수집
        const ingredients = Array.from(document.querySelectorAll('.ingredient-item')).map(item => ({
            name: item.querySelector('.ingredient-name').textContent,
            amount: item.querySelector('.ingredient-amount').textContent
        }));
        
        // 조리 단계 데이터 수집 (instructions를 steps로 변환)
        const instructions = Array.from(document.querySelectorAll('.instruction-section')).map(section => ({
            title: section.querySelector('.instruction-title').textContent,
            steps: Array.from(section.querySelectorAll('.instruction-steps li')).map(step => step.textContent)
        }));
        
        // steps 배열 생성 (instructions의 모든 단계를 하나의 배열로 합침)
        const allSteps = [];
        instructions.forEach((instruction, sectionIndex) => {
            instruction.steps.forEach((stepText, stepIndex) => {
                allSteps.push({
                    stepOrder: allSteps.length + 1,
                    description: stepText,
                    imageUrl: null // 이미지 URL은 나중에 추가 가능
                });
            });
        });

        // DTO 구조에 맞는 데이터 생성
        const recipeData = {
            title: title,
            summary: `${title} - 맛있는 요리법입니다.`, // 기본 요약 생성
            badgeText: "신규 레시피", // 기본 배지 텍스트
            difficulty: "EASY", // 기본 난이도 (나중에 UI에서 선택 가능)
            cookMinutes: 30, // 기본 조리 시간 (나중에 UI에서 입력 가능)
            totalMinutes: 45, // 기본 총 시간 (나중에 UI에서 입력 가능)
            servings: servings,
            heroImageUrl: imageSrc,
            ingredients: ingredients,
            steps: allSteps,
            instructions: instructions
        };

        // 유효성 검사
        if (!recipeData.title.trim() || recipeData.title === '새로운 요리법 제목을 입력하세요') {
            alert('요리법 제목을 입력해주세요.');
            return;
        }

        if (recipeData.ingredients.length === 0 || 
            recipeData.ingredients.every(ing => ing.name === '재료명' || ing.name === '새 재료')) {
            alert('최소 하나의 재료를 입력해주세요.');
            return;
        }

        if (recipeData.instructions.length === 0) {
            alert('최소 하나의 요리법 섹션을 입력해주세요.');
            return;
        }

        // 서버에 전송
        console.log('새 레시피 저장:', recipeData);
        fetch('/mypage/recipes?userId=1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(recipeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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

    // 레시피 작성 취소
    function cancelRecipe() {
        if (confirm('작성 중인 레시피를 취소하시겠습니까? 저장되지 않은 내용은 사라집니다.')) {
            window.location.href = '/myrecipe';
        }
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

    // 초기 이벤트 설정
    addIngredientDeleteEvents();
    addIngredientChangeEvents();
    addStepEvents();
    addSectionDeleteEvents();

    // 페이지 로드 완료 메시지
    console.log('새 레시피 작성 페이지 초기화 완료');
});
