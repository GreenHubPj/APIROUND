// /static/js/item-management.js
// 상품관리 페이지 JavaScript (서버 연동 버전)

document.addEventListener('DOMContentLoaded', function () {
  initializeItemManagement();
});

function initializeItemManagement() {
  setupAddProductButton();
  setupFormHandlers();
  setupPriceOptions();
  setupImageUpload();
  wireSearchAndFilters();
  console.log('상품관리 페이지가 초기화되었습니다.');
}

/* ------------------------------
 * 공통: CSRF
 * ------------------------------ */
function getCsrfToken() {
  // 1) 폼 hidden _csrf (권장)
  const input = document.querySelector('input[name="_csrf"]');
  if (input && input.value) return input.value;
  // 2) meta 태그 백업
  const meta = document.querySelector('meta[name="_csrf"]');
  return meta ? meta.getAttribute('content') : null;
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

  const action = form.getAttribute('action') || form.getAttribute('data-action') || '/item-management';
  const method = (form.getAttribute('method') || 'post').toUpperCase();

  try {
    const fd = new FormData(form);
    // 옵션 라벨이 비어있으면 빈 문자열 그대로 전송 (선택 필드)

    const res = await fetch(action, {
      method,
      body: fd
      // CSRF: FormData 안의 hidden _csrf 로 처리됨 (Spring Security 기본)
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

  // 가격옵션 최소 1개, 모든 필드 채움(가격/수량/단위)
  const rows = document.querySelectorAll('.price-option-item');
  if (rows.length === 0) return showMessage('가격 옵션을 최소 1개 추가하세요.', 'error'), false;

  for (const row of rows) {
    const q = row.querySelector('input[name="quantity"]')?.value;
    const u = row.querySelector('select[name="unit"]')?.value;
    const p = row.querySelector('input[name="price"]')?.value;
    if (!q || !u || p === '' || p === null) {
      return showMessage('가격 옵션의 수량/단위/가격을 모두 입력하세요.', 'error'), false;
    }
    if (Number(q) <= 0) return showMessage('수량은 0보다 커야 합니다.', 'error'), false;
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

  // 초기 한 줄이 없다면 생성
  const container = document.getElementById('priceOptionsContainer');
  if (!container.querySelector('.price-option-item')) addPriceOption();
}

function addPriceOption(opt = {}) {
  const container = document.getElementById('priceOptionsContainer');
  const wrap = document.createElement('div');
  wrap.className = 'price-option-item';
  wrap.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">옵션 라벨</label>
        <input type="text" class="form-input" name="optionLabel"
               value="${escapeHtml(opt.optionLabel ?? '')}"
               placeholder="예: 기본 / 소 / 대 (선택)">
      </div>
      <div class="form-group">
        <label class="form-label">수량</label>
        <input type="number" step="0.01" min="0.01"
               class="form-input price-quantity" name="quantity"
               value="${opt.quantity ?? ''}" placeholder="예: 1.00" required>
      </div>
      <div class="form-group">
        <label class="form-label">단위</label>
        <select class="form-select price-unit" name="unit" required>
          ${unitOptionsHtml(opt.unit)}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">가격 (원)</label>
        <input type="number" step="1" min="0"
               class="form-input price-amount" name="price"
               value="${opt.price ?? ''}" placeholder="예: 16000" required>
      </div>
      <div class="form-group">
        <label class="form-label">액션</label>
        <button type="button" class="btn-remove-price" onclick="removePriceOption(this)">삭제</button>
      </div>
    </div>
  `;
  container.appendChild(wrap);
}

function unitOptionsHtml(selected) {
  const list = ['', 'kg','g','개','박스','봉','포기','단','팩','병','캔','마리','포','근','되','말','상자','통','봉지','세트','묶음'];
  return list.map(u => `<option value="${u}" ${u===selected?'selected':''}>${u||'단위 선택'}</option>`).join('');
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

  if (!uploadBtn || !imageUpload || !removeAllImagesBtn || !imagePreviewContainer) return;

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
  const files = Array.from(e.target.files || []);
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
  if (!imagePreviewContainer) return;

  if (uploadedImages.length === 0) {
    imagePreviewContainer.innerHTML = `
      <div class="image-preview" id="imagePreview">
        <div class="image-placeholder">
          <span class="upload-icon">📷</span>
          <p>이미지를 업로드하세요</p>
          <small>드래그 앤 드롭 또는 클릭하여 선택</small>
        </div>
      </div>`;
    if (removeAllImagesBtn) removeAllImagesBtn.style.display = 'none';
    return;
  }

  imagePreviewContainer.innerHTML = uploadedImages.map(img => `
    <div class="image-item">
      <img src="${img.src}" alt="상품 이미지">
      <button type="button" class="remove-btn" onclick="removeImage('${img.id}')">×</button>
    </div>
  `).join('');
  if (removeAllImagesBtn) removeAllImagesBtn.style.display = 'inline-block';
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

  // hidden productId 초기화
  const hiddenId = document.getElementById('productId');
  if (hiddenId) hiddenId.value = '';
}

function cancelEdit() {
  const itemFormSection = document.getElementById('itemFormSection');
  const addProductBtn = document.getElementById('addProductBtn');
  itemFormSection.style.display = 'none';
  addProductBtn.style.display = 'block';
  resetForm();
}

/* ------------------------------
 * 테이블 액션 (수정/삭제) - 서버 연동
 * ------------------------------ */
async function editProduct(productId) {
  try {
    const res = await fetch(`/api/products/${productId}`);
    if (!res.ok) throw new Error('상품 정보 로드 실패');
    const data = await res.json();
    fillFormWithProduct(data);
  } catch (e) {
    console.error(e);
    showMessage('상품 정보를 불러오지 못했습니다.', 'error');
  }
}

function fillFormWithProduct(data) {
  const p = data.product;
  const opts = data.options || [];

  // 폼 열기
  const itemFormSection = document.getElementById('itemFormSection');
  const addProductBtn = document.getElementById('addProductBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  itemFormSection.style.display = 'block';
  addProductBtn.style.display = 'none';
  cancelBtn.style.display = 'inline-flex';
  document.getElementById('formTitle').textContent = '상품 수정';

  // 기본 필드 주입
  document.getElementById('productId').value = p.productId ?? '';
  document.getElementById('productName').value = p.productName ?? '';
  document.getElementById('category').value = p.productType ?? '';
  document.getElementById('region').value = p.regionText ?? '';
  document.getElementById('description').value = p.description ?? '';
  document.querySelector('input[name="thumbnailUrl"]').value = p.thumbnailUrl ?? '';
  document.querySelector('input[name="externalRef"]').value = p.externalRef ?? '';

  // 제철기간 체크
  document.querySelectorAll('input[name="months"]').forEach(chk => chk.checked = false);
  (p.harvestSeason || '').split(',').forEach(m => {
    const el = document.querySelector(`input[name="months"][value="${m.trim()}"]`);
    if (el) el.checked = true;
  });

  // 옵션 다시 그림
  const container = document.getElementById('priceOptionsContainer');
  container.innerHTML = '';
  if (opts.length === 0) {
    addPriceOption();
  } else {
    opts.forEach(o => addPriceOption({
      optionLabel: o.optionLabel,
      quantity: o.quantity, // BigDecimal도 문자열로 들어오므로 그대로 출력 가능
      unit: o.unit,
      price: o.price
    }));
  }
}

async function deleteProduct(productId) {
  if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
  try {
    const csrf = getCsrfToken();
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: csrf ? { 'X-CSRF-TOKEN': csrf } : {}
    });
    if (!res.ok) throw new Error('삭제 실패');
    const json = await res.json().catch(() => ({}));
    if (json && json.ok) {
      showMessage('삭제되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 400);
    } else {
      throw new Error('삭제 실패');
    }
  } catch (e) {
    console.error(e);
    showMessage('삭제 중 오류가 발생했습니다.', 'error');
  }
}

/* ------------------------------
 * 검색/필터 (프론트 단순 필터링, 선택)
 * ------------------------------ */
function wireSearchAndFilters() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const filter = document.getElementById('filterCategory');
  if (!input || !btn || !filter) return;

  const run = () => {
    const q = (input.value || '').trim().toLowerCase();
    const cat = filter.value || '';
    const rows = document.querySelectorAll('#itemTableBody tr');
    rows.forEach(tr => {
      const name = (tr.querySelector('.name-col span')?.textContent || '').toLowerCase();
      const category = (tr.querySelector('.category-col .category-tag')?.textContent || '').trim();
      const matchQ = !q || name.includes(q);
      const matchC = !cat || category === cat;
      tr.style.display = (matchQ && matchC) ? '' : 'none';
    });
  };

  btn.addEventListener('click', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
  filter.addEventListener('change', run);
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

  const formSection = document.querySelector('.item-form-section') || document.body;
  formSection.insertBefore(box, formSection.firstChild);

  setTimeout(() => box.remove(), 3000);
}

/* ------------------------------
 * 유틸
 * ------------------------------ */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// 전역 노출(HTML onclick 연동용)
window.removePriceOption = removePriceOption;
window.removeImage = removeImage;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
