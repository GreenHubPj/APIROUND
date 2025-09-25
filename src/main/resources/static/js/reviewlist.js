document.addEventListener('DOMContentLoaded', () => {
  const productId = resolveProductId();
  if (!productId) {
    console.warn('productId를 찾을 수 없습니다.');
    return;
  }
  loadSummary(productId);
  loadReviews(productId, 0, 20, 'createdAt,desc');

  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.addEventListener('click', () => history.back());
});

/* 안전하게 productId 해석 */
function resolveProductId() {
  const main = document.querySelector('main.main-content');
  const dataId = main?.dataset?.productId;
  if (dataId && dataId !== '0') return dataId;

  if (window.__REVIEWLIST__?.productId) return String(window.__REVIEWLIST__.productId);

  const m = location.pathname.match(/\/products\/(\d+)\/reviews/);
  if (m) return m[1];

  const q = new URLSearchParams(location.search).get('productId');
  if (q) return q;

  return null;
}

/* ===== API ===== */
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

/* ===== Render: Summary (구글 플레이 스타일) ===== */
function renderSummary(summary) {
  const avg = Number(summary.averageRating || 0);
  const total = Number(summary.totalCount || 0);
  const dist = Array.isArray(summary.distribution) ? summary.distribution : [0,0,0,0,0];

  // 평균 점수 + 별 + 총 개수
  const avgEl = document.getElementById('averageRating');
  const starsEl = document.getElementById('averageStars');
  const totalTextEl = document.getElementById('totalReviewText');

  avgEl.textContent = avg.toFixed(1);

  const rounded = Math.round(avg);
  starsEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const s = document.createElement('span');
    s.textContent = i < rounded ? '★' : '☆';
    starsEl.appendChild(s);
  }
  totalTextEl.textContent = `평가 ${total.toLocaleString('ko-KR')}개`;

  // 분포(5점 → 1점)
  const box = document.getElementById('ratingBreakdown');
  box.innerHTML = '';
  for (let score = 5; score >= 1; score--) {
    const idx = score - 1; // 4..0 (distribution이 1→5 순 배열이면 서버와 약속 필요)
    const count = Number(dist[idx] || 0);
    const perc = total > 0 ? Math.round((count / total) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'dist-row';
    row.innerHTML = `
      <div class="dist-label">${score}</div>
      <div class="meter"><div class="meter-fill" style="width:${perc}%"></div></div>
      <div class="dist-perc">${perc}%</div>
    `;
    box.appendChild(row);
  }
}

/* ===== Render: Reviews ===== */
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

  // 페이지네이션은 필요 시 pageData.totalPages 등을 사용해 추가
}
