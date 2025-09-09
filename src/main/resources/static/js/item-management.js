// 상품관리 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeItemManagement();
});

// 페이지 초기화
function initializeItemManagement() {
    setupFormHandlers();
    setupImageUpload();
    setupSearchAndFilter();
    setupPriceOptions();
    loadItemList();
    console.log('상품관리 페이지가 초기화되었습니다.');
}

// 더미 데이터
let items = [
    {
        id: 1,
        name: '제주 감귤',
        category: '과일',
        region: '제주',
        priceOptions: [
            { quantity: 2, unit: 'kg', price: 30000 },
            { quantity: 3, unit: 'kg', price: 45000 },
            { quantity: 5, unit: 'kg', price: 70000 }
        ],
        stock: 50,
        origin: '제주도',
        expiryDays: 30,
        storageMethod: '냉장보관',
        seasons: ['11월', '12월', '1월', '2월'],
        description: '제주도에서 직접 재배한 신선한 감귤입니다. 달콤하고 향긋한 맛이 일품입니다.',
        images: [],
        createdAt: '2024-01-15',
        status: 'active'
    },
    {
        id: 2,
        name: '강원도 고랭지 배추',
        category: '채소',
        region: '강원',
        priceOptions: [
            { quantity: 1, unit: '개', price: 8000 },
            { quantity: 2, unit: '개', price: 15000 },
            { quantity: 3, unit: '개', price: 22000 }
        ],
        stock: 30,
        origin: '강원도',
        expiryDays: 15,
        storageMethod: '냉장보관',
        seasons: ['10월', '11월', '12월', '1월', '2월'],
        description: '강원도 고랭지에서 재배한 아삭한 배추입니다. 김치 담그기에 최적입니다.',
        images: [],
        createdAt: '2024-01-14',
        status: 'active'
    },
    {
        id: 3,
        name: '경북 사과',
        category: '과일',
        region: '경북',
        priceOptions: [
            { quantity: 1, unit: 'kg', price: 12000 },
            { quantity: 2, unit: 'kg', price: 23000 },
            { quantity: 3, unit: 'kg', price: 34000 }
        ],
        stock: 25,
        origin: '경상북도',
        expiryDays: 60,
        storageMethod: '냉장보관',
        seasons: ['9월', '10월', '11월'],
        description: '경북 지역의 맛있는 사과입니다. 아삭하고 달콤한 맛이 특징입니다.',
        images: [],
        createdAt: '2024-01-13',
        status: 'active'
    }
];

let currentEditingId = null;
let currentPage = 1;
const itemsPerPage = 6;
let uploadedImages = [];

// 폼 핸들러 설정
function setupFormHandlers() {
    const form = document.getElementById('itemForm');
    const resetBtn = document.getElementById('resetBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    form.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    cancelBtn.addEventListener('click', cancelEdit);
}

// 폼 제출 처리
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = collectFormData();
    
    if (validateForm(formData)) {
        if (currentEditingId) {
            updateItem(currentEditingId, formData);
        } else {
            addItem(formData);
        }
        resetForm();
        loadItemList();
        showMessage('상품이 성공적으로 저장되었습니다.', 'success');
    }
}

// 폼 데이터 수집
function collectFormData() {
    const seasons = Array.from(document.querySelectorAll('input[name="season"]:checked')).map(cb => cb.value);
    
    // 가격 옵션 수집
    const priceOptions = [];
    document.querySelectorAll('.price-option-item').forEach(item => {
        const quantity = item.querySelector('.price-quantity').value;
        const unit = item.querySelector('.price-unit').value;
        const price = item.querySelector('.price-amount').value;
        
        if (quantity && unit && price) {
            priceOptions.push({
                quantity: parseInt(quantity),
                unit: unit,
                price: parseInt(price)
            });
        }
    });
    
    return {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('category').value,
        region: document.getElementById('region').value,
        priceOptions: priceOptions,
        stock: document.getElementById('stock').value ? parseInt(document.getElementById('stock').value) : null,
        origin: document.getElementById('origin').value.trim(),
        expiryDays: document.getElementById('expiryDays').value ? parseInt(document.getElementById('expiryDays').value) : null,
        storageMethod: document.getElementById('storageMethod').value,
        seasons: seasons,
        description: document.getElementById('description').value.trim(),
        images: uploadedImages
    };
}

