// profile-edit-company.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profileEditForm');
  const pw = document.getElementById('password');
  const pw2 = document.getElementById('passwordConfirm');

  if (form) {
    form.addEventListener('submit', (e) => {
      // 새 비번은 "입력했을 때만" 검증
      const v1 = (pw?.value || '').trim();
      const v2 = (pw2?.value || '').trim();
      if (v1.length > 0) {
        if (v1.length < 6) {
          e.preventDefault();
          alert('새 비밀번호는 6자 이상이어야 합니다.');
          pw.focus();
          return;
        }
        if (v1 !== v2) {
          e.preventDefault();
          alert('새 비밀번호가 일치하지 않습니다.');
          pw2.focus();
          return;
        }
      }
    });
  }

  const withdrawForm = document.getElementById('withdrawForm');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', (e) => {
      if (!confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        e.preventDefault();
      }
    });
  }
});
