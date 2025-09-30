// 상품관리 페이지 JS (product_listing 최소 컬럼 + 옵션만 입력)

document.addEventListener('DOMContentLoaded', function () {
  initializeItemManagement();
});

/* ------------------------------
 * 로그인 판매자 hidden 값 보정
 * ------------------------------ */
function ensureSellerIdHidden() {
  const sellerInput = document.getElementById('sellerId');
  if (sellerInput && sellerInput.value) return;

  // 메타 태그 fallback
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
 * 메시지
 * ------------------------------ */
function showMessage(msg, type = 'info') {
  alert(msg);
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

  if (!validateListingForm()) return;

  // 옵션 최저가 → priceValue에 반영(서버에선 첫 옵션가로 처리하지만 보정)
  const minPrice = getMinOptionPrice();
  const pv = document.getElementById('priceValue');
  if (pv) pv.value = (minPrice != null) ? String(minPrice) : '';

  const productId = document.getElementById('productId')?.value;
  const isEditMode = productId && productId.trim() !== '';

  // months 체크박스 값들을 harvestSeason 문자열로 변환
  const months = Array.from(document.querySelectorAll('input[name="months"]:checked')).map(i => i.value);
  const harvestSeason = months.join(',');

  let action, method, body;
  if (isEditMode) {
    action = `/api/listings/${productId}/edit`;
    method = 'POST';

    const formData = new FormData(form);
    const params = new URLSearchParams();
    for (let [key, value] of formData.entries()) {
      if (!(value instanceof File)) params.append(key, value);
    }
    // harvestSeason 추가
    params.append('harvestSeason', harvestSeason);
    body = params;
  } else {
    action = form.getAttribute('action') || '/item-management';
    method = 'POST';
    body = new FormData(form);
    // harvestSeason 추가
    body.append('harvestSeason', harvestSeason);
  }

  try {
    const res = await fetch(action, { method, body });
    if (!res.ok) throw new Error(await res.text());

    if (isEditMode) {
      const data = await res.json();
      if (data.success) {
        showMessage('상품이 수정되었습니다.', 'success');
        setTimeout(() => window.location.reload(), 600);
      } else {
        throw new Error(data.error || '수정 실패');
      }
    } else {
      showMessage('상품이 저장되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    console.error('폼 제출 오류:', err);
    showMessage('저장 실패: ' + err.message, 'error');
  }
}

function validateListingForm() {
  // ✅ sellerId는 서버에서 세션으로 보정 가능 → 클라이언트 필수 검사 제거
  // const sellerId = document.getElementById('sellerId')?.value;

  const productName = document.getElementById('productName')?.value.trim();
  const productType = document.getElementById('category')?.value;
  const regionText = document.getElementById('region')?.value.trim();
  const description = document.getElementById('description')?.value.trim();
  const months = Array.from(document.querySelectorAll('input[name="months"]:checked')).map(i => i.value);

  if (!productName) return showMessage('상품명을 입력하세요.', 'error'), false;
  if (!productType) return showMessage('상품 타입을 선택하세요.', 'error'), false;
  if (!regionText) return showMessage('지역을 선택하세요.', 'error'), false;
  if (months.length === 0) return showMessage('제철기간을 선택하세요.', 'error'), false;
  if (!description) return showMessage('상품 설명을 입력하세요.', 'error'), false;

  const rows = document.querySelectorAll('.price-option-item');
  if (rows.length === 0) return showMessage('가격 옵션을 최소 1개 추가하세요.', 'error'), false;
  for (const row of rows) {
    const q = row.querySelector('input[name="quantity"]')?.value;
    const u = row.querySelector('select[name="unit"]')?.value;
    const p = row.querySelector('input[name="price"]')?.value;
    if (!q || !u || p === '') return showMessage('옵션 값이 비었습니다.', 'error'), false;
    if (Number(q) <= 0) return showMessage('수량은 0보다 커야 합니다.', 'error'), false;
    if (Number(p) < 0) return showMessage('가격은 0 이상이어야 합니다.', 'error'), false;
  }
  return true;
}

function getMinOptionPrice() {
  const prices = Array.from(document.querySelectorAll('.price-option-item input[name="price"]'))
    .map(i => Number(i.value))
    .filter(v => !Number.isNaN(v));
  return prices.length ? Math.min(...prices) : null;
}

/* ------------------------------
 * 가격 옵션
 * ------------------------------ */
function setupPriceOptions() {
  const addBtn = document.getElementById('addPriceOption');
  if (addBtn) addBtn.addEventListener('click', addPriceOption);

  const container = document.getElementById('priceOptionsContainer');
  if (container && !container.querySelector('.price-option-item')) addPriceOption();
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
  return list.map(u =>
    `<option value="${u}" ${u === selected ? 'selected' : ''}>${u || '단위 선택'}</option>`
  ).join('');
}

function removePriceOption(btn) {
  const container = document.getElementById('priceOptionsContainer');
  if (container.children.length <= 1) return showMessage('최소 1개 옵션 필요', 'error');
  btn.closest('.price-option-item').remove();
}

/* ------------------------------
 * 이미지 업로드
 * ------------------------------ */
function setupImageUpload() {
  const imageFile = document.getElementById('imageFile');
  const imageUploadArea = document.getElementById('imageUploadArea');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const thumbnailUrlInput = document.getElementById('thumbnailUrl');

  if (!imageFile) return;

  const MAX_MB = 50, MAX_BYTES = MAX_MB * 1024 * 1024;

  function clearImageSelection() {
    imageFile.value = '';
    previewImg.src = '';
    imagePreview.style.display = 'none';
    imageUploadArea.style.display = '';
    thumbnailUrlInput.value = '';
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) return showMessage('이미지 파일만', 'error'), clearImageSelection();
    if (file.size > MAX_BYTES)   return showMessage(`파일은 ${MAX_MB}MB 이하`, 'error'), clearImageSelection();
    thumbnailUrlInput.value = '';
    previewImg.src = URL.createObjectURL(file);
    imageUploadArea.style.display = 'none';
    imagePreview.style.display = 'block';
  }

  imageUploadArea.addEventListener('click', () => imageFile.click());
  imageFile.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
  removeImageBtn.addEventListener('click', clearImageSelection);

  const formEl = document.getElementById('itemForm');
  formEl?.addEventListener('submit', (e) => {
    const f = imageFile.files?.[0];
    if (f && f.size > MAX_BYTES) { e.preventDefault(); showMessage('이미지 용량 초과', 'error'); }
  });
}

/* ------------------------------
 * 검색/필터
 * ------------------------------ */
function wireSearchAndFilters() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');
  const filter = document.getElementById('filterCategory');
  if (!input || !btn || !filter) return;

  const run = () => {
    const q = input.value.trim().toLowerCase();
    const category = filter.value || '';
    document.querySelectorAll('#itemTableBody tr').forEach(tr => {
      const title = (tr.querySelector('.name-col span')?.textContent || '').toLowerCase();
      const rowCategory = (tr.querySelector('.category-col .category-tag')?.textContent || '').trim();
      const matchQ = !q || title.includes(q);
      const matchC = !category || rowCategory === category;
      tr.style.display = (matchQ && matchC) ? '' : 'none';
    });
  };

  btn.addEventListener('click', run);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  filter.addEventListener('change', run);
}

/* ------------------------------
 * 폼 열기/닫기
 * ------------------------------ */
function setupAddProductButton() {
  const addProductBtn = document.getElementById('addProductBtn');
  const itemFormSection = document.getElementById('itemFormSection');
  const cancelBtn = document.getElementById('cancelBtn');

  addProductBtn?.addEventListener('click', () => {
    itemFormSection.style.display = 'block';
    addProductBtn.style.display = 'none';
    resetForm();
    setupPriceOptions();
  });

  cancelBtn?.addEventListener('click', () => {
    itemFormSection.style.display = 'none';
    addProductBtn.style.display = 'block';
    resetForm();
  });
}

function resetForm() {
  const form = document.getElementById('itemForm');
  form.reset();
  const container = document.getElementById('priceOptionsContainer');
  container.innerHTML = '';
  addPriceOption();
  // 필요시 폼 내부에 priceValue/primaryOptionIndex가 있다면 초기화
  const pv = document.getElementById('priceValue'); if (pv) pv.value = '';
  const pi = document.getElementById('primaryOptionIndex'); if (pi) pi.value = '0';
  ensureSellerIdHidden();
}

function cancelEdit() {
  const itemFormSection = document.getElementById('itemFormSection');
  const addProductBtn = document.getElementById('addProductBtn');
  itemFormSection.style.display = 'none';
  addProductBtn.style.display = 'block';
  document.getElementById('productId').value = '';
  resetForm();
}

/* ------------------------------
 * 상품 수정
 * ------------------------------ */
async function editListing(listingId) {
  try {
    const response = await fetch(`/api/listings/${listingId}`);
    if (!response.ok) throw new Error('상품 정보를 가져올 수 없습니다.');

    const data = await response.json();
    if (!data.success) throw new Error(data.error || '상품 정보 조회 실패');

    const itemFormSection = document.getElementById('itemFormSection');
    const addProductBtn = document.getElementById('addProductBtn');
    itemFormSection.style.display = 'block';
    addProductBtn.style.display = 'none';

    fillEditForm(data);
    setupPriceOptions();
  } catch (error) {
    console.error('상품 수정 모드 설정 실패:', error);
    showMessage('상품 정보를 불러올 수 없습니다: ' + error.message, 'error');
  }
}

function fillEditForm(data) {
  const product = data.product;
  const options = data.options || [];

  document.getElementById('productName').value = product.productName || '';
  document.getElementById('category').value = product.productType || '';
  document.getElementById('region').value = product.regionText || '';
  document.getElementById('description').value = product.description || '';
  document.getElementById('productId').value = data.listing.listingId || '';

  const harvestSeason = product.harvestSeason || '';
  if (harvestSeason) {
    const months = harvestSeason.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m));
    document.querySelectorAll('input[name="months"]').forEach(cb => {
      cb.checked = months.includes(parseInt(cb.value));
    });
  }

  const container = document.getElementById('priceOptionsContainer');
  container.innerHTML = '';
  if (options.length > 0) {
    options.forEach(option => {
      addPriceOption({
        optionLabel: option.optionLabel || '',
        quantity: option.quantity || '',
        unit: option.unit || '',
        price: option.price || ''
      });
    });
  } else {
    addPriceOption();
  }
}

