// 탭 전환 (디자인)
document.querySelectorAll('.member-type-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.member-type-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.dataset.type;
    document.getElementById('individualForm').style.display = (type === 'individual') ? 'block' : 'none';
    document.getElementById('sellerForm').style.display = (type === 'seller') ? 'block' : 'none';
  });
});

// 전체 동의
const agreeAll = document.getElementById('agreeAll');
agreeAll.addEventListener('change', () => {
  document.querySelectorAll('.required-agreement, .optional-agreement').forEach(chk => {
    chk.checked = agreeAll.checked;
  });
});

// 이메일 인증 버튼(데모)
document.getElementById('sendEmailCodeBtn').addEventListener('click', () => {
  const email = document.getElementById('individualEmail').value.trim();
  const msg = document.getElementById('individualEmailMessage');
  if (!email) {
    msg.textContent = '이메일을 먼저 입력해 주세요.';
    msg.style.color = 'red';
    return;
  }
  msg.textContent = '인증번호를 전송했습니다. (데모)';
  msg.style.color = 'green';
});

// 가입하기
document.getElementById('signupBtn').addEventListener('click', async () => {
  // 필수 약관 확인
  const required = Array.from(document.querySelectorAll('.required-agreement'));
  if (!required.every(chk => chk.checked)) {
    alert('필수 약관에 모두 동의해야 합니다.');
    return;
  }

  // 입력값 수집
  const name = document.getElementById('individualName').value.trim();
  const loginId = document.getElementById('individualId').value.trim();
  const password = document.getElementById('individualPassword').value;
  const passwordConfirm = document.getElementById('individualPasswordConfirm').value;
  const email = document.getElementById('individualEmail').value.trim();
  const phone = document.getElementById('individualPhone').value.trim();
  const gender = document.getElementById('gender').value || null;
  const birthDate = document.getElementById('birthDate').value || null;
  const marketingConsent = document.getElementById('marketingEmailConsent').checked;
  const smsConsent = document.getElementById('marketingSmsConsent').checked;

  if (!name || !loginId || !password || !email || !phone) {
    alert('필수 입력값을 확인해 주세요.');
    return;
  }
  if (password !== passwordConfirm) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  const payload = {
    name, loginId, password, email, phone, gender, birthDate,
    marketingConsent, smsConsent
  };

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
      window.location.href = '/login';
    } else {
      alert(data.message || '회원가입 처리 중 오류가 발생했습니다.');
    }
  } catch (e) {
    alert('네트워크 오류가 발생했습니다.');
  }
});
