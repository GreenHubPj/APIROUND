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

  // 이미지 업로드 핸들러는 이미 initializeItemManagement()에서 호출됨
}

function handleFormSubmitSimple(e) {
  console.log('간단한 폼 제출 시작');

  // 최소한의 검증만 수행
  const productName = document.getElementById('productName')?.value?.trim();
  const productType = document.getElementById('category')?.value;
  const regionText = document.getElementById('region')?.value?.trim();
  const description = document.getElementById('description')?.value?.trim();
  
  // 제철기간 체크
  const months = Array.from(document.querySelectorAll('input[name="months"]:checked'))
                      .map(i => i.value);

  console.log('폼 필드 값 확인:', {
    productName: productName,
    productType: productType,
    regionText: regionText,
    description: description,
    months: months
  });

  if (!productName || !productType || !regionText || !description || months.length === 0) {
    e.preventDefault();
    alert('필수 필드를 모두 입력해주세요.');
    return false;
  }

  // 파일 크기 체크 (50MB 제한)
  const imageFileEl = document.getElementById('imageFile');
  const file = imageFileEl?.files?.[0];
  if (file && file.size > 50 * 1024 * 1024) {
    e.preventDefault();
    alert('파일 크기가 50MB를 초과합니다. 더 작은 파일을 선택해주세요.');
    return false;
  }

  // 가격 옵션 검증
  const priceRows = document.querySelectorAll('.price-option-item');
  if (priceRows.length === 0) {
    e.preventDefault();
    alert('가격 옵션을 최소 1개 추가해주세요.');
    return false;
  }

  // 수정 모드인지 확인
  const productId = document.getElementById('productId')?.value;
  if (productId && productId.trim() !== '') {
    // 수정 모드 - AJAX로 API 호출
    e.preventDefault();
    handleEditSubmit(productId, productName, productType, regionText, description);
    return false;
  }

  // harvestSeason 처리
  const harvestSeason = months.sort((a, b) => parseInt(a) - parseInt(b)).join(',');
  
  // hidden 필드로 harvestSeason 추가
  let harvestSeasonInput = document.getElementById('harvestSeason');
  if (!harvestSeasonInput) {
    harvestSeasonInput = document.createElement('input');
    harvestSeasonInput.type = 'hidden';
    harvestSeasonInput.name = 'harvestSeason';
    harvestSeasonInput.id = 'harvestSeason';
    document.getElementById('itemForm').appendChild(harvestSeasonInput);
  }
  harvestSeasonInput.value = harvestSeason;

  console.log('폼 제출 진행:', {
    productName,
    productType,
    regionText,
    description,
    priceOptions: priceRows.length,
    harvestSeason: harvestSeason
  });

  return true;
}

function getSelectedHarvestSeason() {
  const checkedMonths = [];
  const monthCheckboxes = document.querySelectorAll('input[name="months"]:checked');
  
  monthCheckboxes.forEach(checkbox => {
    checkedMonths.push(parseInt(checkbox.value));
  });
  
  if (checkedMonths.length === 0) {
    return null;
  }
  
  // 월을 정렬하고 문자열로 변환
  checkedMonths.sort((a, b) => a - b);
  return checkedMonths.join(',');
}

