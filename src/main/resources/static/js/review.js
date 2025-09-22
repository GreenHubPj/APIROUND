// 마이페이지형 "작성 가능한 리뷰 / 작성한 리뷰" 탭 페이지
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  bindButtons();
  addProfilePageAnimations();
  // 초기에 작성가능/작성한 리스트 로딩
  loadWritableReviews();
  loadWrittenReviews();
});

function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const tab = this.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById(tab);
      if (target) {
        target.classList.add('active');
        target.style.opacity = '0';
        target.style.transform = 'translateY(20px)';
        setTimeout(() => {
          target.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          target.style.opacity = '1';
          target.style.transform = 'translateY(0)';
        }, 50);
      }
    });
  });
}

function bindButtons() {
  // 동적 렌더링이므로 이벤트 위임 사용
  document.body.addEventListener('click', e => {
    const writeBtn = e.target.closest('.write-review-btn');
    if (writeBtn) {
      const productId = writeBtn.dataset.productId;
      if (productId) {
        location.href = `/review-write?productId=${productId}`;
      } else {
        alert('이 상품은 아직 리뷰 작성 페이지로 이동할 수 없습니다.');
      }
    }
    const editBtn = e.target.closest('.edit-review-btn');
    if (editBtn) {
      const reviewId = editBtn.dataset.reviewId;
      alert(`리뷰 수정 페이지로 이동 (reviewId=${reviewId}) — 필요시 라우팅 추가`);
      // location.href = `/review-edit/${reviewId}`;
    }
    const hideBtn = e.target.closest('.hide-btn');
    if (hideBtn) {
      const item = hideBtn.closest('.written-review-item');
      if (item && confirm('이 리뷰를 숨기시겠습니까?')) {
        item.style.transition = 'opacity .3s ease, transform .3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(-100%)';
        setTimeout(() => item.remove(), 300);
      }
    }
  });
}

function addProfilePageAnimations() {
  const userProfile = document.querySelector('.user-profile-section');
  if (userProfile) {
    userProfile.style.opacity = '0';
    userProfile.style.transform = 'translateY(30px)';
    setTimeout(() => {
      userProfile.style.transition = 'opacity .6s ease, transform .6s ease';
      userProfile.style.opacity = '1';
      userProfile.style.transform = 'translateY(0)';
    }, 100);
  }
  const reviewTabs = document.querySelector('.review-tabs');
  if (reviewTabs) {
    reviewTabs.style.opacity = '0';
    reviewTabs.style.transform = 'translateY(30px)';
    setTimeout(() => {
      reviewTabs.style.transition = 'opacity .6s ease, transform .6s ease';
      reviewTabs.style.opacity = '1';
      reviewTabs.style.transform = 'translateY(0)';
    }, 200);
  }
}

// ===== 데이터 로딩 (로그인 사용자 기준) =====
// 작성 가능한 리뷰: 주문/배송완료 but 리뷰 미작성
async function loadWritableReviews() {
  const wrap = document.querySelector('#writable .review-list');
  if (!wrap) return;
  try {
    const res = await fetch('/api/my/reviews/writable');
    if (!res.ok) throw 0;
    const items = await res.json();
    wrap.innerHTML = items.map(it => `
      <div class="review-item">
        <div class="product-image"><img src="${it.productImage ?? ''}" alt="${it.productName ?? ''}" class="product-img"></div>
        <div class="product-info">
          <div class="store-name">${it.storeName ?? '-'}</div>
          <div class="product-name">${it.productName ?? '-'}</div>
          <div class="product-description">${escapeHtml(it.productDescription ?? '')}</div>
          <div class="product-details">
            <span class="price">${it.priceText ?? ''}</span>
            <span class="origin">${it.originText ?? ''}</span>
          </div>
        </div>
        <div class="review-actions">
          <button class="write-review-btn" data-product-id="${it.productId ?? ''}">리뷰 작성하기</button>
        </div>
      </div>
    `).join('');
  } catch {
    wrap.innerHTML = '<div class="empty-message">작성 가능한 리뷰가 없습니다.</div>';
  }
}

// 작성한 리뷰
async function loadWrittenReviews() {
  const wrap = document.querySelector('#written .review-list');
  if (!wrap) return;
  try {
    const res = await fetch('/api/my/reviews');
    if (!res.ok) throw 0;
    const items = await res.json();
    wrap.innerHTML = items.map(it => `
      <div class="written-review-item">
        <div class="product-image"><img src="${it.productImage ?? ''}" alt="${it.productName ?? ''}" class="product-img"></div>
        <div class="review-content">
          <div class="product-info">
            <div class="store-name">${it.storeName ?? '-'}</div>
            <div class="product-name">${it.productName ?? '-'}</div>
            <div class="delivery-date">${it.deliveryCompletedAt ?? ''} 배송완료</div>
          </div>
          <div class="review-preview">
            <div class="star-rating">${makeStars(it.rating ?? 0)}</div>
            <p class="review-text">${escapeHtml(it.content ?? '')}</p>
          </div>
        </div>
        <div class="review-actions">
          <button class="edit-review-btn" data-review-id="${it.reviewId ?? ''}">리뷰 수정하기</button>
          <button class="hide-btn">숨기기</button>
        </div>
      </div>
    `).join('');
  } catch {
    wrap.innerHTML = '<div class="empty-message">작성한 리뷰가 없습니다.</div>';
  }
}

function makeStars(n) {
  let s = '';
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= n ? 'active' : ''}">★</span>`;
  return s;
}
function escapeHtml(t) {
  return String(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}
