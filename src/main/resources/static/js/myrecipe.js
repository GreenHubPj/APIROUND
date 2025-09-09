document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 내 레시피 페이지가 로드되었습니다.');

    // DOM 요소들
    const recipeCards = document.querySelectorAll('.recipe-card');
    const addRecipeBtn = document.getElementById('addRecipeBtn');

    // 페이징 관련 변수
    let currentPage = 1;
    const itemsPerPage = 12;
    
    // 실제 데이터 개수 계산
    const totalItems = recipeCards.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    console.log(`총 레시피 개수: ${totalItems}, 총 페이지 수: ${totalPages}`);

    // 동적 페이징 UI 생성 함수
    function createPaginationUI() {
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) {
            console.log('페이징 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            console.log('페이징이 필요하지 않습니다. 모든 레시피가 1페이지에 표시됩니다.');
            return;
        }
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                <span id="pageInfo">1페이지 (1-${Math.min(itemsPerPage, totalItems)} / 총 ${totalItems}개)</span>
            </div>
            <div class="pagination">
                <button class="page-btn" id="prevBtn">← 이전</button>
                <div class="page-numbers" id="pageNumbers">
                    ${generatePageNumbers()}
                </div>
                <button class="page-btn" id="nextBtn">다음 →</button>
            </div>
        `;
        
        // 페이징 이벤트 리스너 추가
        addPaginationEventListeners();
    }

    // 페이지 번호 생성 함수
    function generatePageNumbers() {
        let pageNumbers = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        return pageNumbers;
    }

    // 페이징 이벤트 리스너 추가
    function addPaginationEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.querySelectorAll('.page-number');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    showPage(currentPage - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    showPage(currentPage + 1);
                }
            });
        }
        
        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                showPage(page);
            });
        });
    }

    // 페이지 표시 함수
    function showPage(page) {
        currentPage = page;
        
        // 모든 레시피 카드 숨기기
        recipeCards.forEach(card => {
            card.classList.add('hidden');
        });
        
        // 현재 페이지의 레시피만 보이기
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        for (let i = startIndex; i < endIndex; i++) {
            if (recipeCards[i]) {
                recipeCards[i].classList.remove('hidden');
            }
        }
        
        // 페이징 UI 업데이트
        updatePaginationUI();
        
        // 애니메이션 적용
        animateVisibleCards();
    }
    
    // 페이징 UI 업데이트 함수
    function updatePaginationUI() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const pageNumbers = document.getElementById('pageNumbers');
        
        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage === totalPages;
        }
        
        if (pageInfo) {
            const startIndex = (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
            pageInfo.textContent = `${currentPage}페이지 (${startIndex}-${endIndex} / 총 ${totalItems}개)`;
        }
        
        if (pageNumbers) {
            pageNumbers.innerHTML = generatePageNumbers();
            addPaginationEventListeners();
        }
    }

    // 보이는 카드들에 애니메이션 적용
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.recipe-card:not(.hidden)');
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // 레시피 카드 클릭 이벤트
    recipeCards.forEach(card => {
        card.addEventListener('click', function() {
            const recipeId = this.getAttribute('data-recipe-id');
            const recipeName = this.querySelector('.recipe-name').textContent;
            
            // myrecipe-detail 페이지로 이동
            window.location.href = `/myrecipe-detail?id=${recipeId}&name=${encodeURIComponent(recipeName)}`;
        });
        
        // 호버 효과
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
        });
    });

    // 새 레시피 추가 버튼 이벤트
    if (addRecipeBtn) {
        addRecipeBtn.addEventListener('click', function() {
            // 새 레시피 작성 페이지로 이동
            window.location.href = '/newrecipe';
        });
    }


    // 레시피 액션 영역 클릭 이벤트 방지
    const recipeActions = document.querySelectorAll('.recipe-actions');
    recipeActions.forEach(action => {
        action.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        });
    });

    // 레시피 삭제 버튼 이벤트 - 직접 이벤트 리스너 추가
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // 기본 동작 방지
            e.stopPropagation(); // 이벤트 전파 방지
            e.stopImmediatePropagation(); // 즉시 이벤트 전파 방지
            
            const recipeCard = this.closest('.recipe-card');
            const recipeId = recipeCard.getAttribute('data-recipe-id');
            const recipeName = recipeCard.querySelector('.recipe-name').textContent;
            
            if (confirm(`"${recipeName}" 레시피를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                deleteRecipe(recipeCard, recipeId, recipeName);
            }
            
            return false; // 추가적인 이벤트 방지
        });
    });

    // 레시피 삭제 함수
    function deleteRecipe(recipeCard, recipeId, recipeName) {
        // 애니메이션 효과
        recipeCard.style.transition = 'all 0.3s ease';
        recipeCard.style.transform = 'translateX(-100%)';
        recipeCard.style.opacity = '0';
        
        setTimeout(() => {
            // 실제로는 서버에 삭제 요청
            // fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
            //     .then(response => response.json())
            //     .then(data => {
            //         if (data.success) {
            //             recipeCard.remove();
            //             showMessage(`"${recipeName}" 레시피가 삭제되었습니다.`, 'success');
            //         } else {
            //             showMessage('레시피 삭제에 실패했습니다.', 'error');
            //         }
            //     });
            
            // 임시로 DOM에서 제거
            recipeCard.remove();
            showMessage(`"${recipeName}" 레시피가 삭제되었습니다.`, 'success');
            
            // 페이징 업데이트 (실제로는 서버에서 데이터를 다시 가져와야 함)
            updateRecipeCount();
        }, 300);
    }

    // 레시피 개수 업데이트
    function updateRecipeCount() {
        const remainingCards = document.querySelectorAll('.recipe-card');
        console.log(`남은 레시피 개수: ${remainingCards.length}`);
        
        if (remainingCards.length === 0) {
            showEmptyRecipes();
        }
    }

    // 빈 레시피 표시
    function showEmptyRecipes() {
        const recipesGrid = document.getElementById('recipesGrid');
        recipesGrid.innerHTML = `
            <div class="empty-recipes">
                <div class="empty-recipes-icon">📝</div>
                <h2>작성한 레시피가 없습니다</h2>
                <p>새로운 레시피를 작성해보세요!</p>
                <button class="add-recipe-btn" onclick="document.getElementById('addRecipeBtn').click()">
                    <span class="add-icon">+</span>
                    새 레시피 추가
                </button>
            </div>
        `;
        
        // 페이징 숨기기
        document.getElementById('paginationContainer').style.display = 'none';
    }

    // 메시지 표시 함수 (shoppinglist.js와 동일)
    function showMessage(message, type = 'info', targetElement = null) {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.recipe-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageElement = document.createElement('div');
        messageElement.className = `recipe-message recipe-message-${type}`;
        messageElement.textContent = message;
        
        // 타입별 색상
        const colors = {
            success: '#4CAF50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196F3'
        };
        
        // 기본 스타일
        messageElement.style.cssText = `
            position: absolute;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: slideInUp 0.3s ease-out;
            max-width: 250px;
            word-wrap: break-word;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            pointer-events: none;
        `;
        
        messageElement.style.background = colors[type] || colors.info;
        
        // 타겟 요소가 있으면 그 근처에 표시, 없으면 기본 위치
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // 버튼 위쪽에 표시
            messageElement.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
            messageElement.style.top = (rect.top + scrollTop - 50) + 'px';
            messageElement.style.transform = 'translateX(-50%)';
            
            // 화면 밖으로 나가지 않도록 조정
            if (rect.left < 125) {
                messageElement.style.left = '125px';
                messageElement.style.transform = 'none';
            } else if (rect.right > window.innerWidth - 125) {
                messageElement.style.left = (window.innerWidth - 125) + 'px';
                messageElement.style.transform = 'none';
            }
        } else {
            // 기본 위치 (화면 중앙 상단)
            messageElement.style.cssText += `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                animation: slideInDown 0.3s ease-out;
            `;
        }
        
        // DOM에 추가
        document.body.appendChild(messageElement);
        
        // 3초 후 제거
        setTimeout(() => {
            messageElement.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);
        }, 3000);
    }

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideInDown {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-20px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // 페이징 UI 생성 및 초기화
    createPaginationUI();
    
    // 총 페이지가 1개 이하면 페이징 적용하지 않음
    if (totalPages > 1) {
        // 첫 번째 페이지 표시
        showPage(1);
    } else {
        // 모든 카드가 1페이지에 표시되므로 페이징 적용하지 않음
        console.log('모든 레시피가 1페이지에 표시됩니다.');
    }

    // 페이지 로드 완료 메시지
    console.log('내 레시피 페이지 초기화 완료');
});
