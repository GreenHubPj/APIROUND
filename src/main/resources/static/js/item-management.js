// 상품관리 페이지 JavaScript (서버 연동 버전)

document.addEventListener('DOMContentLoaded', function () {
  initializeItemManagement();
});

function initializeItemManagement() {
  setupAddProductButton();
  setupFormHandlers();
  setupPriceOptions();
  setupImageUpload();
  console.log('상품관리 페이지가 초기화되었습니다.');
}

/* ------------------------------
 * 폼/제출
 * ------------------------------ */
function setupFormHandlers() {
  const form = document.getElementById('itemForm');
  const resetBtn = document.getElementById('resetBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  form.addEventListener('submit', handleFormSubmit);
  resetBtn.addEventListener('click', resetForm);
  cancelBtn.addEventListener('click', cancelEdit);
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('itemForm');

  // 유효성 (간단 체크: 필수값 & 가격옵션 1개 이상)
  if (!basicValidate()) return;

  const action = form.getAttribute('action') || form.getAttribute('data-action') || '/mypage-company/item-management';
  const method = (form.getAttribute('method') || 'post').toUpperCase();

  try {
    const fd = new FormData(form);
    // 파일 업로드가 없으면 x-www-form-urlencoded로 보내도 되지만,
    // 가격옵션 다건 배열을 유지하려고 FormData 그대로 전송
    const res = await fetch(action, {
      method,
      body: fd
      // CSRF 쓰면 헤더 필요 없음(스프링이 FormData 내부 hidden _csrf로 처리)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || '서버 오류');
    }

    // 성공: 페이지 리로드(목록 반영)
    showMessage('상품이 저장되었습니다.', 'success');
    setTimeout(() => window.location.reload(), 600);
  } catch (err) {
    console.error(err);
    showMessage('저장에 실패했습니다. 입력값을 확인해 주세요.', 'error');
  }
}

function basicValidate() {
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('category').value;
  const region = document.getElementById('region').value;
  const desc = document.getElementById('description').value.trim();

  if (!name) return showMessage('상품명을 입력하세요.', 'error'), false;
  if (!category) return showMessage('카테고리를 선택하세요.', 'error'), false;
  if (!region) return showMessage('지역을 선택하세요.', 'error'), false;
  if (!desc) return showMessage('상품 설명을 입력하세요.', 'error'), false;

  // 가격옵션 최소 1개, 모든 필드 채움
  const rows = document.querySelectorAll('.price-option-item');
  if (rows.length === 0) return showMessage('가격 옵션을 최소 1개 추가하세요.', 'error'), false;

  for (const row of rows) {
    const q = row.querySelector('input[name="quantity"]')?.value;
    const u = row.querySelector('select[name="unit"]')?.value;
    const p = row.querySelector('input[name="price"]')?.value;
    if (!q || !u || p === '' || p === null) {
      return showMessage('가격 옵션의 수량/단위/가격을 모두 입력하세요.', 'error'), false;
    }
    if (Number(p) < 0) return showMessage('가격은 0 이상이어야 합니다.', 'error'), false;
  }

  // 제철기간 체크 최소 1
  const monthChecked = document.querySelectorAll('input[name="months"]:checked').length;
  if (monthChecked === 0) return showMessage('제철기간을 최소 1개 이상 선택하세요.', 'error'), false;

  return true;
}

/* ------------------------------
 * 가격 옵션
 * ------------------------------ */
function setupPriceOptions() {
  document.getElementById('addPriceOption').addEventListener('click', addPriceOption);
  // 초기 한 줄은 HTML에 존재(이름이 이미 세팅되어 있어야 함)
}

function addPriceOption() {
  const container = document.getElementById('priceOptionsContainer');
  const wrap = document.createElement('div');
  wrap.className = 'price-option-item';
  wrap.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">수량</label>
        <input type="number" class="form-input price-quantity" name="quantity" placeholder="예: 1" min="1" required>
      </div>
      <div class="form-group">
        <label class="form-label">단위</label>
        <select class="form-select price-unit" name="unit" required>
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
        <input type="number" class="form-input price-amount" name="price" placeholder="예: 16000" min="0" required>
      </div>
      <div class="form-group">
        <label class="form-label">액션</label>
        <button type="button" class="btn-remove-price" onclick="removePriceOption(this)">삭제</button>
      </div>
    </div>
  `;
  container.appendChild(wrap);
}

function removePriceOption(buttonEl) {
  const container = document.getElementById('priceOptionsContainer');
  const item = buttonEl.closest('.price-option-item');
  if (container.children.length <= 1) {
    showMessage('최소 1개의 가격 옵션이 필요합니다.', 'error');
    return;
  }
  item.remove();
}

/* ------------------------------
 * 이미지 프리뷰(선택사항: 서버 업로드는 백엔드 구성 후)
 * ------------------------------ */
let uploadedImages = [];

function setupImageUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const imageUpload = document.getElementById('imageUpload');
  const removeAllImagesBtn = document.getElementById('removeAllImagesBtn');
  const imagePreviewContainer = document.getElementById('imagePreviewContainer');

  uploadBtn.addEventListener('click', () => imageUpload.click());
  imageUpload.addEventListener('change', onFilesSelected);
  removeAllImagesBtn.addEventListener('click', () => {
    uploadedImages = [];
    renderImages();
  });

  imagePreviewContainer.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.style.borderColor = '#ff8c42';
  });
  imagePreviewContainer.addEventListener('dragleave', function (e) {
    e.preventDefault();
    this.style.borderColor = '#e1e8ed';
  });
  imagePreviewContainer.addEventListener('drop', function (e) {
    e.preventDefault();
    this.style.borderColor = '#e1e8ed';
    onFilesSelected({ target: { files: e.dataTransfer.files } });
  });
}

function onFilesSelected(e) {
  const files = Array.from(e.target.files);
  if (uploadedImages.length + files.length > 5) {
    showMessage('이미지는 최대 5장까지 업로드할 수 있습니다.', 'error');
    return;
  }
  files.forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      uploadedImages.push({ id: Date.now() + Math.random(), src: evt.target.result, file });
      renderImages();
    };
    reader.readAsDataURL(file);
  });
}

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
      </div>`;
    removeAllImagesBtn.style.display = 'none';
    return;
  }

  imagePreviewContainer.innerHTML = uploadedImages.map(img => `
    <div class="image-item">
      <img src="${img.src}" alt="상품 이미지">
      <button type="button" class="remove-btn" onclick="removeImage('${img.id}')">×</button>
    </div>
  `).join('');
  removeAllImagesBtn.style.display = 'inline-block';
}

function removeImage(imageId) {
  uploadedImages = uploadedImages.filter(x => String(x.id) !== String(imageId));
  renderImages();
}

/* ------------------------------
 * 폼 열기/닫기/초기화
 * ------------------------------ */
function setupAddProductButton() {
  const addProductBtn = document.getElementById('addProductBtn');
  const itemFormSection = document.getElementById('itemFormSection');
  const cancelBtn = document.getElementById('cancelBtn');

  addProductBtn?.addEventListener('click', function () {
    itemFormSection.style.display = 'block';
    addProductBtn.style.display = 'none';
    document.getElementById('formTitle').textContent = '새 상품 등록';
    resetForm();
  });

  cancelBtn?.addEventListener('click', function () {
    itemFormSection.style.display = 'none';
    addProductBtn.style.display = 'block';
    resetForm();
  });
}

function resetForm() {
  const form = document.getElementById('itemForm');
  form.reset();

  // 가격옵션 1개만 남기고 나머지 제거
  const container = document.getElementById('priceOptionsContainer');
  container.innerHTML = '';
  addPriceOption();

  // 이미지 초기화
  uploadedImages = [];
  renderImages();

  // 버튼/타이틀
  document.getElementById('formTitle').textContent = '새 상품 등록';
  document.getElementById('cancelBtn').style.display = 'none';
}

function cancelEdit() {
  const itemFormSection = document.getElementById('itemFormSection');
  const addProductBtn = document.getElementById('addProductBtn');
  itemFormSection.style.display = 'none';
  addProductBtn.style.display = 'block';
  resetForm();
}

/* ------------------------------
 * 테이블 액션 (수정/삭제) - 서버 연동시 구현
 * ------------------------------ */
function editProduct(productId) {
  // 필요 시 별도 편집 페이지로 이동하거나, 상세 조회 후 폼에 채워 넣는 로직 작성
  // location.href = `/mypage-company/item-management/edit/${productId}`;
  console.log('editProduct', productId);
}

async function deleteProduct(productId) {
  if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
  try {
    const res = await fetch(`/mypage-company/item-management/${productId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('삭제 실패');
    showMessage('삭제되었습니다.', 'success');
    setTimeout(() => window.location.reload(), 400);
  } catch (e) {
    console.error(e);
    showMessage('삭제 중 오류가 발생했습니다.', 'error');
  }
}

/* ------------------------------
 * 메시지
 * ------------------------------ */
function showMessage(message, type) {
  const existing = document.querySelector('.message');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.className = `message ${type}`;
  box.textContent = message;

  const formSection = document.querySelector('.item-form-section');
  formSection.insertBefore(box, formSection.firstChild);

  setTimeout(() => box.remove(), 3000);
}

// 전역 노출(HTML onclick 연동용)
window.removePriceOption = removePriceOption;
window.removeImage = removeImage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