// 폼 유효성 검사
function validateForm(data) {
    const requiredFields = ['name', 'category', 'region', 'description'];
    
    for (let field of requiredFields) {
        if (!data[field] || data[field] === '') {
            showMessage(`${getFieldLabel(field)}을(를) 입력해주세요.`, 'error');
            return false;
        }
    }
    
    if (data.priceOptions.length === 0) {
        showMessage('가격 옵션을 최소 1개 이상 입력해주세요.', 'error');
        return false;
    }
    
    for (let priceOption of data.priceOptions) {
        if (priceOption.price < 0) {
            showMessage('가격은 0 이상이어야 합니다.', 'error');
            return false;
        }
    }
    
    if (data.stock !== null && data.stock < 0) {
        showMessage('재고수량은 0 이상이어야 합니다.', 'error');
        return false;
    }
    
    if (data.seasons.length === 0) {
        showMessage('제철기간을 최소 1개 이상 선택해주세요.', 'error');
        return false;
    }
    
    if (uploadedImages.length > 5) {
        showMessage('이미지는 최대 5장까지 업로드할 수 있습니다.', 'error');
        return false;
    }
    
    return true;
}

// 필드 라벨 가져오기
function getFieldLabel(field) {
    const labels = {
        name: '상품명',
        category: '카테고리',
        region: '지역',
        price: '가격',
        unit: '판매단위',
        stock: '재고수량',
        description: '상품 설명'
    };
    return labels[field] || field;
}

// 상품 추가
function addItem(data) {
    const newItem = {
        id: Date.now(),
        ...data,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
    };
    items.unshift(newItem);
}

// 상품 수정
function updateItem(id, data) {
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
        items[index] = {
            ...items[index],
            ...data,
            id: id
        };
    }
}

// 상품 삭제
function deleteItem(id) {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        items = items.filter(item => item.id !== id);
        loadItemList();
        showMessage('상품이 삭제되었습니다.', 'success');
    }
}

// 폼 초기화
function resetForm() {
    document.getElementById('itemForm').reset();
    document.getElementById('formTitle').textContent = '새 상품 등록';
    document.getElementById('submitBtn').textContent = '상품 등록';
    document.getElementById('cancelBtn').style.display = 'none';
    currentEditingId = null;
    
    // 이미지 초기화
    uploadedImages = [];
    renderImages();
}

// 편집 취소
function cancelEdit() {
    resetForm();
}

// 상품 편집
function editItem(id) {
    const item = items.find(item => item.id === id);
    if (!item) return;
    
    // 폼에 데이터 채우기
    document.getElementById('productName').value = item.name;
    document.getElementById('category').value = item.category;
    document.getElementById('region').value = item.region;
    document.getElementById('stock').value = item.stock || '';
    document.getElementById('origin').value = item.origin || '';
    document.getElementById('expiryDays').value = item.expiryDays || '';
    document.getElementById('storageMethod').value = item.storageMethod || '';
    document.getElementById('description').value = item.description;
    
    // 가격 옵션 설정
    renderPriceOptions(item.priceOptions || []);
    
    // 제철기간 체크박스 설정
    document.querySelectorAll('input[name="season"]').forEach(checkbox => {
        checkbox.checked = item.seasons && item.seasons.includes(checkbox.value);
    });
    
    // 이미지 설정
    uploadedImages = item.images || [];
    renderImages();
    
    // 편집 모드로 변경
    document.getElementById('formTitle').textContent = '상품 수정';
    document.getElementById('submitBtn').textContent = '수정 완료';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    currentEditingId = id;
    
    // 폼으로 스크롤
    document.querySelector('.item-form-section').scrollIntoView({ behavior: 'smooth' });
}

// 이미지 업로드 설정
function setupImageUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');
    const removeAllImagesBtn = document.getElementById('removeAllImagesBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    
    uploadBtn.addEventListener('click', () => imageUpload.click());
    
    imageUpload.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        
        if (uploadedImages.length + files.length > 5) {
            showMessage('이미지는 최대 5장까지 업로드할 수 있습니다.', 'error');
            return;
        }
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedImages.push({
                        id: Date.now() + Math.random(),
                        src: e.target.result,
                        file: file
                    });
                    renderImages();
                };
                reader.readAsDataURL(file);
            }
        });
    });
    
    removeAllImagesBtn.addEventListener('click', function() {
        uploadedImages = [];
        renderImages();
    });
    
    // 드래그 앤 드롭 기능
    imagePreviewContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#ff8c42';
    });
    
    imagePreviewContainer.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#e1e8ed';
    });
    
    imagePreviewContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#e1e8ed';
        
        const files = Array.from(e.dataTransfer.files);
        if (uploadedImages.length + files.length > 5) {
            showMessage('이미지는 최대 5장까지 업로드할 수 있습니다.', 'error');
            return;
        }
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedImages.push({
                        id: Date.now() + Math.random(),
                        src: e.target.result,
                        file: file
                    });
                    renderImages();
                };
                reader.readAsDataURL(file);
            }
        });
    });
}

