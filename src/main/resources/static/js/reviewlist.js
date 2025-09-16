// reviewlist.js

document.addEventListener('DOMContentLoaded', () => {
  const productId = getProductId();
  if (!productId) {
    alert('상품 ID가 없습니다.');
    return;
  }

  // 첫 로드
  loadSummary(productId);
  loadReviews(productId, 0, 20, 'createdAt,desc');

  // 뒤로가기 버튼
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => history.back());
  }
});

function getProductId() {
  const main = document.querySelector('main.main-content');
  if (main && main.dataset.productId) return main.dataset.productId;
  // fallback
  const url = new URL(location.href);
  // /products/{id}/reviews 로 들어오므로 path에서 2번 index가 id
  const parts = url.pathname.split('/').filter(Boolean); // ["products","{id}","reviews"]
  if (parts.length >= 2) return parts[1];
  return null;
}

// ----- API -----

async function loadSummary(productId) {
  try {
    const res = await fetch(`/api/products/${productId}/reviews/summary`);
    if (!res.ok) throw new Error('요약 조회 실패');
    const data = await res.json();
    renderSummary(data);
  } catch (e) {
    console.error(e);
  }
}

async function loadReviews(productId, page = 0, size = 20, sort = 'createdAt,desc') {
  try {
    const res = await fetch(`/api/products/${productId}/reviews?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`);
    if (!res.ok) throw new Error('리뷰 목록 조회 실패');
    const data = await res.json();
    renderReviews(data);
  } catch (e) {
    console.error(e);
  }
}

// ----- Render -----

function renderSummary(summary) {
  // 평균/총개수
  const avgEl = document.getElementById('averageRating');
  const totalEl = document.getElementById('totalReviewCount');
  const starsEl = document.getElementById('averageStars');

  avgEl.textContent = (summary.averageRating || 0).toFixed(1);
  totalEl.textContent = summary.totalCount || 0;

  // 평균 별
  const rounded = Math.round(summary.averageRating || 0);
  starsEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    span.className = 'star';
    span.textContent = (i < rounded) ? '★' : '☆';
    starsEl.appendChild(span);
  }

  // 분포 바(요약 DTO distribution: index0=1점, index4=5점)
  const bars = document.querySelectorAll('.rating-bar');
  const total = summary.totalCount || 0;
  bars.forEach((bar, idxFromTop) => {
    // 화면은 5점부터 내려오므로 매핑
    const score = 5 - idxFromTop; // 5,4,3,2,1
    const index = score - 1; // 4..0
    const count = summary.distribution?.[index] ?? 0;
    const percent = total > 0 ? (count / total) * 100 : 0;

    const fill = bar.querySelector('.bar-fill');
    const countEl = bar.querySelector('.rating-count');

    fill.style.width = `${percent}%`;
    countEl.textContent = count;
  });
}

function renderReviews(pageData) {
  const listEl = document.getElementById('reviewList');
  listEl.innerHTML = '';

  (pageData.content || []).forEach(r => {
    const item = document.createElement('div');
    item.className = 'review-item';

    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const dateStr = (r.createdAt || '').replace('T', ' ').substring(0, 16);

    item.innerHTML = `
      <div class="review-header">
        <span class="reviewer-name">사용자 #${r.userId}</span>
        <span class="review-date">${dateStr}</span>
      </div>
      <div class="review-rating">
        ${stars.split('').map(s => `<span class="star">${s}</span>`).join('')}
      </div>
      <div class="review-text"></div>
    `;
    item.querySelector('.review-text').textContent = r.content;

    listEl.appendChild(item);
  });

  // TODO: 페이지네이션 UI가 있으면 여기서 pageData.page/pageData.totalPages 사용해 구성
}