async function handleEditSubmit(listingId, productName, productType, regionText, description) {
  try {
    const thumbnailUrl = document.getElementById('thumbnailUrl')?.value || '';
    const harvestSeason = getSelectedHarvestSeason();
    console.log('수정 시 제철기간:', harvestSeason);
    const imageFileEl = document.getElementById('imageFile');
    const file = imageFileEl?.files?.[0];
    
    // 파일 크기 체크 (50MB 제한)
    if (file && file.size > 50 * 1024 * 1024) {
      showMessage('파일 크기가 50MB를 초과합니다. 더 작은 파일을 선택해주세요.', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('productName', productName);
    formData.append('productType', productType);
    formData.append('regionText', regionText);
    formData.append('description', description);
    if (thumbnailUrl) {
      formData.append('thumbnailUrl', thumbnailUrl);
    }
    if (file) {
      formData.append('imageFile', file);
    }
    if (harvestSeason) {
      formData.append('harvestSeason', harvestSeason);
    }
    
    // 가격 옵션 데이터 추가
    const priceRows = document.querySelectorAll('.price-option-item');
    priceRows.forEach(row => {
      const optionLabel = row.querySelector('input[name="optionLabel"]')?.value;
      const quantity = row.querySelector('input[name="quantity"]')?.value;
      const unit = row.querySelector('select[name="unit"]')?.value;
      const price = row.querySelector('input[name="price"]')?.value;
      
      if (optionLabel) formData.append('optionLabel', optionLabel);
      if (quantity) formData.append('quantity', quantity);
      if (unit) formData.append('unit', unit);
      if (price) formData.append('price', price);
    });

    const response = await fetch(`/api/listings/${listingId}/edit`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      showMessage('상품이 수정되었습니다.', 'success');
      // 폼 숨기기
      document.getElementById('itemFormSection').style.display = 'none';
      // 서버에서 최신 데이터를 가져와서 테이블 업데이트
      await updateTableWithLatestData(listingId);
    } else {
      showMessage('수정에 실패했습니다: ' + (result.error || '알 수 없는 오류'), 'error');
    }
  } catch (error) {
    console.error('수정 요청 오류:', error);
    showMessage('수정 중 오류가 발생했습니다.', 'error');
  }
}

// 서버에서 최신 데이터를 가져와서 테이블 업데이트
async function updateTableWithLatestData(listingId) {
  try {
    const response = await fetch(`/api/listings/${listingId}`);
    const data = await response.json();
    
    if (data.success && data.product) {
      const tableBody = document.getElementById('itemTableBody');
      const rows = tableBody.querySelectorAll('tr');
      
      for (let row of rows) {
        const editButton = row.querySelector(`button[onclick*="editListing(${listingId})"]`);
        if (editButton) {
          // 상품명 업데이트 (3번째 셀 - name-col)
          const productNameCell = row.querySelector('td:nth-child(3) .product-name span');
          if (productNameCell) {
            productNameCell.textContent = data.product.productName;
          }
          
          // 상품 타입 업데이트 (4번째 셀 - category-col)
          const productTypeCell = row.querySelector('td:nth-child(4) .category-tag');
          if (productTypeCell) {
            productTypeCell.textContent = data.product.productType;
          }
          
          // 지역 업데이트 (5번째 셀 - region-col)
          const regionCell = row.querySelector('td:nth-child(5)');
          if (regionCell) {
            regionCell.textContent = data.product.regionText;
          }
          
          // 제철기간 업데이트 (6번째 셀 - season-col)
          const seasonCell = row.querySelector('td:nth-child(6)');
          if (seasonCell) {
            const harvestSeason = data.harvestSeason;
            console.log('서버에서 가져온 제철기간:', harvestSeason);
            
            if (harvestSeason && harvestSeason.trim() !== '') {
              // 제철기간을 월 이름으로 변환
              const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
              const months = harvestSeason.split(',').map(m => parseInt(m.trim())).filter(m => m >= 1 && m <= 12);
              const seasonText = months.map(m => monthNames[m-1]).join(', ');
              seasonCell.textContent = seasonText || 'N/A';
              console.log('제철기간 업데이트 완료:', seasonText);
            } else {
              seasonCell.textContent = 'N/A';
              console.log('제철기간이 없어서 N/A로 설정');
            }
          }
          
          console.log(`테이블 행 업데이트 완료 - listingId: ${listingId}`);
          break;
        }
      }
    }
  } catch (error) {
    console.error('최신 데이터 가져오기 실패:', error);
  }
}

// 테이블 행 업데이트 함수 (기존 함수 유지)
function updateTableRow(listingId, productName, productType, regionText, description, harvestSeason) {
  // 해당 listingId를 가진 행 찾기
  const tableBody = document.getElementById('itemTableBody');
  const rows = tableBody.querySelectorAll('tr');
  
  for (let row of rows) {
    const editButton = row.querySelector(`button[onclick*="editListing(${listingId})"]`);
    if (editButton) {
      // 상품명 업데이트 (3번째 셀 - name-col)
      const productNameCell = row.querySelector('td:nth-child(3) .product-name span');
      if (productNameCell) {
        productNameCell.textContent = productName;
      }
      
      // 상품 타입 업데이트 (4번째 셀 - category-col)
      const productTypeCell = row.querySelector('td:nth-child(4) .category-tag');
      if (productTypeCell) {
        productTypeCell.textContent = productType;
      }
      
      // 지역 업데이트 (5번째 셀 - region-col)
      const regionCell = row.querySelector('td:nth-child(5)');
      if (regionCell) {
        regionCell.textContent = regionText;
      }
      
      // 제철기간 업데이트 (6번째 셀 - season-col)
      const seasonCell = row.querySelector('td:nth-child(6)');
      console.log('제철기간 업데이트 - seasonCell:', seasonCell, 'harvestSeason:', harvestSeason);
      if (seasonCell) {
        if (harvestSeason && harvestSeason.trim() !== '') {
          // 제철기간을 월 이름으로 변환
          const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
          const months = harvestSeason.split(',').map(m => parseInt(m.trim())).filter(m => m >= 1 && m <= 12);
          const seasonText = months.map(m => monthNames[m-1]).join(', ');
          seasonCell.textContent = seasonText || 'N/A';
          console.log('제철기간 업데이트 완료:', seasonText);
        } else {
          seasonCell.textContent = 'N/A';
          console.log('제철기간이 없어서 N/A로 설정');
        }
      }
      
      console.log(`테이블 행 업데이트 완료 - listingId: ${listingId}`);
      break;
    }
  }
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

  // 수정 모드인지 확인
  const productId = document.getElementById('productId')?.value;
  const isEditMode = productId && productId.trim() !== '';
  
  console.log('폼 제출 디버깅:');
  console.log('- productId 필드 값:', productId);
  console.log('- isEditMode:', isEditMode);
  
  let action, method, body;
  
  if (isEditMode) {
    // 수정 모드: API 엔드포인트 사용
    // productId는 실제로는 listingId입니다 (editListing에서 설정됨)
    action = `/api/listings/${productId}/edit`;
    method = 'POST';
    
    // FormData를 URLSearchParams로 변환 (API는 form-urlencoded를 기대)
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        // 파일은 제외 (API에서 파일 업로드를 지원하지 않음)
        continue;
      }
      params.append(key, value);
    }
    
    body = params;
    console.log('✅ 수정 모드 - API URL:', action);
    console.log('✅ 수정 모드 - listingId:', productId);
  } else {
    // 등록 모드: 기존 폼 제출
    action = form.getAttribute('action') || '/item-management';
    method = 'POST';
    body = new FormData(form);
    console.log('❌ 등록 모드 - 폼 URL:', action);
  }

  try {
    console.log('FormData 생성됨');

    // FormData 내용 확인 (파일 제외)
    if (body instanceof FormData) {
      for (let [key, value] of body.entries()) {
        if (value instanceof File) {
          console.log(key, ':', 'File -', value.name, '(' + value.size + ' bytes)');
        } else {
          console.log(key, ':', value);
        }
      }
    }

    const res = await fetch(action, { method: method, body: body });
    console.log('서버 응답 상태:', res.status);

    if (!res.ok) {
      const txt = await res.text().catch(()=>'');
      console.error('서버 오류:', txt);
      throw new Error(txt || '서버 오류');
    }

    if (isEditMode) {
      // 수정 모드: JSON 응답 처리
      const data = await res.json();
      if (data.success) {
        showMessage('상품이 수정되었습니다.', 'success');
        setTimeout(() => window.location.reload(), 600);
      } else {
        throw new Error(data.error || '수정 실패');
      }
    } else {
      // 등록 모드: 기존 처리
      showMessage('상품이 저장되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  } catch (err) {
    console.error('폼 제출 오류:', err);
    showMessage('저장에 실패했습니다. 입력값을 확인해 주세요.', 'error');
  }
}

function validateListingForm() {
  const sellerId = document.getElementById('sellerId')?.value;
  const productName = document.getElementById('productName')?.value.trim();
  const productType = document.getElementById('category')?.value; // HTML에서 category ID 사용
  const regionText = document.getElementById('region')?.value.trim(); // HTML에서 region ID 사용
  const description = document.getElementById('description')?.value.trim();

  // 제철기간 체크
  const months = Array.from(document.querySelectorAll('input[name="months"]:checked'))
                      .map(i => i.value);
  
  if (!sellerId) return showMessage('로그인 정보가 없습니다. 다시 로그인해 주세요.', 'error'), false;
  if (!productName) return showMessage('상품명을 입력하세요.', 'error'), false;
  if (!productType) return showMessage('상품 타입을 선택하세요.', 'error'), false;
  if (!regionText) return showMessage('지역을 선택하세요.', 'error'), false;
  if (months.length === 0) return showMessage('제철기간을 최소 1개 선택하세요.', 'error'), false;
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
  
  // 수정 모드 초기화
  document.getElementById('productId').value = '';
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
async function editListing(listingId) {
  try {
    // 서버에서 상품 정보를 가져옴
    const response = await fetch(`/api/listings/${listingId}`);
    const data = await response.json();
    
    if (data.product) {
      // 폼에 데이터 채우기
      // productId 필드에 listingId를 저장 (수정 시 API 호출에 사용)
      document.getElementById('productId').value = listingId;
      document.getElementById('productName').value = data.product.productName || '';
      document.getElementById('category').value = data.product.productType || '';
      document.getElementById('region').value = data.product.regionText || '';
      document.getElementById('description').value = data.product.description || '';
      
      if (data.product.thumbnailUrl) {
        document.getElementById('thumbnailUrl').value = data.product.thumbnailUrl;
        
        // 기존 이미지 미리보기 표시
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const imageUploadArea = document.getElementById('imageUploadArea');
        
        if (imagePreview && previewImg && imageUploadArea) {
          previewImg.src = data.product.thumbnailUrl;
          imagePreview.style.display = 'block';
          imageUploadArea.style.display = 'none';
        }
      }
      
      // 제철기간 설정 (ProductListing의 harvestSeason 우선, 없으면 SpecialtyProduct의 harvestSeason 사용)
      const harvestSeason = data.harvestSeason || data.product.harvestSeason;
      if (harvestSeason) {
        const months = harvestSeason.split(',');
        // 기존 체크 해제
        document.querySelectorAll('input[name="months"]').forEach(checkbox => {
          checkbox.checked = false;
        });
        // 해당 월들 체크
        months.forEach(month => {
          const checkbox = document.querySelector(`input[name="months"][value="${month.trim()}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      
      // 가격 옵션 로드
      if (data.options && data.options.length > 0) {
        // 기존 가격 옵션 제거
        const priceContainer = document.querySelector('.price-options-container');
        if (priceContainer) {
          priceContainer.innerHTML = '';
        }
        
        // 새로운 가격 옵션 추가
        data.options.forEach((option, index) => {
          addPriceOption();
          
          // 마지막으로 추가된 옵션에 데이터 설정
          const lastOption = document.querySelector('.price-option-item:last-child');
          if (lastOption) {
            lastOption.querySelector('input[name="optionLabel"]').value = option.optionLabel || '';
            lastOption.querySelector('input[name="quantity"]').value = option.quantity || '';
            lastOption.querySelector('select[name="unit"]').value = option.unit || '';
            lastOption.querySelector('input[name="price"]').value = option.price || '';
          }
        });
      }
      
      // 폼 섹션을 보이게 하고 스크롤
      const formSection = document.getElementById('itemFormSection');
      if (formSection) {
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      // 폼 제목과 버튼 텍스트 변경
      const formTitle = document.getElementById('formTitle');
      const submitBtn = document.getElementById('submitBtn');
      
      if (formTitle) {
        formTitle.textContent = '상품 수정';
      }
      
      if (submitBtn) {
        submitBtn.textContent = '상품 수정';
      }
      
      showMessage('수정할 상품 정보를 불러왔습니다.', 'success');
    } else {
      throw new Error('상품 정보를 찾을 수 없습니다.');
    }
  } catch (error) {
    console.error('수정 데이터 로드 오류:', error);
    showMessage('상품 정보를 불러오는데 실패했습니다: ' + error.message, 'error');
  }
}

async function deleteListing(listingId) {
  if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) return;

  try {
    const response = await fetch(`/api/listings/${listingId}/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRF-TOKEN': getCsrfToken()
      }
    });

    const data = await response.json();
    
    if (data.success) {
      showMessage('상품이 삭제되었습니다.', 'success');
      setTimeout(() => window.location.reload(), 600);
    } else {
      throw new Error(data.error || '삭제 실패');
    }
  } catch (error) {
    console.error('삭제 오류:', error);
    showMessage('삭제에 실패했습니다: ' + error.message, 'error');
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
  const imageFile = document.getElementById('imageFile');
  const imageUploadArea = document.getElementById('imageUploadArea');
  const imagePreview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImg');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const thumbnailUrlInput = document.getElementById('thumbnailUrl');

  if (!imageFile || !imageUploadArea || !imagePreview || !previewImg || !removeImageBtn || !thumbnailUrlInput) {
    console.log('이미지 업로드 요소를 찾을 수 없습니다.');
    return;
  }

  // 클릭으로 파일 선택
  imageUploadArea.addEventListener('click', () => {
    imageFile.click();
  });

  // 드래그 앤 드롭
  imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('drag-over');
  });

  imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.classList.remove('drag-over');
  });

  imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  });

  // 파일 선택 시
  imageFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });

  // 이미지 제거
  removeImageBtn.addEventListener('click', () => {
    resetImageUpload();
  });

  function handleImageFile(file) {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      showMessage('이미지 파일만 업로드 가능합니다.', 'error');
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('파일 크기는 5MB 이하여야 합니다.', 'error');
      return;
    }

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      imageUploadArea.style.display = 'none';
      imagePreview.style.display = 'block';

      // 임시 URL 생성 (실제로는 서버에 업로드 후 URL 받아야 함)
      const tempUrl = e.target.result;
      thumbnailUrlInput.value = tempUrl;
    };
    reader.readAsDataURL(file);
  }

  function resetImageUpload() {
    imageFile.value = '';
    thumbnailUrlInput.value = '';
    imageUploadArea.style.display = 'block';
    imagePreview.style.display = 'none';
    previewImg.src = '';
  }

  // 전역 함수로 등록
  window.resetImageUpload = resetImageUpload;

  console.log('이미지 업로드 설정 완료');
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
  document.getElementById('thumbnailUrl').value = '/images/따봉 트럭.png'; // 기본 이미지 URL
}

