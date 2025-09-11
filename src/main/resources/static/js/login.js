// 로그인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function () {
  // 탭 전환 (기존 로직 유지)
  const memberTabs = document.querySelectorAll('.member-type-tab');
  const loginForm = document.getElementById('loginForm');
  const socialLoginSection = document.getElementById('socialLoginSection');

  memberTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      memberTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const tabType = this.getAttribute('data-type');
      if (tabType === 'seller') socialLoginSection.style.display = 'none';
      else socialLoginSection.style.display = 'block';
    });
  });

  // 비밀번호 보기/숨기기
  const passwordToggle = document.querySelector('.password-toggle');
  const passwordInput = document.getElementById('loginPassword');
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function () {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      const img = this.querySelector('img');
      if (img) img.src = isPassword ? '/images/뜬눈.png' : '/images/감은눈.png';
    });
  }

  // ✅ 로그인 폼 제출 -> 서버로 POST
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const loginId = document.getElementById('loginId').value.trim();
      const loginPassword = document.getElementById('loginPassword').value.trim();
      if (!loginId || !loginPassword) {
        alert('아이디와 비밀번호를 모두 입력해주세요.');
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append('loginId', loginId);
        params.append('password', loginPassword);

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          alert((data && data.message) || '아이디 또는 비밀번호가 일치하지 않습니다.');
          return;
        }

        // 로그인 성공
        window.location.href = '/';
      } catch (err) {
        alert('네트워크 오류입니다.');
      }
    });
  }

  // 소셜 로그인 버튼 (임시)
  const kakaoBtn = document.querySelector('.kakao-btn');
  const googleBtn = document.querySelector('.google-btn');
  if (kakaoBtn) kakaoBtn.addEventListener('click', () => alert('카카오 로그인 기능은 준비 중입니다.'));
  if (googleBtn) googleBtn.addEventListener('click', () => alert('구글 로그인 기능은 준비 중입니다.'));
});
