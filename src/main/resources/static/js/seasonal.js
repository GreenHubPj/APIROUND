document.addEventListener('DOMContentLoaded', function () {
  console.log('GreenHub 이달의 특산품 페이지 로드');

  // 월/계절 표시용
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const seasonInfo = [
    '❄️ 겨울의 계절','🌸 봄의 시작','🌱 봄의 계절','🌿 봄의 완성',
    '🌺 여름의 시작','☀️ 여름의 계절','🌻 여름의 절정','🍃 여름의 끝',
    '🍂 가을 수확의 계절','🍁 가을의 계절','🌰 가을의 완성','❄️ 겨울의 계절'
  ];

  const currentMonth = new Date().getMonth() + 1;
  updateMonthlyInfo(currentMonth);

  // DOM
  const grid = document.getElementById('productsGrid');
  const paginationContainer = document.getElementById('paginationContainer');

  // 서버에서 렌더된 카드들 선택
  const productCards = Array.from(document.querySelectorAll('.products-grid .product-card'));
  const totalItems = productCards.length;
  const itemsPerPage = 12;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  let currentPage = 1;

  // 카드 0개 처리
  if (totalItems === 0) {
    if (paginationContainer) paginationContainer.style.display = 'none';
    if (grid) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '이달의 특산품이 아직 없습니다.';
      grid.appendChild(empty);
    }
    return;
  }

  // 카드 클릭/호버
  productCards.forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.getAttribute('data-product-id');
      if (productId) {
        goToProductDetail(productId);
      }
    });
    card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-5px)'; });
    card.addEventListener('mouseleave', () => { card.style.transform = 'translateY(0)'; });
  });

  // 초기 렌더
  createPaginationUI();
  showPage(1);

  // ---------- functions ----------
  function createPaginationUI() {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    paginationContainer.style.display = '';
    paginationContainer.innerHTML = `
      <div class="pagination-info">
        <span id="pageInfo"></span>
      </div>
      <div class="pagination">
        <button class="page-btn prev-btn" id="prevBtn" disabled><span>← 이전</span></button>
        <div class="page-numbers" id="pageNumbers">${generatePageNumbers()}</div>
        <button class="page-btn next-btn" id="nextBtn" ${totalPages === 1 ? 'disabled' : ''}><span>다음 →</span></button>
      </div>
    `;
    addPaginationEventListeners();
    updatePaginationUI();
  }

  function generatePageNumbers() {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    let html = '';
    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    return html;
  }

  function addPaginationEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn?.addEventListener('click', () => { if (currentPage > 1) showPage(currentPage - 1); });
    nextBtn?.addEventListener('click', () => { if (currentPage < totalPages) showPage(currentPage + 1); });

    const pageNumbersWrap = document.getElementById('pageNumbers');
    pageNumbersWrap?.addEventListener('click', (e) => {
      const btn = e.target.closest('.page-number');
      if (!btn) return;
      const page = parseInt(btn.getAttribute('data-page'), 10);
      if (!Number.isNaN(page)) showPage(page);
    });
  }

  function showPage(page) {
    currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    // 표시/숨김
    productCards.forEach((card, idx) => {
      card.style.display = (idx >= startIndex && idx < endIndex) ? 'block' : 'none';
      if (idx >= startIndex && idx < endIndex) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
      }
    });

    // 애니메이션
    requestAnimationFrame(() => {
      productCards.slice(startIndex, endIndex).forEach((card, i) => {
        card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, i * 80);
      });
    });

    // 페이지 번호 영역 재생성(가시 범위 갱신)
    const pageNumbersWrap = document.getElementById('pageNumbers');
    if (pageNumbersWrap) pageNumbersWrap.innerHTML = generatePageNumbers();

    updatePaginationUI();
  }

  function updatePaginationUI() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    document.querySelectorAll('.page-number').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.page, 10) === currentPage);
    });

    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);

    if (pageInfo) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      pageInfo.textContent = `${currentPage}페이지 (${startItem}-${endItem} / 총 ${totalItems}개)`;
    }
  }

  function updateMonthlyInfo(month) {
    const seasonText = document.querySelector('.season-text');
    const pageSubtitle = document.querySelector('.page-subtitle');
    const monthBadge = document.querySelector('.month-badge');

    if (monthBadge) monthBadge.textContent = monthNames[month - 1];
    if (seasonText) seasonText.textContent = seasonInfo[month - 1];

    if (pageSubtitle) {
      const seasonNames = ['겨울철','봄철','봄철','봄철','여름철','여름철','여름철','여름철','가을철','가을철','가을철','겨울철'];
      pageSubtitle.textContent = `${month}월, ${seasonNames[month - 1]} 최고의 신선함을 만나보세요`;
    }
  }

  // 상품 상세 페이지로 이동하는 함수
  function goToProductDetail(productId) {
    console.log('상품 상세 페이지로 이동:', productId);
    window.location.href = `/region-detail?id=${productId}`;
  }
});
