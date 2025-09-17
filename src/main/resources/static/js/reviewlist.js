document.addEventListener('DOMContentLoaded', () => {
  const productId = resolveProductId();
  if (!productId) {
    console.warn('productId를 찾을 수 없습니다.');
    return;
  }

  // 통계/목록 로드
  loadSummary(productId);
  loadReviews(productId, 0, 20, 'createdAt,desc');

  // 뒤로가기
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => history.back());
});

// 안전하게 productId 해석
function resolveProductId() {
  // 1) main data-attr
  const main = document.querySelector('main.main-content');
  const dataId = main?.dataset?.productId;
  if (dataId && dataId !== '0') return dataId;

  // 2) 전역 변수
  if (window.__REVIEWLIST__?.productId) return String(window.__REVIEWLIST__.productId);

  // 3) URL path: /products/{id}/reviews
  const m = location.pathname.match(/\/products\/(\d+)\/reviews/);
  if (m) return m[1];

  // 4) querystring
  const q = new URLSearchParams(location.search).get('productId');
  if (q) return q;

  return null;
}

// ===== API =====
async function loadSummary(productId) {
  try {
    const res = await fetch(`/api/products/${productId}/reviews/summary`);
    if (!res.ok) throw new Error('요약 조회 실패');
    const data = await res.json();
    renderSummary(data);
  } catch (e) {
    console.error(e);
    renderSummary({ averageRating: 0, totalCount: 0, distribution: [0,0,0,0,0] });
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
    renderReviews({ content: [], page:0, size, totalElements:0, totalPages:0 });
  }
}

// ===== Render =====
function renderSummary(summary) {
  const avgEl = document.getElementById('averageRating');
  const totalEl = document.getElementById('totalReviewCount');
  const starsEl = document.getElementById('averageStars');

  const avg = Number(summary.averageRating || 0);
  avgEl.textContent = avg.toFixed(1);
  totalEl.textContent = summary.totalCount || 0;

  // 평균 별
  const rounded = Math.round(avg);
  starsEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    span.className = 'star';
    span.textContent = (i < rounded) ? '★' : '☆';
    starsEl.appendChild(span);
  }

  // 분포 막대(5~1점 순)
  const container = document.getElementById('ratingBreakdown');
  container.innerHTML = '';
  for (let score = 5; score >= 1; score--) {
    const row = document.createElement('div');
    row.className = 'rating-row';

    row.innerHTML = `
      <div class="rating-label">${score}점</div>
      <div class="rating-bar"><div class="bar-fill" style="width:0%"></div></div>
      <div class="rating-count">0</div>
    `;
    container.appendChild(row);
  }

  // 데이터 반영
  const total = summary.totalCount || 0;
  const rows = container.querySelectorAll('.rating-row');
  rows.forEach((row, i) => {
    const score = 5 - i;                 // 5,4,3,2,1
    const idx = score - 1;               // 4..0
    const count = summary.distribution?.[idx] ?? 0;
    const percent = total > 0 ? (count / total) * 100 : 0;

    row.querySelector('.bar-fill').style.width = `${percent}%`;
    row.querySelector('.rating-count').textContent = count;
  });
}

function renderReviews(pageData) {
  const listEl = document.getElementById('reviewList');
  listEl.innerHTML = '';

  (pageData.content || []).forEach(r => {
    const item = document.createElement('div');
    item.className = 'review-item';

    const rating = Number(r.rating || 0);
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const dateStr = (r.createdAt || '').toString().replace('T', ' ').substring(0, 16);

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
    item.querySelector('.review-text').textContent = r.content || '';

    listEl.appendChild(item);
  });

  // (필요시) 페이지네이션 구성에 pageData.page/totalPages 사용
}
