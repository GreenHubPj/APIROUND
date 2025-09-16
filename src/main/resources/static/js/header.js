document.addEventListener('DOMContentLoaded', () => {
  // 모든 로그아웃 폼에 대해 CSRF hidden 보강
  document.querySelectorAll('.logout-form').forEach(form => {
    form.addEventListener('submit', () => {
      const hasHidden = form.querySelector('input[name="_csrf"]');
      if (!hasHidden) {
        const meta = document.querySelector('meta[name="_csrf"]');
        const token = meta?.getAttribute('content');
        if (token) {
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = '_csrf';
          hidden.value = token;
          form.appendChild(hidden);
        }
      }
      // 그대로 제출 (기본 submit)
    });
  });

  // 혹시 버튼만 있고 폼이 없는 경우 대비
  document.querySelectorAll('.logout-btn').forEach(btn => {
    if (btn.closest('form')) return; // 이미 폼 방식이면 건너뜀
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      tryPostLogout().catch(() => {
        // POST 매핑 없으면 GET으로 백업
        window.location.href = '/logout';
      });
    });
  });
});

async function tryPostLogout() {
  const meta = document.querySelector('meta[name="_csrf"]');
  const token = meta?.getAttribute('content');
  const headers = token ? { 'X-CSRF-TOKEN': token } : {};
  const res = await fetch('/logout', {
    method: 'POST',
    headers,
    credentials: 'same-origin'
  });
  if (!res.ok) throw new Error('logout failed');
  // 캐시 문제 방지
  window.location.replace('/?t=' + Date.now());
}
