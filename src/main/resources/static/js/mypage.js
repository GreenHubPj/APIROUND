// 마이페이지 JavaScript (서버 렌더값을 덮어쓰지 않도록 데모 주입 제거)
document.addEventListener('DOMContentLoaded', function () {
  // 모듈 클릭 → 해당 페이지 이동
  const moduleItems = document.querySelectorAll('.module-item');
  moduleItems.forEach((item) => {
    item.addEventListener('click', function () {
      const moduleType = this.getAttribute('data-module');
      
      // refund 모듈 클릭 시 개발중 알림
      if (moduleType === 'refund') {
        showDevelopmentAlert('교환/환불');
        return;
      }
      
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

  // 개발중 알림 함수
  function showDevelopmentAlert(featureName) {
    // 기존 알림이 있다면 제거
    const existingAlert = document.querySelector('.development-alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // 알림 요소 생성
    const alertDiv = document.createElement('div');
    alertDiv.className = 'development-alert';
    alertDiv.innerHTML = `
        <div class="alert-content">
            <div class="alert-icon">🚧</div>
            <div class="alert-text">
                <h3>${featureName} 기능</h3>
                <p>현재 개발중입니다.<br>곧 만나보실 수 있습니다!</p>
            </div>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    // 스타일 적용
    alertDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .development-alert .alert-content {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            position: relative;
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .development-alert .alert-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .development-alert .alert-text h3 {
            color: #2c5530;
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        .development-alert .alert-text p {
            color: #666;
            margin: 0;
            line-height: 1.5;
        }
        .development-alert .alert-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #999;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .development-alert .alert-close:hover {
            background: #f5f5f5;
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // body에 추가
    document.body.appendChild(alertDiv);

    // 배경 클릭 시 닫기
    alertDiv.addEventListener('click', function(e) {
      if (e.target === alertDiv) {
        alertDiv.remove();
        style.remove();
      }
    });

    // ESC 키로 닫기
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        alertDiv.remove();
        style.remove();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  // 주문/배송 플로우: 서버 렌더값 유지 + 필요 시 API로 갱신
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

    // ✅ 서버 집계 API로 안전 갱신 (에러 시, 서버 렌더 값 유지)
    fetch('/api/my/order-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const mapOrder = [
          data.orderReceived ?? 0,
          data.paymentCompleted ?? 0,
          data.preparingProduct ?? 0,
          data.shipping ?? 0,
          data.deliveryCompleted ?? 0,
        ];
        document.querySelectorAll('.step-box').forEach((el, i) => {
          el.textContent = mapOrder[i] ?? 0;
        });
        // count > 0 이면 completed, 아니면 pending
        document.querySelectorAll('.flow-step').forEach((el, i) => {
          const has = (mapOrder[i] ?? 0) > 0;
          el.classList.toggle('completed', has);
          el.classList.toggle('pending', !has);
        });
      })
      .catch(() => { /* 무시: 서버 렌더값 유지 */ });
  }
});
