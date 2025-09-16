// 리뷰 작성 페이지 전용
document.addEventListener('DOMContentLoaded', () => {
  initializeStarRating();
  initializeTextarea();
  initializeSaveButton();
  addPageAnimations();
});

let currentRating = 5; // 기본 별점

function initializeStarRating() {
  const stars = document.querySelectorAll('.star[data-rating]');
  const ratingText = document.querySelector('.rating-text');
  const ratingTexts = { 1: '별로에요', 2: '아쉬워요', 3: '보통이에요', 4: '좋아요', 5: '최고에요' };

  const highlight = rating => {
    stars.forEach((s, idx) => {
      s.classList.toggle('active', idx < rating);
    });
    if (ratingText) {
      ratingText.textContent = ratingTexts[rating] ?? '';
      ratingText.style.color = getRatingColor(rating);
    }
  };

  stars.forEach(star => {
    star.addEventListener('click', () => {
      currentRating = parseInt(star.getAttribute('data-rating'), 10);
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
  textarea.addEventListener('input', update);
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

  // productId 추출 (URL 쿼리나 data-속성 사용)
  // 권장: <main data-product-id="..."> 로 전달
  const productId = document.querySelector('main[data-product-id]')?.getAttribute('data-product-id')
    // fallback: /review-write?productId=123 형태
    || new URLSearchParams(location.search).get('productId');

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
      body: JSON.stringify({ rating: currentRating, content: reviewText })
    });

    if (!res.ok) {
      const msg = await safeText(res);
      throw new Error(msg || '저장에 실패했습니다.');
    }

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
  try {
    const t = await res.text();
    return t;
  } catch {
    return '';
  }
}

function addPageAnimations() {
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

// ESC로 뒤로가기/페이지 이탈 방지
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    history.back();
  }
});
window.addEventListener('beforeunload', e => {
  const textarea = document.querySelector('.review-textarea');
  if ((textarea?.value?.trim()?.length ?? 0) > 0 || currentRating > 0) {
    e.preventDefault();
    e.returnValue = '작성 중인 리뷰가 있습니다. 정말 나가시겠습니까?';
  }
});
