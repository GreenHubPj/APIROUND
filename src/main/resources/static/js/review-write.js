// 로그인한 사용자가 실제로 구매(배송완료)한 상품인지 확인해서
// 상품 정보를 상단 섹션에 채워주고, 아니면 작성 비활성 처리

document.addEventListener('DOMContentLoaded', async () => {
  initializeStarRating();
  initializeTextarea();
  initializeSaveButton();
  addWritePageAnimations();

  await hydrateProductInfoForWriter(); // ★ 상품 정보 채우기
});

let currentRating = 5; // 기본 별점
let isDirty = false;
let writableMatched = null; // 작성 가능한 목록에서 매칭된 아이템(없으면 null)

// ──────────────────────────────────────────────────────────────
// 상품 정보 주입
// ──────────────────────────────────────────────────────────────
async function hydrateProductInfoForWriter() {
  const productId = new URLSearchParams(location.search).get('productId') ||
                    document.querySelector('main[data-product-id]')?.getAttribute('data-product-id');

  const $brand = document.querySelector('.store-brand');
  const $img   = document.querySelector('.product-img');
  const $name  = document.querySelector('.product-name');
  const $desc  = document.querySelector('.product-description');
  const $price = document.querySelector('.product-price');
  const $origin= document.querySelector('.origin-label');
  const $save  = document.querySelector('.save-btn');

  if (!productId) {
    fallback('상품 정보가 없습니다.');
    return;
  }

  try {
    // 내 ‘작성 가능’ 목록에서 일치하는 상품 찾기
    const res = await fetch('/api/my/reviews/writable', { credentials: 'include' });
    if (res.status === 401) {
      // API가 redirectUrl을 내려주는 형식이면 따라감
      const body = await safeJson(res);
      if (body?.redirectUrl) { location.href = body.redirectUrl; return; }
    }
    if (!res.ok) throw 0;

    const items = await res.json(); // [{ productId, productName, productImage, storeName, productDescription, priceText, originText, orderItemId, ... }]
    writableMatched = (items || []).find(it => String(it.productId) === String(productId));

    if (writableMatched) {
      // 화면 채우기
      if ($brand) $brand.textContent = writableMatched.storeName ?? '';
      if ($img)   $img.src = writableMatched.productImage || '/images/농산물.png';
      if ($name)  $name.textContent = writableMatched.productName ?? '';
      if ($desc)  $desc.textContent = (writableMatched.productDescription ?? '').trim();
      if ($price) $price.textContent = writableMatched.priceText ?? '';
      if ($origin)$origin.textContent= writableMatched.originText ?? '';

      // main 태그 data 추가(없으면)
      const main = document.querySelector('main[data-product-id]') || document.querySelector('main');
      if (main && !main.dataset.productId) main.setAttribute('data-product-id', String(productId));
      if (main && writableMatched.orderItemId) main.setAttribute('data-order-item-id', String(writableMatched.orderItemId));
    } else {
      // 내 구매 이력의 '작성가능' 품목이 아니면 작성 버튼 잠금
      if ($save) {
        $save.disabled = true;
        $save.title = '해당 상품은 리뷰 작성 대상이 아닙니다.';
      }
      if ($name)  $name.textContent = $name.textContent || '리뷰 대상 상품을 찾을 수 없습니다';
    }
  } catch {
    fallback('상품 정보를 불러오지 못했습니다.');
  }

  function fallback(msg) {
    if ($name && !$name.textContent) $name.textContent = msg;
    if ($img && !$img.src) $img.src = '/images/농산물.png';
    if ($save) $save.disabled = true;
  }
}

// ──────────────────────────────────────────────────────────────
// 별점/텍스트 UI
// ──────────────────────────────────────────────────────────────
function initializeStarRating() {
  const stars = document.querySelectorAll('.star[data-rating]');
  const ratingText = document.querySelector('.rating-text');
  const ratingTexts = { 1: '별로에요', 2: '아쉬워요', 3: '보통이에요', 4: '좋아요', 5: '최고에요' };

  const highlight = rating => {
    stars.forEach((s, idx) => s.classList.toggle('active', idx < rating));
    if (ratingText) {
      ratingText.textContent = ratingTexts[rating] ?? '';
      ratingText.style.color = getRatingColor(rating);
    }
  };

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const r = parseInt(star.getAttribute('data-rating'), 10);
      if (r !== currentRating) {
        currentRating = r;
        isDirty = true;
      }
      highlight(currentRating);
    });
    star.addEventListener('mouseenter', () => {
      const r = parseInt(star.getAttribute('data-rating'), 10);
      highlight(r);
    });
  });

  document.querySelector('.star-rating')?.addEventListener('mouseleave', () => {
    highlight(currentRating);
  });

  highlight(currentRating);
}

