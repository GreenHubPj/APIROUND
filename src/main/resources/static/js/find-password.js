// 비밀번호 찾기 페이지 JS (실동작 버전)
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.member-type-tab');

  const personalSection = document.getElementById('individualFindPasswordForm');
  const companySection  = document.getElementById('sellerFindPasswordForm');
  const resetSection    = document.getElementById('resetPasswordSection');
  const successSection  = document.getElementById('successSection');

  const personalForm = document.getElementById('findPasswordForm');
  const companyForm  = document.getElementById('findSellerPasswordForm');
  const resetForm    = document.getElementById('resetPasswordForm');

  let resetToken = null; // 서버에서 발급받은 토큰

  // 탭 전환
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.type;
      if (type === 'individual') {
        personalSection.style.display = 'block';
        companySection.style.display  = 'none';
      } else {
        personalSection.style.display = 'none';
        companySection.style.display  = 'block';
      }
      // 섹션 전환 시 이하 영역 초기화
      resetSection.style.display = 'none';
      successSection.style.display = 'none';
      resetToken = null;
    });
  });

  // 공통: 인증번호 전송
  document.querySelectorAll('.verification-btn').forEach(btn => {
    if (btn.textContent.includes('인증번호 전송')) {
      btn.addEventListener('click', async function() {
        const emailInput = this.closest('.verification-container').querySelector('input[type="email"]');
        const email = (emailInput?.value || '').trim();
        if (!email) return alert('이메일을 입력해주세요.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('올바른 이메일 형식을 입력해주세요.');

        this.disabled = true;
        try {
          const res = await fetch('/auth/email/send', {
            method: 'POST',
            headers: {'Content-Type':'
