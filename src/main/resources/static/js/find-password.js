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

  // -----------------------------
  // 공통: 이메일 인증코드 전송/검증
  // -----------------------------
  document.querySelectorAll('.verification-container').forEach(box => {
    const sendBtn   = Array.from(box.querySelectorAll('.verification-btn')).find(b => b.textContent.includes('인증번호 전송'));
    const confirmBtn= Array.from(box.querySelectorAll('.verification-btn')).find(b => b.textContent.trim() === '확인');
    const resendBtn = Array.from(box.querySelectorAll('.verification-btn')).find(b => b.textContent.includes('재전송'));
    const emailInput= box.querySelector('input[type="email"]') || document.getElementById('sellerEmail') || document.getElementById('individualEmail');
    const codeInput = box.querySelector('input[type="text"]');

    if (sendBtn && emailInput) {
      sendBtn.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email) return alert('이메일을 입력해주세요.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('올바른 이메일 형식을 입력해주세요.');
        sendBtn.disabled = true;
        try {
          const res = await fetch('/auth/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email })
          });
          if (!res.ok) throw new Error();
          alert('인증번호를 전송했어요. 5분 내에 입력해주세요.');
        } catch (e) {
          alert('인증번호 전송에 실패했어요.');
        } finally {
          sendBtn.disabled = false;
        }
      });
    }

    if (resendBtn && emailInput) {
      resendBtn.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        if (!email) return alert('이메일을 입력해주세요.');
        try {
          const res = await fetch('/auth/email/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email })
          });
          if (!res.ok) throw new Error();
          alert('인증번호를 재전송했어요.');
        } catch (e) {
          alert('재전송에 실패했어요.');
        }
      });
    }

    if (confirmBtn && emailInput && codeInput) {
      confirmBtn.addEventListener('click', async () => {
        const email = (emailInput.value || '').trim();
        const code  = (codeInput.value  || '').trim();
        if (!email || !code) return alert('이메일과 인증번호를 입력해주세요.');
        try {
          const res = await fetch('/auth/email/verify', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, code })
          });
          if (!res.ok) throw new Error();
          const ok = await res.json(); // true/false
          if (ok === true) {
            alert('인증 완료되었습니다.');
          } else {
            alert('인증번호가 올바르지 않거나 만료되었습니다.');
          }
        } catch (e) {
          alert('인증 확인에 실패했어요.');
        }
      });
    }
  });

  // -----------------------------
  // 개인회원: 본인확인 → 토큰 발급
  // -----------------------------
  personalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId = document.getElementById('individualUserId').value.trim();
    const name    = document.getElementById('individualName').value.trim();
    const email   = document.getElementById('individualEmail').value.trim();
    const code    = document.getElementById('individualVerification').value.trim();
    if (!loginId || !name || !email || !code) return alert('모든 항목을 입력해주세요.');

    try {
      const res = await fetch('/auth/password/request-reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ type:'PERSONAL', loginId, name, email, code })
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); // {token: "..."}
      resetToken = data.token;
      if (!resetToken) throw new Error();

      personalSection.style.display = 'none';
      companySection.style.display  = 'none';
      resetSection.style.display    = 'block';
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (err) {
      alert('회원 정보 확인 또는 이메일 인증에 실패했어요.');
    }
  });

  // -----------------------------
  // 판매회원: 본인확인 → 토큰 발급
  // -----------------------------
  companyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loginId  = document.getElementById('sellerUserId').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const businessNumber = document.getElementById('businessNumber').value.trim();
    const contactName = document.getElementById('contactName').value.trim();
    const email   = document.getElementById('sellerEmail').value.trim();
    const code    = document.getElementById('sellerVerification').value.trim();
    if (!loginId || !companyName || !businessNumber || !contactName || !email || !code) {
      return alert('모든 항목을 입력해주세요.');
    }

    try {
      const res = await fetch('/auth/password/request-reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          type:'COMPANY', loginId, companyName, businessNumber, contactName, email, code
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); // {token: "..."}
      resetToken = data.token;
      if (!resetToken) throw new Error();

      personalSection.style.display = 'none';
      companySection.style.display  = 'none';
      resetSection.style.display    = 'block';
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (err) {
      alert('판매회원 정보 확인 또는 이메일 인증에 실패했어요.');
    }
  });

  // -----------------------------
  // 새 비밀번호 설정 (토큰 사용)
  // -----------------------------
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!resetToken) return alert('재설정 토큰이 없습니다. 다시 진행해주세요.');

    const pw  = document.getElementById('newPassword').value.trim();
    const pw2 = document.getElementById('confirmPassword').value.trim();
    if (!pw || !pw2) return alert('비밀번호를 입력해주세요.');
    if (pw !== pw2)  return alert('비밀번호가 일치하지 않습니다.');
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw)) {
      return alert('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
    }

    try {
      const res = await fetch('/auth/password/reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ token: resetToken, newPassword: pw })
      });
      if (!res.ok) throw new Error();

      resetSection.style.display   = 'none';
      successSection.style.display = 'block';
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (e2) {
      alert('비밀번호 변경에 실패했어요.');
    }
  });
});
