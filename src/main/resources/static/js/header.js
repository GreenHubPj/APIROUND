// /static/js/header.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', (e) => {
    e.preventDefault();

    if (btnLogout.dataset.busy === '1') return;
    btnLogout.dataset.busy = '1';

    // 1) 가장 확실한 방법: POST 폼 제출 → 서버가 세션 무효화 후 리다이렉트
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/auth/logout';
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();

    // 2) 혹시 내비게이션이 막히면(애드온/팝업차단 등) 2.5초 후 백업 플랜 실행
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
          .finally(() => {
            // 캐시된 페이지를 피하려고 캐시버스터 붙여서 이동
            window.location.replace('/?t=' + Date.now());
          });
      }
    }, 2500);
  });
});
