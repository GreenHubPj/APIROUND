// 업체 마이페이지 JavaScript (서버 렌더 + 실시간 통계 반영, 401 리다이렉트/표시 안정화)

document.addEventListener('DOMContentLoaded', function () {
  // ====== 라우팅(모듈 클릭) ======
  const moduleItems = document.querySelectorAll('.module-item');

  moduleItems.forEach((item) => {
    item.addEventListener('click', function () {
      const moduleType = this.getAttribute('data-module');
      handleModuleClick(moduleType);
    });

    // 호버 효과
    item.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-5px)';
      this.style.transition = 'transform .2s ease';
    });
    item.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
    });
  });

  function handleModuleClick(moduleType) {
    switch (moduleType) {
      case 'orders':
        window.location.href = '/customerOrder';
        break;
      case 'delivery':
        // ✅ 실제 매핑 컨트롤러 경로(/seller/delivery)로 이동
        window.location.href = '/seller/delivery';
        break;
      case 'reviews':
        window.location.href = '/review-management';
        break;
      case 'company-edit':
        window.location.href = '/profile-edit-company';
        break;
      case 'refund':
        window.location.href = '/refund-management';
        break;
      case 'products':
        window.location.href = '/item-management';
        break;
      case 'email-notification':
        openEmailModal();
        break;
      default:
        console.log('알 수 없는 모듈:', moduleType);
    }
  }

  // ====== 이메일 모달 ======
  window.openEmailModal = function () {
    const modal = document.getElementById('emailModal');
    if (!modal) return;
    modal.style.display = 'flex';
    checkRecipients();
  };
    // 개발중 알림 표시 함수
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
            }
        });

        // ESC 키로 닫기
        const handleEsc = function(e) {
            if (e.key === 'Escape') {
                alertDiv.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // 이메일 모달 관련 JavaScript - 전역 스코프로 이동
    window.openEmailModal = function() {
        document.getElementById('emailModal').style.display = 'flex';
        checkRecipients();
    }

  window.closeEmailModal = function () {
    const modal = document.getElementById('emailModal');
    if (!modal) return;
    modal.style.display = 'none';
    const form = document.getElementById('emailForm');
    if (form) form.reset();
  };

  // 수신자 수 확인
  async function checkRecipients() {
    try {
      const response = await fetch('/api/admin/email/recipients', { credentials: 'include' });
      // 401 처리
      if (response.status === 401) {
        const body = await safeJson(response);
        if (body?.redirectUrl) location.href = body.redirectUrl;
        return;
      }

      const data = await response.json();

      const cnt = document.getElementById('recipientCount');
      if (!cnt) return;

      if (data.success) {
        cnt.textContent = toInt(data.count);
      } else {
        cnt.textContent = '0';
        console.error('수신자 조회 실패:', data.message);
      }
    } catch (error) {
      console.error('수신자 조회 에러:', error);
      const cnt = document.getElementById('recipientCount');
      if (cnt) cnt.textContent = '0';
    }
  }

  // 수신자 확인 버튼
  const checkBtn = document.getElementById('checkRecipientsBtn');
  if (checkBtn) {
    checkBtn.addEventListener('click', async function () {
      try {
        const response = await fetch('/api/admin/email/recipients', { credentials: 'include' });
        if (response.status === 401) {
          const body = await safeJson(response);
          if (body?.redirectUrl) location.href = body.redirectUrl;
          return;
        }
        const data = await response.json();

        if (data.success) {
          const userList = (data.users || [])
            .map((user) => `${user.name} (${user.email})`)
            .join('\n');
          alert(`SMS 동의 고객 ${toInt(data.count)}명:\n\n${userList}`);
        } else {
          alert('수신자 목록을 불러올 수 없습니다: ' + (data.message || '알 수 없는 오류'));
        }
      } catch (error) {
        alert('수신자 목록 조회 중 오류가 발생했습니다.');
        console.error(error);
      }
    });
  }

  // 이메일 발송 폼 제출
  const emailForm = document.getElementById('emailForm');
  if (emailForm) {
    emailForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const submitBtn = this.querySelector('.btn-send');
      const originalText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '발송 중...';
      }

      const formData = new FormData();
      formData.append('subject', document.getElementById('emailSubject')?.value || '');
      formData.append('message', document.getElementById('emailMessage')?.value || '');

      try {
        const response = await fetch('/api/admin/email/send-bulk', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (response.status === 401) {
          const body = await safeJson(response);
          if (body?.redirectUrl) location.href = body.redirectUrl;
          return;
        }

        const data = await response.json();

        if (data.success) {
          alert('메일 발송이 시작되었습니다! 발송 완료까지 시간이 소요될 수 있습니다.');
          closeEmailModal();
        } else {
          alert('메일 발송 실패: ' + (data.message || '알 수 없는 오류'));
        }
      } catch (error) {
        alert('메일 발송 중 오류가 발생했습니다.');
        console.error(error);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  }

  // 모달 외부 클릭 시 닫기
  const emailModal = document.getElementById('emailModal');
  if (emailModal) {
    emailModal.addEventListener('click', function (e) {
      if (e.target === this) {
        closeEmailModal();
      }
    });
  }

  // ====== 반응형 처리 ======
  function handleResize() {
    const modulesGrid = document.querySelector('.modules-grid');
    const companyStats = document.querySelector('.company-stats');
    if (!modulesGrid || !companyStats) return;

        if (window.innerWidth <= 480) {
            // 모바일: 1열
            modulesGrid.style.gridTemplateColumns = '1fr';
            companyStats.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            // 태블릿: 2열
            modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            // 데스크톱: 3열 (모듈), 4열 (통계)
            modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }

    // 초기 로드 시 반응형 적용
    handleResize();

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);

    // 통계 실시간 업데이트 (주문 상태 변경 시)
    function updateStats() {
        // 통계 숫자 애니메이션 재실행
        animateNumbers();
    }

    // 주문 상태 변경 시 통계 업데이트 (전역 함수로 등록)
    window.updateCompanyStats = updateStats;


    if (window.innerWidth <= 480) {
      modulesGrid.style.gridTemplateColumns = '1fr';
      companyStats.style.gridTemplateColumns = '1fr';
    } else if (window.innerWidth <= 768) {
      modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      companyStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      companyStats.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // ====== 등장 애니메이션 ======
  function addAnimation() {
    const stats = document.querySelectorAll('.stat-item');
    const modules = document.querySelectorAll('.module-item');

    stats.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 100);
    });

    modules.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      setTimeout(() => {
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 400 + i * 100);
    });
  }
  setTimeout(addAnimation, 300);

  // ====== 접근성 ======
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const focused = document.activeElement;
      if (focused && focused.classList.contains('module-item')) {
        e.preventDefault();
        focused.click();
      }
    }
  });
  moduleItems.forEach((item) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    const title = item.querySelector('.module-title')?.textContent || '';
    item.setAttribute('aria-label', `업체 마이페이지 기능: ${title}`);
  });

  // ====== 숫자 도우미 ======
  function toInt(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
  }
  function toFixed1(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return '0.0';
    return (Math.round(n * 10) / 10).toFixed(1);
  }
  function formatInt(el) {
    if (!el) return;
    const n = toInt(el.textContent);
    el.textContent = n.toLocaleString('ko-KR');
  }
  function setNumber(el, value, decimals = 0) {
    if (!el) return;
    if (decimals > 0) {
      el.textContent = Number(value || 0).toFixed(decimals);
    } else {
      el.textContent = toInt(value).toLocaleString('ko-KR');
    }
  }

  // ====== 통계 숫자 애니메이션 & 실시간 갱신 ======
  function animateNumberTo(el, target, decimals = 0, duration = 120) {
    if (!el) return;
    const fromText = el.textContent.trim().replaceAll(',', '');
    const from = Number(fromText) || 0;
    const to = Number(target) || 0;

    if (from === to) {
      setNumber(el, to, decimals);
      return;
    }

    const steps = Math.max(1, Math.floor(duration));
    const delta = (to - from) / steps;
    let current = from;
    let tick = 0;

    const timer = setInterval(() => {
      tick += 1;
      current += delta;

      if (tick >= steps) {
        current = to;
        clearInterval(timer);
      }
      setNumber(el, current, decimals);
    }, 16); // ~60fps
  }

  // 최초 화면값 → 부드럽게 숫자 등장 + 천단위 포맷
  function animateNumbersInitial() {
    const $stats = document.querySelectorAll('.company-stats .stat-item .stat-number');
    $stats.forEach((el, idx) => {
      const raw = el.textContent.trim().replaceAll(',', '');
      const isDecimal = raw.includes('.');
      const target = isDecimal ? parseFloat(raw) : parseInt(raw, 10);
      if (isNaN(target)) return;
      el.textContent = isDecimal ? '0.0' : '0';
      animateNumberTo(el, target, isDecimal ? 1 : 0, 60 + idx * 10);
    });
  }
  setTimeout(animateNumbersInitial, 800);

  // 서버 통계 가져오기 → 화면 반영 (401/리다이렉트 처리, 연속 호출 방지)
  let statsAbortController = null;
  async function refreshStats() {
    try {
      if (statsAbortController) statsAbortController.abort();
      statsAbortController = new AbortController();

      const res = await fetch('/api/seller/company/stats', {
        credentials: 'include',
        signal: statsAbortController.signal,
      });

      if (res.status === 401) {
        const body = await safeJson(res);
        if (body?.redirectUrl) location.href = body.redirectUrl;
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success || !data.stats) return;

      const s = data.stats;
      // DOM 매칭(템플릿의 순서를 그대로 사용)
      const $totalOrders = document.querySelector('.company-stats .stat-item:nth-child(1) .stat-number');
      const $completed   = document.querySelector('.company-stats .stat-item:nth-child(2) .stat-number');
      const $pending     = document.querySelector('.company-stats .stat-item:nth-child(3) .stat-number');
      const $rating      = document.querySelector('.company-stats .stat-item:nth-child(4) .stat-number');

      animateNumberTo($totalOrders, toInt(s.totalOrders ?? 0), 0);
      animateNumberTo($completed,   toInt(s.completedDeliveries ?? 0), 0);
      animateNumberTo($pending,     toInt(s.pendingOrders ?? 0), 0);

      // 평점은 소수 1자리 고정
      const ratingVal = toFixed1(s.rating ?? 0);
      animateNumberTo($rating, Number(ratingVal), 1);

      // 애니메이션이 끝나면서 천단위 포맷 유지되도록 한 번 더 보정
      setTimeout(() => {
        formatInt($totalOrders);
        formatInt($completed);
        formatInt($pending);
        // rating 은 소수 1자리 유지
        if ($rating) $rating.textContent = toFixed1($rating.textContent);
      }, 300);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        // 조용히 무시 (네트워크 에러 시 페이지 사용에는 영향 없음)
        // console.debug('stats refresh error', e);
      }
    }
  }

  async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
  }

  // 초기에 1회 불러오고, 일정 주기로 갱신
  refreshStats();
  const STATS_REFRESH_MS = 20_000; // 20초 간격
  let statsTimer = setInterval(refreshStats, STATS_REFRESH_MS);

  // 탭이 다시 보일 때 새로고침(모바일에서 유용)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshStats();
  });

  // 페이지 나갈 때 타이머/요청 정리
  window.addEventListener('beforeunload', () => {
    if (statsTimer) clearInterval(statsTimer);
    if (statsAbortController) statsAbortController.abort();
  });
});
