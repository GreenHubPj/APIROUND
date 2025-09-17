// 상품관리 페이지 JS (product_listing 최소 컬럼 + 옵션만 입력)

document.addEventListener('DOMContentLoaded', function () {
  initializeItemManagement();
});

function initializeItemManagement() {
  setupAddProductButton();
  setupFormHandlers();
  setupPriceOptions();
  wireSearchAndFilters();
  ensureSellerIdHidden(); // 로그인 판매자 hidden 값 보정
  setupImageUpload(); // 이미지 업로드 설정
  console.log('상품관리 페이지 초기화 (product_listing 전송)');
  
  // 기본 이미지 URL 설정
  document.getElementById('thumbnailUrl').value = '/images/농산물.png';
}

/* ------------------------------
 * 로그인 판매자 hidden 값 보정
 * ------------------------------ */
function ensureSellerIdHidden() {
  const sellerInput = document.getElementById('sellerId');
  if (sellerInput && sellerInput.value) return;

  // 메타 태그 백업
  const meta = document.querySelector('meta[name="login-company-id"]');
  const v = meta?.getAttribute('content');
  if (sellerInput && v) sellerInput.value = v;
}

/* ------------------------------
 * CSRF
 * ------------------------------ */
function getCsrfToken() {
  const input = document.querySelector('input[name="_csrf"]');
  if (input && input.value) return input.value;
  const meta = document.querySelector('meta[name="_csrf"]');
  return meta ? meta.getAttribute('content') : null;
}

/* ------------------------------
 * 폼/제출 (product_listing)
 * ------------------------------ */
