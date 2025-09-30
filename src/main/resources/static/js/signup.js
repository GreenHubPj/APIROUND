// signup.js (개인 + 판매 최종본)
(function () {
  // 탭 토글
  const tabs = document.querySelectorAll('.member-type-tab');
  const individualForm = document.getElementById('signupFormIndividual');
  const sellerForm = document.getElementById('signupFormSeller');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.getAttribute('data-type');
      if (type === 'individual') {
        individualForm.style.display = '';
        sellerForm.style.display = 'none';
      } else {
        individualForm.style.display = 'none';
        sellerForm.style.display = '';
      }
    });
  });

  // 비밀번호 보기 토글(전체)
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  // 공통 비밀번호 정책 (서버와 최대한 일치)
  // - 영문: /[A-Za-z]/
  // - 숫자: /\d/
  // - 특수: ASCII 구두점(언더스코어 포함) → 정규식 범위 [!-/:-@[-`{-~]
  function isStrong(pw) {
    if (!pw || pw.length < 8) return false;
    const hasLetter  = /[A-Za-z]/.test(pw);
    const hasDigit   = /\d/.test(pw);
    const hasSpecial = /[!-/:-@[-`{-~]/.test(pw); // !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
    return hasLetter && hasDigit && hasSpecial;
  }
  const policyMsg = "비밀번호는 8자 이상이며, 영문/숫자/특수문자를 각각 1자 이상 포함해야 합니다.";

  // ───────── 개인 이메일 인증
  const sendBtn    = document.getElementById('sendEmailCodeBtn');
  const verifyBtn  = document.getElementById('verifyEmailCodeBtn');
  const emailInput = document.getElementById('individualEmail');
  const codeInput  = document.getElementById('emailCode');
  const emailMsg   = document.getElementById('individualEmailMessage');
  let emailVerified = false;
  let lastSentTo = '';

  function setMsg(el, text, cls) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'verification-message ' + (cls || '');
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      emailVerified = false;
      if (codeInput) { codeInput.removeAttribute('disabled'); codeInput.value = ''; }
      if (verifyBtn) verifyBtn.removeAttribute('disabled');
      setMsg(emailMsg, '', '');
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      const email = (emailInput.value || '').trim();
      if (!email) { setMsg(emailMsg, '이메일을 입력해주세요.', 'error'); emailInput.focus(); return; }
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
          setMsg(emailMsg, '인증번호가 발송되었습니다. 메일함(스팸함 포함)을 확인해 주세요.', 'info');
        } else {
          setMsg(emailMsg, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
      } catch {
        setMsg(emailMsg, '인증번호 발송 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { sendBtn.disabled = false; }, 1200);
      }
    });
  }

  if (verifyBtn) {
    verifyBtn.addEventListener('click', async () => {
      const email = (emailInput.value || '').trim();
      const code  = (codeInput.value  || '').trim();
      if (!email) { setMsg(emailMsg, '이메일을 입력해주세요.', 'error'); emailInput.focus(); return; }
      if (!code)  { setMsg(emailMsg, '인증번호를 입력해주세요.', 'error'); codeInput.focus(); return; }
      if (lastSentTo && lastSentTo !== email) {
        setMsg(emailMsg, '최근 전송한 이메일 주소와 다릅니다. 다시 인증번호를 전송해주세요.', 'warning');
        return;
      }
      verifyBtn.disabled = true;
      try {
        const res = await fetch('/auth/email/verify', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({ email, code })
        });
        let ok = false;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) ok = !!(await res.json());
        else ok = ((await res.text()) || '').trim().toLowerCase() === 'true';

        if (ok) {
          emailVerified = true;
          setMsg(emailMsg, '이메일 인증이 완료되었습니다.', 'success');
          if (codeInput) codeInput.setAttribute('disabled', 'disabled');
        } else {
          emailVerified = false;
          setMsg(emailMsg, '인증번호가 올바르지 않거나 만료되었습니다.', 'error');
        }
      } catch {
        emailVerified = false;
        setMsg(emailMsg, '인증 처리 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { verifyBtn.disabled = false; }, 800);
      }
    });
  }

  // ───────── 판매(회사) 이메일 인증
  const sendSellerBtn    = document.getElementById('sendCompanyEmailCodeBtn');
  const verifySellerBtn  = document.getElementById('verifyCompanyEmailCodeBtn');
  const companyEmailInput= document.getElementById('companyEmail');
  const companyCodeInput = document.getElementById('companyEmailCode');
  const companyEmailMsg  = document.getElementById('companyEmailMessage');
  let companyEmailVerified = false;
  let lastCompanySentTo = '';

  if (companyEmailInput) {
    companyEmailInput.addEventListener('input', () => {
      companyEmailVerified = false;
      if (companyCodeInput) { companyCodeInput.removeAttribute('disabled'); companyCodeInput.value = ''; }
      if (verifySellerBtn) verifySellerBtn.removeAttribute('disabled');
      setMsg(companyEmailMsg, '', '');
    });
  }

  if (sendSellerBtn) {
    sendSellerBtn.addEventListener('click', async () => {
      const email = (companyEmailInput.value || '').trim();
      if (!email) { setMsg(companyEmailMsg, '회사 이메일을 입력해주세요.', 'error'); companyEmailInput.focus(); return; }
      sendSellerBtn.disabled = true;
      try {
        const res = await fetch('/auth/email/send', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({ email })
        });
        const text = (await res.text() || '').trim().toUpperCase();
        if (res.ok && (text === 'OK' || text === 'TRUE')) {
          lastCompanySentTo = email;
          companyEmailVerified = false;
          if (companyCodeInput) companyCodeInput.value = '';
          setMsg(companyEmailMsg, '인증번호가 발송되었습니다. 메일함(스팸함 포함)을 확인해 주세요.', 'info');
        } else {
          setMsg(companyEmailMsg, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
      } catch {
        setMsg(companyEmailMsg, '인증번호 발송 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { sendSellerBtn.disabled = false; }, 1200);
      }
    });
  }

  if (verifySellerBtn) {
    verifySellerBtn.addEventListener('click', async () => {
      const email = (companyEmailInput.value || '').trim();
      const code  = (companyCodeInput.value  || '').trim();
      if (!email) { setMsg(companyEmailMsg, '회사 이메일을 입력해주세요.', 'error'); companyEmailInput.focus(); return; }
      if (!code)  { setMsg(companyEmailMsg, '인증번호를 입력해주세요.', 'error'); companyCodeInput.focus();  return; }
      if (lastCompanySentTo && lastCompanySentTo !== email) {
        setMsg(companyEmailMsg, '최근 전송한 이메일 주소와 다릅니다. 다시 인증번호를 전송해주세요.', 'warning');
        return;
      }
      verifySellerBtn.disabled = true;
      try {
        const res = await fetch('/auth/email/verify', {
          method: 'POST',
          headers: {'Content-Type':'application/x-www-form-urlencoded'},
          body: new URLSearchParams({ email, code })
        });
        let ok = false;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (ct.includes('application/json')) ok = !!(await res.json());
        else ok = ((await res.text()) || '').trim().toLowerCase() === 'true';

        if (ok) {
          companyEmailVerified = true;
          setMsg(companyEmailMsg, '회사 이메일 인증이 완료되었습니다.', 'success');
          if (companyCodeInput) companyCodeInput.setAttribute('disabled', 'disabled');
        } else {
          companyEmailVerified = false;
          setMsg(companyEmailMsg, '인증번호가 올바르지 않거나 만료되었습니다.', 'error');
        }
      } catch {
        companyEmailVerified = false;
        setMsg(companyEmailMsg, '인증 처리 중 오류가 발생했습니다.', 'error');
      } finally {
        setTimeout(() => { verifySellerBtn.disabled = false; }, 800);
      }
    });
  }

  // ───────── 약관(개인)
  const agreeAll = document.getElementById('agreeAll');
  const requiredAgreements = document.querySelectorAll('.required-agreement');
  if (agreeAll) {
    agreeAll.addEventListener('change', () => {
      const checked = agreeAll.checked;
      requiredAgreements.forEach(cb => cb.checked = checked);
      document.querySelectorAll('.optional-agreement').forEach(cb => cb.checked = checked);
    });
  }

  // ───────── 개인 폼 검증/제출
  const individualSubmitForm = document.getElementById('signupFormIndividual');
  individualSubmitForm.addEventListener('submit', (e) => {
    const name = document.getElementById('individualName').value.trim();
    const loginId = document.getElementById('individualId').value.trim();
    const pw = document.getElementById('individualPassword').value;
    const pw2 = document.getElementById('individualPasswordConfirm').value;
    const email = (document.getElementById('individualEmail').value || '').trim();
    const phone = document.getElementById('individualPhone').value.trim();

    let allRequiredAgreed = true;
    requiredAgreements.forEach(cb => { if (!cb.checked) allRequiredAgreed = false; });
    if (!allRequiredAgreed) { e.preventDefault(); alert('필수 약관에 동의해주세요.'); return; }

    if (!name || !loginId || !pw || !pw2 || !email || !phone) { e.preventDefault(); alert('필수 항목을 모두 입력해주세요.'); return; }
    if (pw !== pw2) { e.preventDefault(); alert('비밀번호가 일치하지 않습니다.'); return; }
    if (loginId.length < 4) { e.preventDefault(); alert('아이디는 4자 이상이어야 합니다.'); return; }
    if (!isStrong(pw)) { e.preventDefault(); alert(policyMsg); return; }

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

  // ───────── 판매 폼 검증/제출
  const sellerSubmitForm = document.getElementById('signupFormSeller');
  sellerSubmitForm.addEventListener('submit', (e) => {
    const companyName = document.getElementById('companyName').value.trim();
    const loginId = document.getElementById('sellerLoginId').value.trim();
    const pw = document.getElementById('sellerPassword').value;
    const pw2 = document.getElementById('sellerPasswordConfirm').value;
    const brn = document.getElementById('businessRegistrationNumber').value.trim();
    const email = (document.getElementById('companyEmail').value || '').trim();
    const managerName = document.getElementById('managerName').value.trim();
    const managerPhone = document.getElementById('managerPhone').value.trim();

    if (!companyName || !loginId || !pw || !pw2 || !brn || !email || !managerName || !managerPhone) {
      e.preventDefault(); alert('필수 항목을 모두 입력해주세요.'); return;
    }
    if (pw !== pw2) { e.preventDefault(); alert('비밀번호가 일치하지 않습니다.'); return; }
    if (loginId.length < 4) { e.preventDefault(); alert('아이디는 4자 이상이어야 합니다.'); return; }
    if (!isStrong(pw)) { e.preventDefault(); alert(policyMsg); return; }

    if (!companyEmailVerified) { e.preventDefault(); alert('회사 이메일 인증을 완료해주세요.'); return; }

    // 사업자번호 간단 포맷 정리
    document.getElementById('businessRegistrationNumber').value = brn.replace(/\s/g, '');
  });
})();