/* ------------------------------
 * 상태 변경 기능
 * ------------------------------ */
function setupStatusChangeHandlers() {
  // 상태 변경 이벤트 리스너 등록
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('status-select')) {
      const listingId = e.target.getAttribute('data-listing-id');
      const newStatus = e.target.value;
      
      if (listingId && newStatus) {
        updateListingStatus(listingId, newStatus);
      }
    }
  });
}

function updateListingStatus(listingId, status) {
  const csrfToken = getCsrfToken();
  
  fetch(`/api/listings/${listingId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-CSRF-TOKEN': csrfToken
    },
    body: `status=${status}`
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showMessage('상태가 변경되었습니다.', 'success');
      console.log('상태 변경 성공:', data);
    } else {
      showMessage('상태 변경에 실패했습니다: ' + (data.error || '알 수 없는 오류'), 'error');
      console.error('상태 변경 실패:', data);
    }
  })
  .catch(error => {
    showMessage('상태 변경 중 오류가 발생했습니다.', 'error');
    console.error('상태 변경 오류:', error);
  });
}

// 초기화 함수에 상태 변경 핸들러 추가
function initializeItemManagement() {
  setupAddProductButton();
  setupFormHandlers();
  setupPriceOptions();
  wireSearchAndFilters();
  ensureSellerIdHidden(); // 로그인 판매자 hidden 값 보정
  setupImageUpload(); // 이미지 업로드 설정
  setupStatusChangeHandlers(); // 상태 변경 핸들러 추가
  console.log('상품관리 페이지 초기화 (product_listing 전송)');

  // 기본 이미지 URL 설정
  document.getElementById('thumbnailUrl').value = '/images/따봉 트럭.png';
}