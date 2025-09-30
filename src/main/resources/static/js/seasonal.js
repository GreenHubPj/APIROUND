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
  const productCards = Array.from(document.querySelectorAll('.products-grid .product-card'));
  
  // 카드 0개 처리
  if (productCards.length === 0) {
    if (grid) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = '이달의 특산품이 아직 없습니다.';
      grid.appendChild(empty);
    }
    return;
  }

  // 카드 클릭/호버 이벤트
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

  // 부드러운 전환 효과 시작
  function startSmoothTransition() {
    // 상품 카드들에 페이드 아웃 효과
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('fade-out');
      }, index * 20);
    });
  }
  
  // 페이지 로드 시 페이드 인 애니메이션
  function startPageLoadAnimation() {
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
      // 초기 상태 설정
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      // 순차적으로 페이드 인
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50); // 50ms 간격으로 순차 애니메이션
    });
  }
  
  // 페이징 링크에 부드러운 전환 적용
  document.addEventListener('click', function(e) {
    // 페이징 링크 클릭 감지
    if (e.target.closest('.page-btn, .page-number')) {
      e.preventDefault();
      const link = e.target.closest('a');
      if (link && link.href) {
        // 부드러운 전환 시작
        startSmoothTransition();
        // 200ms 후 페이지 이동 (간단하고 빠른 방식)
        setTimeout(() => {
          window.location.href = link.href;
        }, 200);
      }
    }
  });

  // 초기 로드 시 페이드 인 애니메이션
  startPageLoadAnimation();

  // ---------- functions ----------

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
