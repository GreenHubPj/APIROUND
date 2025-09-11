// 회원가입 페이지 JavaScript (서버 연동 버전)
document.addEventListener('DOMContentLoaded', function () {
  // 탭 전환
  const memberTypeTabs = document.querySelectorAll('.member-type-tab');
  const individualForm = document.getElementById('individualForm');
  const sellerForm = document.getElementById('sellerForm');

  memberTypeTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      memberTypeTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const type = this.getAttribute('data-type');
      if (type === 'individual') {
        individualForm.style.display = 'block';
        sellerForm.style.display = 'none';
      } else {
        individualForm.style.display = 'none';
        sellerForm.style.display = 'block';
      }
    });
  });

  // 비밀번호 보기/숨기기
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const input = this.parentElement.querySelector('input');
      const eye = this.querySelector('img');
      if (input.type === 'password') {
        input.type = 'text';
        eye.src = '/images/뜬눈.png';
      } else {
        input.type = 'password';
        eye.src = '/images/감은눈.png';
      }
    });
  });

  // 전체동의
  const agreeAll = document.getElementById('agreeAll');
  const requiredAgreements = document.querySelectorAll('.required-agreement');
  const optionalAgreements = document.querySelectorAll('.optional-agreement');

  agreeAll.addEventListener('change', function () {
    const checked = this.checked;
    [...requiredAgreements, ...optionalAgreements].forEach(cb => (cb.checked = checked));
  });

  [...requiredAgreements, ...optionalAgreements].forEach(cb => {
    cb.addEventListener('change', function () {
      const reqOk = Array.from(requiredAgreements).every(r => r.checked);
      const optOk = Array.from(optionalAgreements).every(o => o.checked);
      agreeAll.checked = reqOk && optOk;
    });
  });

  // 가입하기
  document.getElementById('signupBtn').addEventListener('click', async function () {
    // 개인/판매 탭 중 활성화 확인
    const activeTab = document.querySelector('.member-type-tab.active');
    const memberType = activeTab ? activeTab.getAttribute('data-type') : 'individual';
    if (memberType !== 'individual') {
      alert('현재는 개인 회원만 가입 처리됩니다.');
      return;
    }

    // 필수 동의 확인
    const requiredOk = Array.from(requiredAgreements).every(cb => cb.checked);
    if (!requiredOk) {
      alert('필수 동의 항목에 모두 동의해주세요.');
      return;
    }

    // 입력값 수집
    const name = (document.getElementById('individualName').value || '').trim();
    const loginId = (document.getElementById('individualId').value || '').trim();
    const password = (document.getElementById('individualPassword').value || '').trim();
    const passwordConfirm = (document.getElementById('individualPasswordConfirm').value || '').trim();
    const email = (document.getElementById('individualEmail').value || '').trim();
    const phone = (document.getElementById('individualPhone').value || '').trim();
    const gender = (document.getElementById('gender').value || '').trim();
    const birthDate = (document.getElementById('birthDate').value || '').trim();

    // 유효성 검사(최소)
    if (!name || !loginId || !password || !passwordConfirm || !email || !phone) {
      alert('별표(*) 표시된 필수 항목을 모두 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 8) {
      alert('비밀번호는 8자 이상 입력해주세요.');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    // 서버 전송
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          loginId,
          password,
          name,
          email,
          phone,
          gender: gender || null,
          birthDate: birthDate || null
        })
      });

      if (res.ok) {
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        window.location.href = '/login';
        return;
      }

      // 에러 메시지 처리
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        alert(data.message || '이미 사용 중인 아이디/이메일입니다.');
      } else if (res.status === 400) {
        alert(data.message || '입력값이 올바르지 않습니다.');
      } else {
        alert(data.message || '회원가입 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  });

  // (옵션) 인증번호 전송 버튼은 안내만 유지
  const sendCodeBtn = document.getElementById('sendEmailCodeBtn');
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener('click', () => {
      const email = (document.getElementById('individualEmail').value || '').trim();
      if (!email) return alert('이메일을 입력해주세요.');
      alert('인증번호 전송은 데모 상태입니다.');
    });
  }
});
