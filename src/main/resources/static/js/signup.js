// signup.js (최종본)
(function () {
  // 탭 토글
  const tabs = document.querySelectorAll('.member-type-tab');
  const individual = document.getElementById('individualForm');
  const seller = document.getElementById('sellerForm');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.getAttribute('data-type');
      if (type === 'individual') {
        individual.style.display = '';
        seller.style.display = 'none';
      } else {
        individual.style.display = 'none';
        seller.style.display = '';
      }
    });
  });

  // 비밀번호 보기 토글
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // --- 이메일 인증 ---
  const sendBtn    = document.getElementById('sendEmailCodeBtn');
  const verifyBtn  = document.getElementById('verifyEmailCodeBtn');
  const emailInput = document.getElementById('individualEmail');
  const codeInput  = document.getElementById('emailCode');
  const emailMsg   = document.getElementById('individualEmailMessage');
  let emailVerified = false;
  let lastSentTo = '';

  function setMsg(text, cls) {
    emailMsg.textContent = text || '';
    emailMsg.className = 'verification-message ' + (cls || '');
  }

  // 이메일 변경 시 인증상태 초기화
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailVerified = false;
      if (codeInput) {
        codeInput.removeAttribute('disabled');
        codeInput.value = '';
      }
      if (verifyBtn) verifyBtn.removeAttribute('disabled');
      setMsg('', '');
    });
  }

  // 인증번호 전송
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const email = (emailInput.value || '').trim();
      if (!email) {
        setMsg('이메일을 입력해주세요.', 'error');
        emailInput.focus();
        return;
      }
      sendBtn.disabled = true;
      try {
        const res = await fetch('/auth/email/send', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({ email })
        });
        const text = (await res.text() || '').trim().toUpperCase();
        if (res.ok && (text === 'OK' || text === 'TRUE')) {
          lastSentTo = email;
          emailVerified = false;
          if (codeInput) codeInput.value = '';
          setMsg('인증번호가 발송되었습니다. 메일함(스팸함 포함)을 확인해 주세요.', 'info');
        } else {
          setMsg('인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
      } catch (e) {
        setMsg('인증번호 발송 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { sendBtn.disabled = false; }, 1200);
      }
    });
  }

  // 인증번호 확인
  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const email = (emailInput.value || '').trim();
      const code  = (codeInput.value  || '').trim();
      if (!email) { setMsg('이메일을 입력해주세요.', 'error'); emailInput.focus(); return; }
      if (!code)  { setMsg('인증번호를 입력해주세요.', 'error'); codeInput.focus();  return; }
      if (lastSentTo && lastSentTo !== email) {
        setMsg('최근 전송한 이메일 주소와 다릅니다. 다시 인증번호를 전송해주세요.', 'warning');
        return;
      }

      verifyBtn.disabled = true;
      try {
        const res = await fetch('/auth/email/verify', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({ email, code })
        });

        // JSON boolean 또는 텍스트 'true' 모두 처리
        let ok = false;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) {
          ok = !!(await res.json());
        } else {
          ok = ((await res.text()) || '').trim().toLowerCase() === 'true';
        }

        if (ok) {
          emailVerified = true;
          setMsg('이메일 인증이 완료되었습니다.', 'success');
          codeInput.setAttribute('disabled', 'disabled');
        } else {
          emailVerified = false;
          setMsg('인증번호가 올바르지 않거나 만료되었습니다.', 'error');
        }
      } catch (e) {
        emailVerified = false;
        setMsg('인증 처리 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { verifyBtn.disabled = false; }, 800);
      }
    });
  }

  // 모두 동의 체크
  const agreeAll = document.getElementById('agreeAll');
  const requiredAgreements = document.querySelectorAll('.required-agreement');
  if (agreeAll) {
    agreeAll.addEventListener('change', () => {
      const checked = agreeAll.checked;
      requiredAgreements.forEach(cb => cb.checked = checked);
      document.querySelectorAll('.optional-agreement').forEach(cb => cb.checked = checked);
    });
  }

  // 제출 전 검증 + 선택동의 hidden 채움
  const form = document.getElementById('signupForm');
  form.addEventListener('submit', (e) => {
    const name = document.getElementById('individualName').value.trim();
    const loginId = document.getElementById('individualId').value.trim();
    const pw = document.getElementById('individualPassword').value;
    const pw2 = document.getElementById('individualPasswordConfirm').value;
    const email = (emailInput.value || '').trim();
    const phone = document.getElementById('individualPhone').value.trim();

    let allRequiredAgreed = true;
    requiredAgreements.forEach(cb => { if (!cb.checked) allRequiredAgreed = false; });
    if (!allRequiredAgreed) { e.preventDefault(); alert('필수 약관에 동의해주세요.'); return; }

    if (!name || !loginId || !pw || !pw2 || !email || !phone) { e.preventDefault(); alert('필수 항목을 모두 입력해주세요.'); return; }
    if (pw !== pw2) { e.preventDefault(); alert('비밀번호가 일치하지 않습니다.'); return; }
    if (loginId.length < 4) { e.preventDefault(); alert('아이디는 4자 이상이어야 합니다.'); return; }
    if (pw.length < 6) { e.preventDefault(); alert('비밀번호는 6자 이상이어야 합니다.'); return; }

    if (!emailVerified) { e.preventDefault(); alert('이메일 인증을 완료해주세요.'); return; }

    const optChecks = document.querySelectorAll('.optional-agreement');
    let marketing = false, sms = false;
    optChecks.forEach(cb => {
      const key = cb.getAttribute('data-name');
      if (key === 'marketingConsent') marketing = cb.checked;
      if (key === 'smsConsent') sms = cb.checked;
    });
    document.getElementById('marketingConsentHidden').value = marketing ? 'true' : 'false';
    document.getElementById('smsConsentHidden').value = sms ? 'true' : 'false';
  });
})();