/* ------------------------------
 * 상품 삭제
 * ------------------------------ */
async function deleteListing(listingId) {
  if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return;

  try {
    const response = await fetch(`/api/listings/${listingId}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!response.ok) throw new Error('삭제 요청 실패');

    const data = await response.json();
    if (data.success) {
      showMessage('상품이 삭제되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      throw new Error(data.error || '삭제 실패');
    }
  } catch (error) {
    console.error('상품 삭제 실패:', error);
    showMessage('상품 삭제 실패: ' + error.message, 'error');
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
 * 초기화
 * ------------------------------ */
function initializeItemManagement() {
  setupAddProductButton();
  setupFormHandlers();
  setupPriceOptions();
  wireSearchAndFilters();
  ensureSellerIdHidden();
  setupImageUpload();
  setupStatusChangeHandlers();
  console.log('상품관리 페이지 초기화 완료');
}
/* ------------------------------
 * 상태 변경 (ACTIVE / PAUSED)
 * ------------------------------ */
function setupStatusChangeHandlers() {
  document.addEventListener('change', function (e) {
    const sel = e.target;
    if (!sel.classList.contains('status-select')) return;

    const listingId = sel.getAttribute('data-listing-id');
    const newVal = sel.value; // "ACTIVE" or "PAUSED"
    if (!listingId || !newVal) return;

    updateListingStatus(listingId, newVal, sel);
  });
}

function updateListingStatus(listingId, status, selectEl) {
  const csrf = getCsrfToken();
  fetch(`/api/listings/${listingId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {})
    },
    body: `status=${encodeURIComponent(status)}`
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showMessage('상태가 변경되었습니다.', 'success');
      } else {
        showMessage('상태 변경 실패: ' + (data.error || '알 수 없는 오류'), 'error');
        // 실패 시 기존 값으로 롤백
        if (data.currentStatus && selectEl) {
          selectEl.value = data.currentStatus;
        }
      }
    })
    .catch(err => {
      console.error(err);
      showMessage('상태 변경 중 오류가 발생했습니다.', 'error');
    });
}

