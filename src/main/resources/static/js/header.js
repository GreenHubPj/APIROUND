// /static/js/header.js
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        // 실패해도 그냥 홈으로 보냄
      } finally {
        window.location.href = '/';
      }
    });
  }
});