function getRatingColor(rating) {
  const colors = { 1: '#dc3545', 2: '#fd7e14', 3: '#ffc107', 4: '#20c997', 5: '#28a745' };
  return colors[rating] || '#6c757d';
}

function initializeTextarea() {
  const textarea = document.querySelector('.review-textarea');
  const charCount = document.querySelector('.char-count');
  if (!textarea || !charCount) return;

  const update = () => {
    const max = Number(textarea.getAttribute('maxlength')) || 500;
    const len = textarea.value.length;
    charCount.textContent = `${len}/${max}`;
    charCount.style.color = len > max * 0.9 ? '#dc3545' : len > max * 0.7 ? '#ffc107' : '#6c757d';
  };

  update();
  textarea.addEventListener('input', () => {
    isDirty = true;
    update();
  });
  textarea.addEventListener('focus', function () {
    this.style.borderColor = '#0056b3';
    this.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
  });
  textarea.addEventListener('blur', function () {
    this.style.borderColor = '#007bff';
    this.style.boxShadow = 'none';
  });
}

function initializeSaveButton() {
  const saveBtn = document.querySelector('.save-btn');
  saveBtn?.addEventListener('click', submitReview);
  saveBtn?.addEventListener('mouseenter', function () {
    this.style.transform = 'translateY(-1px)';
  });
  saveBtn?.addEventListener('mouseleave', function () {
    this.style.transform = 'translateY(0)';
  });
}

// ──────────────────────────────────────────────────────────────
// 저장
// ──────────────────────────────────────────────────────────────
async function submitReview() {
  const button = document.querySelector('.save-btn');
  const textarea = document.querySelector('.review-textarea');
  const reviewText = (textarea?.value ?? '').trim();

  if (!currentRating || currentRating < 1 || currentRating > 5) {
    alert('별점을 선택해주세요.');
    return;
  }
  if (reviewText.length < 10) {
    alert('리뷰는 최소 10자 이상 작성해주세요.');
    textarea?.focus();
    return;
  }

  // 반드시 내가 쓸 수 있는 상품이어야 함 (writableMatched 확인)
  if (!writableMatched) {
    alert('해당 상품은 현재 로그인한 계정으로 리뷰를 작성할 수 없습니다.');
    return;
  }

  const productId = new URLSearchParams(location.search).get('productId') ||
                    document.querySelector('main[data-product-id]')?.getAttribute('data-product-id');
  if (!productId) {
    alert('상품 정보가 없습니다. 다시 시도해주세요.');
    return;
  }

  try {
    button.disabled = true;
    button.textContent = '저장 중...';
    button.style.transform = 'scale(0.95)';

    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 세션 쿠키 사용 (스프링 시큐리티 미사용이어도 세션 로그인이면 필요)
      body: JSON.stringify({ rating: currentRating, content: reviewText })
    });

    // 401 → 로그인 유도
    if (res.status === 401) {
      const body = await safeJson(res);
      if (body?.redirectUrl) { location.href = body.redirectUrl; return; }
      throw new Error('로그인이 필요합니다.');
    }

    if (!res.ok) {
      const msg = await safeText(res);
      throw new Error(msg || '저장에 실패했습니다.');
    }

    isDirty = false; // 저장 성공 → 이탈 경고 해제
    button.style.background = 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)';
    button.textContent = '저장 완료!';
    setTimeout(() => {
      alert('리뷰가 성공적으로 저장되었습니다.');
      location.href = `/products/${productId}/reviews`;
    }, 600);
  } catch (e) {
    alert(e.message ?? '리뷰 저장 중 오류가 발생했습니다.');
  } finally {
    button.disabled = false;
    button.style.transform = 'scale(1)';
  }
}

async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}
async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

// 애니메이션/이탈 방지
function addWritePageAnimations() {
  const productSection = document.querySelector('.product-info-section');
  if (productSection) {
    productSection.style.opacity = '0';
    productSection.style.transform = 'translateY(30px)';
    setTimeout(() => {
      productSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      productSection.style.opacity = '1';
      productSection.style.transform = 'translateY(0)';
    }, 100);
  }

  const reviewSection = document.querySelector('.review-write-section');
  if (reviewSection) {
    reviewSection.style.opacity = '0';
    reviewSection.style.transform = 'translateY(30px)';
    setTimeout(() => {
      reviewSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      reviewSection.style.opacity = '1';
      reviewSection.style.transform = 'translateY(0)';
    }, 200);
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') history.back();
});
window.addEventListener('beforeunload', e => {
  const textarea = document.querySelector('.review-textarea');
  const hasText = (textarea?.value?.trim()?.length ?? 0) > 0;
  if (isDirty || hasText) {
    e.preventDefault();
    e.returnValue = '작성 중인 리뷰가 있습니다. 정말 나가시겠습니까?';
  }
});
