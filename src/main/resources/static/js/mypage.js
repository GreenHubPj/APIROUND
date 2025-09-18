// 마이페이지 JavaScript (서버 렌더값을 덮어쓰지 않도록 데모 주입 제거)
document.addEventListener('DOMContentLoaded', function () {
  // 모듈 클릭 → 해당 페이지 이동
  const moduleItems = document.querySelectorAll('.module-item');
  moduleItems.forEach((item) => {
    item.addEventListener('click', function () {
      const moduleType = this.getAttribute('data-module');
      const routes = {
        payment: '/orderhistory',
        refund: '/refund',
        review: '/review',
        cart: '/shoppinglist',
        recipe: '/myrecipe',
        profile: '/profile-edit',
      };
      const to = routes[moduleType];
      if (to) window.location.href = to;
    });

    // 접근성/애니메이션
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    const title = item.querySelector('.module-title');
    if (title) item.setAttribute('aria-label', `마이페이지 기능: ${title.textContent}`);

    item.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-5px)';
    });
    item.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
    });
  });

  // 키보드 접근성
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const el = document.activeElement;
      if (el.classList.contains('module-item')) {
        e.preventDefault();
        el.click();
      }
    }
  });

  // 반응형 그리드
  function handleResize() {
    const grid = document.querySelector('.modules-grid');
    if (!grid) return;
    if (window.innerWidth <= 480) {
      grid.style.gridTemplateColumns = '1fr';
    } else if (window.innerWidth <= 768) {
      grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // 모듈 등장 애니메이션
  function animateModules() {
    const modules = document.querySelectorAll('.module-item');
    modules.forEach((m, i) => {
      m.style.opacity = '0';
      m.style.transform = 'translateY(30px)';
      setTimeout(() => {
        m.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        m.style.opacity = '1';
        m.style.transform = 'translateY(0)';
      }, i * 100);
    });
  }
  setTimeout(animateModules, 300);

  // 주문/배송 플로우(데모 카운트만 표시 – 사용자 정보와 무관)
  initOrderTracking();

  function initOrderTracking() {
    const flow = document.querySelector('.tracking-flow');
    const steps = document.querySelectorAll('.flow-step');
    if (!flow || !steps.length) return;

    steps.forEach((step, idx) => {
      step.addEventListener('click', function () {
        const lbl = this.querySelector('.step-label')?.textContent || '';
        alert(`${lbl}: ${[
          '주문이 성공적으로 접수되었습니다.',
          '결제가 완료되었습니다.',
          '상품을 준비하고 있습니다. 곧 배송을 시작합니다.',
          '상품이 배송 중입니다.',
          '배송이 완료되었습니다.',
        ][idx] || '상태 정보가 없습니다.'}`);
      });

      step.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-1px)';
      });
      step.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0)';
      });
    });

    // 데모 카운트(필요시 서버 데이터로 대체하세요)
    const counts = [1, 1, 0, 0, 0];
    document.querySelectorAll('.step-box').forEach((el, i) => {
      el.textContent = counts[i] ?? 0;
    });

    // 등장 애니메이션
    flow.style.opacity = '0';
    flow.style.transform = 'translateY(20px)';
    setTimeout(() => {
      flow.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      flow.style.opacity = '1';
      flow.style.transform = 'translateY(0)';
    }, 300);
    steps.forEach((s, i) => {
      s.style.opacity = '0';
      s.style.transform = 'scale(0.9)';
      setTimeout(() => {
        s.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        s.style.opacity = '1';
        s.style.transform = 'scale(1)';
      }, 400 + i * 100);
    });
  }
});