function setupFormHandlers() {
  const form = document.getElementById('itemForm');
  const resetBtn = document.getElementById('resetBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  // form.addEventListener('submit', handleFormSubmit);
  form.addEventListener('submit', handleFormSubmitSimple);
  resetBtn.addEventListener('click', resetForm);
  cancelBtn.addEventListener('click', cancelEdit);
  
  // 이미지 업로드 핸들러
  setupImageUpload();
}

function handleFormSubmitSimple(e) {
  console.log('간단한 폼 제출 시작');
  
  // 최소한의 검증만 수행
  const productName = document.getElementById('productName')?.value?.trim();
  const productType = document.getElementById('productType')?.value;
  const regionText = document.getElementById('regionText')?.value?.trim();
  const description = document.getElementById('description')?.value?.trim();

  console.log('폼 필드 값 확인:', {
    productName: productName,
    productType: productType,
    regionText: regionText,
    description: description
  });

  if (!productName || !productType || !regionText || !description) {
    e.preventDefault();
    alert('필수 필드를 모두 입력해주세요.');
    return false;
  }

  // 가격 옵션 검증
  const priceRows = document.querySelectorAll('.price-option-item');
  if (priceRows.length === 0) {
    e.preventDefault();
    alert('가격 옵션을 최소 1개 추가해주세요.');
    return false;
  }

  console.log('폼 제출 진행:', {
    productName,
    productType,
    regionText,
    description,
    priceOptions: priceRows.length
  });

  return true;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('itemForm');

  console.log('폼 제출 시작');
  console.log('폼 요소:', form);
  
  if (!validateListingForm()) {
    console.log('폼 검증 실패');
    return;
  }
  console.log('폼 검증 성공');

  // ✅ price_value = 옵션 최저가로 자동 반영
  const minPrice = getMinOptionPrice();
  const pv = document.getElementById('priceValue');
  if (pv) pv.value = (minPrice != null) ? String(minPrice) : '';

  // ✅ 대표 옵션 인덱스(첫 옵션) 고정 — 필요 시 라디오로 바꿔도 됨
  const primaryIdx = document.getElementById('primaryOptionIndex');
  if (primaryIdx && (primaryIdx.value === '' || primaryIdx.value == null)) {
    primaryIdx.value = '0';
  }

  const action = form.getAttribute('action') || '/item-management';
  console.log('제출 URL:', action);
  
  try {
    const fd = new FormData(form);
    console.log('FormData 생성됨');
    
    // FormData 내용 확인
    for (let [key, value] of fd.entries()) {
      console.log(key, ':', value);
    }
    
    const res = await fetch(action, { method: 'POST', body: fd });
    console.log('서버 응답 상태:', res.status);
    
    if (!res.ok) {
      const txt = await res.text().catch(()=>'');
      console.error('서버 오류:', txt);
      throw new Error(txt || '서버 오류');
    }
    showMessage('상품이 저장되었습니다.', 'success');
    setTimeout(() => window.location.reload(), 600);
  } catch (err) {
    console.error('폼 제출 오류:', err);
    showMessage('저장에 실패했습니다. 입력값을 확인해 주세요.', 'error');
  }
}

function validateListingForm() {
  const sellerId = document.getElementById('sellerId')?.value;
  const productName = document.getElementById('productName')?.value.trim();
  const productType = document.getElementById('productType')?.value;
  const regionText = document.getElementById('regionText')?.value.trim();
  const description = document.getElementById('description')?.value.trim();

  if (!sellerId) return showMessage('로그인 정보가 없습니다. 다시 로그인해 주세요.', 'error'), false;
  if (!productName) return showMessage('상품명을 입력하세요.', 'error'), false;
  if (!productType) return showMessage('상품 타입을 선택하세요.', 'error'), false;
  if (!regionText) return showMessage('지역을 입력하세요.', 'error'), false;
  if (!description) return showMessage('상품 설명을 입력하세요.', 'error'), false;

  // 가격옵션 최소 1개 + 유효성
  const rows = document.querySelectorAll('.price-option-item');
  if (rows.length === 0) return showMessage('가격 옵션을 최소 1개 추가하세요.', 'error'), false;

  for (const row of rows) {
    const q = row.querySelector('input[name="quantity"]')?.value;
    const u = row.querySelector('select[name="unit"]')?.value;
    const p = row.querySelector('input[name="price"]')?.value;
    if (!q || !u || p === '' || p == null) {
      return showMessage('가격 옵션의 수량/단위/가격을 모두 입력하세요.', 'error'), false;
    }
    if (Number(q) <= 0) return showMessage('수량은 0보다 커야 합니다.', 'error'), false;
    if (Number(p) < 0)  return showMessage('가격은 0 이상이어야 합니다.', 'error'), false;
  }
  return true;
}

function getMinOptionPrice() {
  const prices = Array.from(document.querySelectorAll('.price-option-item input[name="price"]'))
    .map(i => Number(i.value))
    .filter(v => !Number.isNaN(v));
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

/* ------------------------------
 * 가격 옵션
 * ------------------------------ */
function setupPriceOptions() {
  document.getElementById('addPriceOption').addEventListener('click', addPriceOption);

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

  // 가격옵션 1개만 남기고 초기화
  const container = document.getElementById('priceOptionsContainer');
  container.innerHTML = '';
  addPriceOption();

  // hidden값 초기화
  const pv = document.getElementById('priceValue');
  if (pv) pv.value = '';
  const po = document.getElementById('primaryOptionIndex');
  if (po) po.value = '0';

  // 이미지 초기화
  resetImageUpload();

  document.getElementById('formTitle').textContent = '새 상품 등록';
  document.getElementById('cancelBtn').style.display = 'none';

  // 로그인 판매자 보정(혹시 비어있으면 메타에서 채움)
  ensureSellerIdHidden();
}

function cancelEdit() {
  const itemFormSection = document.getElementById('itemFormSection');
  const addProductBtn = document.getElementById('addProductBtn');
  itemFormSection.style.display = 'none';
  addProductBtn.style.display = 'block';
  resetForm();
}

/* ------------------------------
 * (기존) 검색/필터 (프론트 단순 필터링)
 * ------------------------------ */
function wireSearchAndFilters() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const filter = document.getElementById('filterStatus');
  if (!input || !btn || !filter) return;

  const run = () => {
    const q = (input.value || '').trim().toLowerCase();
    const status = filter.value || '';
    const rows = document.querySelectorAll('#itemTableBody tr');
    rows.forEach(tr => {
      const title = (tr.querySelector('.title-col')?.textContent || '').toLowerCase();
      const rowStatus = (tr.querySelector('.status-col')?.textContent || '').trim();
      const matchQ = !q || title.includes(q);
      const matchS = !status || rowStatus === status;
      tr.style.display = (matchQ && matchS) ? '' : 'none';
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
 * 수정/삭제 기능
 * ------------------------------ */
function editListing(listingId) {
  showMessage('수정 기능은 준비 중입니다.', 'info');
  // TODO: 수정 폼 구현
}

async function deleteListing(listingId) {
  if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
  
  try {
    const response = await fetch(`/api/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': getCsrfToken()
      }
    });
    
    if (response.ok) {
      showMessage('상품이 삭제되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      throw new Error('삭제 실패');
    }
  } catch (error) {
    console.error('삭제 오류:', error);
    showMessage('삭제에 실패했습니다.', 'error');
  }
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

/* ------------------------------
 * 이미지 업로드
 * ------------------------------ */
function setupImageUpload() {
  const selectBtn = document.getElementById('selectImageBtn');
  const fileInput = document.getElementById('imageUpload');
  const removeAllBtn = document.getElementById('removeAllImagesBtn');
  const previewContainer = document.getElementById('imagePreviewContainer');

  if (!selectBtn || !fileInput || !removeAllBtn || !previewContainer) return;

  selectBtn.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', handleImageSelection);
  removeAllBtn.addEventListener('click', resetImageUpload);
}

function handleImageSelection(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // 파일 유효성 검사
  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      showMessage(`${file.name}은 이미지 파일이 아닙니다.`, 'error');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      showMessage(`${file.name}은 파일 크기가 너무 큽니다. (5MB 이하)`, 'error');
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) return;

  displayImages(validFiles);
}

function displayImages(files) {
  const previewContainer = document.getElementById('imagePreviewContainer');
  const removeAllBtn = document.getElementById('removeAllImagesBtn');
  
  // 기존 미리보기 제거
  previewContainer.innerHTML = '';

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'image-item';
      imageItem.innerHTML = `
        <img src="${e.target.result}" alt="상품 이미지">
        <button type="button" class="remove-btn" onclick="removeImage(this)">×</button>
      `;
      previewContainer.appendChild(imageItem);
    };
    reader.readAsDataURL(file);
  });

  // 첫 번째 이미지를 썸네일로 설정 (간단한 URL로)
  if (files.length > 0) {
    const firstFile = files[0];
    // 실제 파일명을 기반으로 URL 생성 (임시)
    const fileName = firstFile.name;
    const timestamp = Date.now();
    const thumbnailUrl = `/images/products/${timestamp}_${fileName}`;
    document.getElementById('thumbnailUrl').value = thumbnailUrl;
    console.log('썸네일 URL 설정:', thumbnailUrl);
  }

  removeAllBtn.style.display = 'block';
}

function removeImage(button) {
  const imageItem = button.closest('.image-item');
  imageItem.remove();
  
  // 모든 이미지가 제거되면 초기 상태로
  const previewContainer = document.getElementById('imagePreviewContainer');
  if (previewContainer.children.length === 0) {
    resetImageUpload();
  } else {
    // 첫 번째 이미지를 썸네일로 설정
    const firstImg = previewContainer.querySelector('.image-item img');
    if (firstImg) {
      document.getElementById('thumbnailUrl').value = firstImg.src;
    }
  }
}

function resetImageUpload() {
  const previewContainer = document.getElementById('imagePreviewContainer');
  const removeAllBtn = document.getElementById('removeAllImagesBtn');
  const fileInput = document.getElementById('imageUpload');
  
  previewContainer.innerHTML = `
    <div class="image-preview" id="imagePreview">
      <div class="image-placeholder">
        <span class="upload-icon">📷</span>
        <div>이미지를 업로드하세요</div>
        <small>JPG, PNG, GIF 파일만 가능합니다</small>
      </div>
    </div>
  `;
  
  removeAllBtn.style.display = 'none';
  fileInput.value = '';
  document.getElementById('thumbnailUrl').value = '/images/농산물.png'; // 기본 이미지 URL
}
