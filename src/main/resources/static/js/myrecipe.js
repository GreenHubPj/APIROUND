document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 내 레시피 페이지가 로드되었습니다.');

    const addRecipeBtn = document.getElementById('addRecipeBtn');
    const recipesGrid = document.getElementById('recipesGrid');
    const paginationContainer = document.getElementById('paginationContainer');

    let currentPage = 1;
    const itemsPerPage = 12;

    let recipeData = [];  // 서버에서 받아온 레시피 데이터 저장용

    //const currentUserId = 1; // 예시용 로그인 유저 ID

    console.log('현재 유저 ID:', currentUserId);

    // 서버에서 레시피 데이터 불러오기
    fetch(`/mypage/recipes?userId=${currentUserId}`)
        .then(response => response.json())
        .then(data => {
            recipeData = data;
            console.log('서버에서 받은 레시피 데이터:', recipeData);

            renderRecipes(recipeData);
            createPaginationUI();
            if (getTotalPages() > 1) {
                showPage(1);
            } else {
                console.log('모든 레시피가 1페이지에 표시됩니다.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

    // 레시피 렌더링 함수
    function renderRecipes(data) {
        recipesGrid.innerHTML = ''; // 초기화

        data.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.setAttribute('data-recipe-id', recipe.recipeId);
            card.setAttribute('data-user-id', recipe.userId);
           const imageUrl = recipe.heroImageUrl && recipe.heroImageUrl.trim() !== ''
               ? recipe.heroImageUrl
               : '/images/recipe.jpg';

           card.innerHTML = `
               <div class="recipe-image">
                   <img src="${imageUrl}"
                        alt="${recipe.title}"
                        onerror="this.onerror=null; this.src='/images/recipe.jpg';" />
               </div>
               <div class="recipe-content">
                   <div class="recipe-name">${recipe.title}</div>
                   <div class="recipe-summary">${recipe.summary || '요약 없음'}</div>
                   <div class="recipe-badge">${recipe.badgeText || ''}</div>
                   <div class="recipe-meta">
                       <span>⏱ ${recipe.totalMinutes}분</span>
                       <span>난이도: ${recipe.difficulty}</span>
                       <span>인분: ${recipe.servings}</span>
                   </div>
               </div>

           `;
            recipesGrid.appendChild(card);
        });

        updateRecipeCardEvents();
    }

       // 레시피 카드 이벤트 (클릭, 호버, 삭제) 업데이트
      function updateRecipeCardEvents() {
          const recipeCards = document.querySelectorAll('.recipe-card');

          recipeCards.forEach(card => {
              // 클릭 이벤트 (레시피 카드 클릭 시 상세보기로 이동)
              card.addEventListener('click', function () {
                  const recipeId = this.getAttribute('data-recipe-id');  // data-recipe-id 가져오기
                  const userId = this.getAttribute('data-user-id');    // data-user-id 가져오기

                  console.log('recipeId:', recipeId, 'userId:', userId);  // console.log로 확인

                  if (!userId) {
                      console.error('userId가 없다!');
                      return;  // userId가 없으면 아무 동작도 하지 않음
                  }

                  // userId가 제대로 읽어졌다면 URL에 id와 userId만 포함시켜서 이동
                  window.location.href = `/myrecipe-detail?id=${recipeId}&userId=${userId}`;
              });

              // 마우스 hover 이벤트 (카드 스타일 변화)
              card.addEventListener('mouseenter', function () {
                  this.style.transform = 'translateY(-5px)';
                  this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
              });

              // 마우스 hover 이벤트 종료 (카드 스타일 복원)
              card.addEventListener('mouseleave', function () {
                  this.style.transform = 'translateY(0)';
                  this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              });

              // 삭제 버튼 이벤트 (삭제 시 확인 및 삭제 처리)
              const deleteBtn = card.querySelector('.delete-btn');
              if (deleteBtn) {
                  deleteBtn.addEventListener('click', function (e) {
                      e.preventDefault();  // 기본 동작 방지
                      e.stopPropagation(); // 이벤트 전파 방지

                      const recipeName = card.querySelector('.recipe-name').textContent;
                      const recipeId = card.getAttribute('data-recipe-id');

                      if (confirm(`"${recipeName}" 레시피를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                          deleteRecipe(recipeId);  // 삭제 로직 호출
                      }
                  });
              }
          });
      }

    // 레시피 삭제 함수
    function deleteRecipe(recipeId) {
        // 서버에 삭제 요청 (예시 주석)
        // fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
        //     .then(res => res.json())
        //     .then(data => {
        //         if(data.success) {
        //             ...
        //         }
        //     });

        // 임시로 로컬 데이터에서 삭제
        const index = recipeData.findIndex(r => r.recipeId === recipeId);
        if (index > -1) {
            const deletedRecipeName = recipeData[index].title;
            recipeData.splice(index, 1);
            renderRecipes(recipeData);
            createPaginationUI();

            if (recipeData.length === 0) {
                showEmptyRecipes();
            } else {
                const maxPage = getTotalPages();
                if (currentPage > maxPage) currentPage = maxPage;
                showPage(currentPage);
            }

            showMessage(`"${deletedRecipeName}" 레시피가 삭제되었습니다.`, 'success');
        }
    }

    // 빈 레시피 표시
    function showEmptyRecipes() {
        recipesGrid.innerHTML = `
            <div class="empty-recipes">
                <div class="empty-recipes-icon">📝</div>
                <h2>작성한 레시피가 없습니다</h2>
                <p>새로운 레시피를 작성해보세요!</p>
                <button class="add-recipe-btn" id="emptyAddRecipeBtn">
                    <span class="add-icon">+</span>
                    새 레시피 추가
                </button>
            </div>
        `;
        paginationContainer.style.display = 'none';

        document.getElementById('emptyAddRecipeBtn').addEventListener('click', () => {
            addRecipeBtn.click();
        });
    }

    // 페이징 관련 함수들
    function getTotalPages() {
        return Math.ceil(recipeData.length / itemsPerPage);
    }

    function createPaginationUI() {
        const totalPages = getTotalPages();

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'block';
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                <span id="pageInfo">1페이지 (1-${Math.min(itemsPerPage, recipeData.length)} / 총 ${recipeData.length}개)</span>
            </div>
            <div class="pagination">
                <button class="page-btn" id="prevBtn">← 이전</button>
                <div class="page-numbers" id="pageNumbers">${generatePageNumbers(currentPage, totalPages)}</div>
                <button class="page-btn" id="nextBtn">다음 →</button>
            </div>
        `;

        addPaginationEventListeners();
    }

    function generatePageNumbers(current, total) {
        const maxVisiblePages = 5;
        let startPage = Math.max(1, current - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(total, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        let html = '';
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-number ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        return html;
    }

    function addPaginationEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageNumbers = document.querySelectorAll('.page-number');

        if (prevBtn) {
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) showPage(currentPage - 1);
            });
        }

        if (nextBtn) {
            nextBtn.disabled = currentPage === getTotalPages();
            nextBtn.addEventListener('click', () => {
                if (currentPage < getTotalPages()) showPage(currentPage + 1);
            });
        }

        pageNumbers.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                showPage(page);
            });
        });
    }

    function showPage(page) {
        currentPage = page;
        const totalItems = recipeData.length;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        // 레시피 카드 모두 숨기기 후 해당 페이지의 카드만 보이도록 렌더링
        recipesGrid.innerHTML = '';

        for (let i = startIndex; i < endIndex; i++) {
            const recipe = recipeData[i];
            if (!recipe) continue;

            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.setAttribute('data-recipe-id', recipe.recipeId);

            card.innerHTML = `
                <div class="recipe-image">
                    <img src="${recipe.heroImageUrl || '/images/default-image.png'}" alt="${recipe.title}" />
                </div>
                <div class="recipe-content">
                    <div class="recipe-name">${recipe.title}</div>
                    <div class="recipe-summary">${recipe.summary || '요약 없음'}</div>
                    <div class="recipe-badge">${recipe.badgeText || ''}</div>
                    <div class="recipe-meta">
                        <span>⏱ ${recipe.totalMinutes}분</span>
                        <span>난이도: ${recipe.difficulty}</span>
                        <span>인분: ${recipe.servings}</span>
                    </div>
                </div>
                <div class="recipe-actions">
                    <button class="delete-btn">삭제</button>
                </div>
            `;

            recipesGrid.appendChild(card);
        }

        updateRecipeCardEvents();
        updatePaginationUI();
        animateVisibleCards();
    }

    function updatePaginationUI() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const pageNumbers = document.getElementById('pageNumbers');

        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === getTotalPages();

        if (pageInfo) {
            const startIndex = (currentPage - 1) * itemsPerPage + 1;
            const endIndex = Math.min(currentPage * itemsPerPage, recipeData.length);
            pageInfo.textContent = `${currentPage}페이지 (${startIndex}-${endIndex} / 총 ${recipeData.length}개)`;
        }

        if (pageNumbers) {
            pageNumbers.innerHTML = generatePageNumbers(currentPage, getTotalPages());
            addPaginationEventListeners();
        }
    }

    // 카드 애니메이션 효과
    function animateVisibleCards() {
        const visibleCards = document.querySelectorAll('.recipe-card');
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

    // 새 레시피 추가 버튼 이벤트
    if (addRecipeBtn) {
        addRecipeBtn.addEventListener('click', () => {
            window.location.href = '/newrecipe';
        });
    }

    // 레시피 액션 영역 클릭 이벤트 전파 방지
    recipesGrid.addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // 메시지 표시 함수
    function showMessage(message, type = 'info', targetElement = null) {
        const existingMessage = document.querySelector('.recipe-message');
        if (existingMessage) existingMessage.remove();

        const messageElement = document.createElement('div');
        messageElement.className = `recipe-message recipe-message-${type}`;
        messageElement.textContent = message;

        const colors = {
            success: '#4CAF50',
            warning: '#ff9800',
            error: '#f44336',
            info: '#2196F3'
        };

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
            background: ${colors[type] || colors.info};
        `;

        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

            messageElement.style.left = (rect.left + scrollLeft + rect.width / 2) + 'px';
            messageElement.style.top = (rect.top + scrollTop - 50) + 'px';
            messageElement.style.transform = 'translateX(-50%)';

            if (rect.left < 125) {
                messageElement.style.left = '125px';
                messageElement.style.transform = 'none';
            } else if (rect.right > window.innerWidth - 125) {
                messageElement.style.left = (window.innerWidth - 125) + 'px';
                messageElement.style.transform = 'none';
            }
        } else {
            messageElement.style.cssText += `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                animation: slideInDown 0.3s ease-out;
            `;
        }

        document.body.appendChild(messageElement);

        setTimeout(() => {
            messageElement.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => {
                if (messageElement.parentNode) messageElement.remove();
            }, 300);
        }, 3000);
    }

     // CSS 애니메이션 추가
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes slideOutUp {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-20px); opacity: 0; }
            }

            @keyframes slideInDown {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    });