// 이미지 렌더링
function renderImages() {
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const removeAllImagesBtn = document.getElementById('removeAllImagesBtn');
    
    if (uploadedImages.length === 0) {
        imagePreviewContainer.innerHTML = `
            <div class="image-preview" id="imagePreview">
                <div class="image-placeholder">
                    <span class="upload-icon">📷</span>
                    <p>이미지를 업로드하세요</p>
                    <small>드래그 앤 드롭 또는 클릭하여 선택</small>
                </div>
            </div>
        `;
        removeAllImagesBtn.style.display = 'none';
    } else {
        imagePreviewContainer.innerHTML = uploadedImages.map(img => `
            <div class="image-item">
                <img src="${img.src}" alt="상품 이미지">
                <button type="button" class="remove-btn" onclick="removeImage('${img.id}')">×</button>
            </div>
        `).join('');
        removeAllImagesBtn.style.display = 'inline-block';
    }
}

// 개별 이미지 삭제
function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id !== imageId);
    renderImages();
}

// 가격 옵션 설정
function setupPriceOptions() {
    const addPriceBtn = document.getElementById('addPriceOption');
    addPriceBtn.addEventListener('click', addPriceOption);
}

// 가격 옵션 추가
function addPriceOption() {
    const container = document.getElementById('priceOptionsContainer');
    const newOption = document.createElement('div');
    newOption.className = 'price-option-item';
    newOption.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">수량</label>
                <input type="number" class="form-input price-quantity" placeholder="예: 1" min="1" required>
            </div>
            <div class="form-group">
                <label class="form-label">단위</label>
                <select class="form-select price-unit" required>
                    <option value="">단위 선택</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="개">개</option>
                    <option value="박스">박스</option>
                    <option value="봉">봉</option>
                    <option value="포기">포기</option>
                    <option value="단">단</option>
                    <option value="팩">팩</option>
                    <option value="병">병</option>
                    <option value="캔">캔</option>
                    <option value="마리">마리</option>
                    <option value="포">포</option>
                    <option value="근">근</option>
                    <option value="되">되</option>
                    <option value="말">말</option>
                    <option value="상자">상자</option>
                    <option value="통">통</option>
                    <option value="봉지">봉지</option>
                    <option value="세트">세트</option>
                    <option value="묶음">묶음</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">가격 (원)</label>
                <input type="number" class="form-input price-amount" placeholder="예: 16000" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label">액션</label>
                <button type="button" class="btn-remove-price" onclick="removePriceOption(this)">삭제</button>
            </div>
        </div>
    `;
    container.appendChild(newOption);
}

// 가격 옵션 삭제
function removePriceOption(button) {
    const container = document.getElementById('priceOptionsContainer');
    if (container.children.length > 1) {
        button.closest('.price-option-item').remove();
    } else {
        showMessage('최소 1개의 가격 옵션이 필요합니다.', 'error');
    }
}

// 가격 옵션 렌더링
function renderPriceOptions(priceOptions) {
    const container = document.getElementById('priceOptionsContainer');
    container.innerHTML = '';
    
    if (priceOptions.length === 0) {
        addPriceOption();
    } else {
        priceOptions.forEach(option => {
            const newOption = document.createElement('div');
            newOption.className = 'price-option-item';
            newOption.innerHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">수량</label>
                        <input type="number" class="form-input price-quantity" placeholder="예: 1" min="1" value="${option.quantity}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">단위</label>
                        <select class="form-select price-unit" required>
                            <option value="">단위 선택</option>
                            <option value="kg" ${option.unit === 'kg' ? 'selected' : ''}>kg</option>
                            <option value="g" ${option.unit === 'g' ? 'selected' : ''}>g</option>
                            <option value="개" ${option.unit === '개' ? 'selected' : ''}>개</option>
                            <option value="박스" ${option.unit === '박스' ? 'selected' : ''}>박스</option>
                            <option value="봉" ${option.unit === '봉' ? 'selected' : ''}>봉</option>
                            <option value="포기" ${option.unit === '포기' ? 'selected' : ''}>포기</option>
                            <option value="단" ${option.unit === '단' ? 'selected' : ''}>단</option>
                            <option value="팩" ${option.unit === '팩' ? 'selected' : ''}>팩</option>
                            <option value="병" ${option.unit === '병' ? 'selected' : ''}>병</option>
                            <option value="캔" ${option.unit === '캔' ? 'selected' : ''}>캔</option>
                            <option value="마리" ${option.unit === '마리' ? 'selected' : ''}>마리</option>
                            <option value="포" ${option.unit === '포' ? 'selected' : ''}>포</option>
                            <option value="근" ${option.unit === '근' ? 'selected' : ''}>근</option>
                            <option value="되" ${option.unit === '되' ? 'selected' : ''}>되</option>
                            <option value="말" ${option.unit === '말' ? 'selected' : ''}>말</option>
                            <option value="상자" ${option.unit === '상자' ? 'selected' : ''}>상자</option>
                            <option value="통" ${option.unit === '통' ? 'selected' : ''}>통</option>
                            <option value="봉지" ${option.unit === '봉지' ? 'selected' : ''}>봉지</option>
                            <option value="세트" ${option.unit === '세트' ? 'selected' : ''}>세트</option>
                            <option value="묶음" ${option.unit === '묶음' ? 'selected' : ''}>묶음</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">가격 (원)</label>
                        <input type="number" class="form-input price-amount" placeholder="예: 16000" min="0" value="${option.price}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">액션</label>
                        <button type="button" class="btn-remove-price" onclick="removePriceOption(this)">삭제</button>
                    </div>
                </div>
            `;
            container.appendChild(newOption);
        });
    }
}

