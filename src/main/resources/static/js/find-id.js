// 아이디 찾기 페이지 JS (실동작 버전)
document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.member-type-tab');

  const individualSection = document.getElementById('individualFindIdForm');
  const sellerSection = document.getElementById('sellerFindIdForm');

  const findIdForm = document.getElementById('findIdForm');               // 개인
  const findSellerIdForm = document.getElementById('findSellerIdForm');   // 판매

  const resultSection = document.getElementById('resultSection');
  const foundUserId = document.getElementById('foundUserId');
  const joinDate = document.getElementById('joinDate');

  // 탭 전환
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.dataset.type;
      if (type === 'individual') {
        individualSection.style.display = 'block';
        sellerSection.style.display = 'none';
      } else {
        individualSection.style.display = 'none';
        sellerSection.style.display = 'block';
      }
    });
  });

  // 이메일 인증 전송 (개인/판매 공통 버튼)
  document.querySelectorAll('#individualFindIdForm .verification-btn, #sellerFindIdForm .verification-btn').forEach(btn => {
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
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            body: new URLSearchParams({ email })
          });
          const txt = (await res.text() || '').trim().toUpperCase();
          if (res.ok && (txt === 'OK' || txt === 'TRUE')) {
            alert('인증번호가 전송되었습니다. (5분 유효)');
            this.textContent = '재전송';
            this.classList.add('secondary');
          } else {
            alert('인증번호 전송에 실패했습니다.');
          }
        } catch {
          alert('인증번호 전송 중 오류가 발생했습니다.');
        } finally {
          setTimeout(()=> this.disabled = false, 1000);
        }
      });
    }
  });

  // 개인: 제출 → /api/account/find-id
  findIdForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('individualName').value.trim();
    const email = document.getElementById('individualEmail').value.trim();
    const code = document.getElementById('individualVerification').value.trim();
    if (!name || !email || !code) return alert('모든 필드를 입력해주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('올바른 이메일 형식을 입력해주세요.');

    // 서버에서는 isVerified만 체크하지만, UX를 위해 여기서도 검증 시도
    const verified = await verifyEmailCode(email, code);
    if (!verified) return alert('이메일 인증에 실패했습니다.');

    const btn = findIdForm.querySelector('.find-id-btn');
    btn.disabled = true; btn.textContent = '찾는 중...';
    try {
      const res = await fetch('/api/account/find-id', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({ name, email })
      });
      const data = await res.json();
      if (data.success) {
        showResult(data.userId, data.joinDate);
      } else {
        alert(data.message || '일치하는 계정을 찾을 수 없습니다.');
      }
    } catch {
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      btn.disabled = false; btn.textContent = '아이디 찾기';
    }
  });

  // 판매: 제출 → /api/account/find-id-company
  findSellerIdForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const companyName = document.getElementById('companyName').value.trim();
    const businessNumber = document.getElementById('businessNumber').value.trim();
    const managerName = document.getElementById('contactName').value.trim();
    const email = document.getElementById('sellerEmail').value.trim();
    const code = document.getElementById('sellerVerification').value.trim();

    if (!companyName || !businessNumber || !managerName || !email || !code) return alert('모든 필드를 입력해주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('올바른 이메일 형식을 입력해주세요.');
    if (!/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/.test(businessNumber)) return alert('사업자등록번호 형식이 올바르지 않습니다.');

    const verified = await verifyEmailCode(email, code);
    if (!verified) return alert('이메일 인증에 실패했습니다.');

    const btn = findSellerIdForm.querySelector('.find-id-btn');
    btn.disabled = true; btn.textContent = '찾는 중...';
    try {
      const res = await fetch('/api/account/find-id-company', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          companyName,
          businessNumber,
          managerName,
          email
        })
      });
      const data = await res.json();
      if (data.success) {
        showResult(data.userId, data.joinDate);
      } else {
        alert(data.message || '일치하는 판매자 계정을 찾을 수 없습니다.');
      }
    } catch {
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      btn.disabled = false; btn.textContent = '아이디 찾기';
    }
  });

  function showResult(id, dateStr) {
    foundUserId.textContent = id || '';
    joinDate.textContent = dateStr || '-';
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }

  async function verifyEmailCode(email, code) {
    try {
      const res = await fetch('/auth/email/verify', {
        method: 'POST',
        headers: {'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams({ email, code })
      });
      const ct = (res.headers.get('content-type')||'').toLowerCase();
      if (ct.includes('application/json')) {
        const ok = await res.json();
        return !!ok;
      } else {
        return ((await res.text())||'').trim().toLowerCase() === 'true';
      }
    } catch {
      return false;
    }
  }

  // 사업자번호 자동 포맷
  const businessInput = document.getElementById('businessNumber');
  businessInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 3) v = v.slice(0,3)+'-'+v.slice(3);
    if (v.length > 6) v = v.slice(0,6)+'-'+v.slice(6,11);
    e.target.value = v;
  });
});