// 검색 및 필터 설정
function setupSearchAndFilter() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const filterCategory = document.getElementById('filterCategory');
    
    searchBtn.addEventListener('click', loadItemList);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadItemList();
        }
    });
    filterCategory.addEventListener('change', loadItemList);
}

// 상품 목록 로드
function loadItemList() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    
    // 필터링
    let filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    // 페이지네이션
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredItems.slice(startIndex, endIndex);
    
    renderItemList(pageItems);
    renderPagination(totalPages);
}

// 상품 목록 렌더링
function renderItemList(items) {
    const itemList = document.getElementById('itemList');
    
    if (items.length === 0) {
        itemList.innerHTML = `
            <div class="empty-message">
                <span class="empty-icon">📦</span>
                <h3>등록된 상품이 없습니다</h3>
                <p>새로운 상품을 등록해보세요!</p>
            </div>
        `;
        return;
    }
    
    itemList.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-image-section">
                ${item.images && item.images.length > 0 ? 
                    `<img src="${item.images[0].src}" alt="${item.name}" class="item-image">` :
                    `<div class="item-placeholder">📦</div>`
                }
            </div>
            <div class="item-info">
                <h3>${item.name}</h3>
                <div class="item-meta">
                    <span class="item-tag">${item.category}</span>
                    <span class="item-tag">${item.region}</span>
                    ${item.origin ? `<span class="item-tag">${item.origin}</span>` : ''}
                </div>
                <div class="item-price">${item.priceOptions.map(option => `${option.quantity}${option.unit} ${option.price.toLocaleString()}원`).join(', ')}</div>
                ${item.stock !== null ? `<div class="item-stock">재고: ${item.stock}</div>` : ''}
                ${item.expiryDays ? `<div class="item-expiry">유통기한: ${item.expiryDays}일 이내 소모</div>` : ''}
                ${item.seasons && item.seasons.length > 0 ? 
                    `<div class="item-seasons">제철: ${item.seasons.join(', ')}</div>` : ''}
                <div class="item-description">${item.description}</div>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editItem(${item.id})">수정</button>
                    <button class="btn-delete" onclick="deleteItem(${item.id})">삭제</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 페이지네이션 렌더링
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // 이전 페이지 버튼
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            이전
        </button>
    `;
    
    // 페이지 번호들
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    // 다음 페이지 버튼
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            다음
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// 페이지 변경
function changePage(page) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    
    let filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        loadItemList();
    }
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 폼 섹션 상단에 추가
    const formSection = document.querySelector('.item-form-section');
    formSection.insertBefore(messageDiv, formSection.firstChild);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// 전역 함수들 (HTML에서 호출)
window.editItem = editItem;
window.deleteItem = deleteItem;
window.changePage = changePage;
window.removeImage = removeImage;
window.removePriceOption = removePriceOption;
