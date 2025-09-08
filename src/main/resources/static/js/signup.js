// 회원가입 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 회원 유형 탭 전환
    const memberTypeTabs = document.querySelectorAll('.member-type-tab');
    const individualForm = document.getElementById('individualForm');
    const sellerForm = document.getElementById('sellerForm');
    
    memberTypeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 탭 활성화
            memberTypeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 폼 전환
            const type = this.getAttribute('data-type');
            if (type === 'individual') {
                individualForm.style.display = 'block';
                sellerForm.style.display = 'none';
            } else if (type === 'seller') {
                individualForm.style.display = 'none';
                sellerForm.style.display = 'block';
            }
        });
    });
    
    // 비밀번호 보기/숨기기 토글
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const eyeImg = this.querySelector('img');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeImg.src = '/images/뜬눈.png';
            } else {
                passwordInput.type = 'password';
                eyeImg.src = '/images/감은눈.png';
            }
        });
    });
    
    // 전체 동의 체크박스
    const agreeAllCheckbox = document.getElementById('agreeAll');
    const requiredAgreements = document.querySelectorAll('.required-agreement');
    const optionalAgreements = document.querySelectorAll('.optional-agreement');
    
    agreeAllCheckbox.addEventListener('change', function() {
        const isChecked = this.checked;
        requiredAgreements.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        optionalAgreements.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
    
    // 개별 동의 체크박스 변경 시 전체 동의 상태 업데이트
    const allAgreements = document.querySelectorAll('.required-agreement, .optional-agreement');
    allAgreements.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedRequired = Array.from(requiredAgreements).every(cb => cb.checked);
            const checkedOptional = Array.from(optionalAgreements).every(cb => cb.checked);
            agreeAllCheckbox.checked = checkedRequired && checkedOptional;
        });
    });
    
    // 메시지 표시 함수
    function showMessage(messageElement, message, type = 'info') {
        messageElement.textContent = message;
        messageElement.className = `verification-message ${type}`;
        
        // 3초 후 메시지 자동 숨김 (성공/에러 메시지 제외)
        if (type === 'info' || type === 'warning') {
            setTimeout(() => {
                messageElement.textContent = '';
                messageElement.className = 'verification-message';
            }, 3000);
        }
    }

    // 인증번호 전송 버튼
    const verificationSendBtns = document.querySelectorAll('.verification-btn');
    verificationSendBtns.forEach(btn => {
        if (btn.textContent === '인증번호 전송') {
            btn.addEventListener('click', function() {
                const emailInput = this.parentElement.querySelector('input');
                const email = emailInput.value.trim();
                
                // 메시지 요소 찾기
                const messageElement = this.closest('.form-group').querySelector('.verification-message');
                
                if (!email) {
                    showMessage(messageElement, '이메일을 입력해주세요.', 'error');
                    return;
                }
                
                // 이메일 형식 검증
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showMessage(messageElement, '올바른 이메일 형식을 입력해주세요.', 'error');
                    return;
                }
                
                // 인증번호 전송 시뮬레이션
                showMessage(messageElement, '인증번호가 전송되었습니다. 이메일을 확인해주세요.', 'success');
                this.textContent = '재전송';
                this.classList.add('secondary');
            });
        }
    });
    
    // 인증번호 확인 버튼
    const verificationConfirmBtns = document.querySelectorAll('.verification-btn');
    verificationConfirmBtns.forEach(btn => {
        if (btn.textContent === '확인') {
            btn.addEventListener('click', function() {
                const verificationInput = this.parentElement.querySelector('input');
                const verificationCode = verificationInput.value.trim();
                
                // 메시지 요소 찾기
                const messageElement = this.closest('.form-group').querySelector('.verification-message');
                
                if (!verificationCode) {
                    showMessage(messageElement, '인증번호를 입력해주세요.', 'error');
                    return;
                }
                
                // 인증번호 확인 시뮬레이션
                showMessage(messageElement, '인증이 완료되었습니다.', 'success');
                this.textContent = '인증완료';
                this.style.background = '#4CAF50';
                this.disabled = true;
            });
        }
    });
    
    // 재전송 버튼
    const resendBtns = document.querySelectorAll('.verification-btn.secondary');
    resendBtns.forEach(btn => {
        if (btn.textContent === '재전송') {
            btn.addEventListener('click', function() {
                // 메시지 요소 찾기
                const messageElement = this.closest('.form-group').querySelector('.verification-message');
                showMessage(messageElement, '인증번호가 재전송되었습니다.', 'info');
            });
        }
    });
    
    // 소셜 로그인 버튼
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const socialType = this.textContent.includes('카카오') ? '카카오' : '구글';
            alert(`${socialType} 로그인 기능은 준비 중입니다.`);
        });
    });
    
    // 가입하기 버튼
    const signupBtn = document.querySelector('.signup-btn');
    signupBtn.addEventListener('click', function() {
        const activeTab = document.querySelector('.member-type-tab.active');
        const memberType = activeTab.getAttribute('data-type');
        
        // 필수 동의 항목 확인
        const checkedRequired = Array.from(requiredAgreements).every(cb => cb.checked);
        if (!checkedRequired) {
            alert('필수 동의 항목에 모두 동의해주세요.');
            return;
        }
        
        // 폼 유효성 검사
        if (memberType === 'individual') {
            validateIndividualForm();
        } else if (memberType === 'seller') {
            validateSellerForm();
        }
    });
    
    // 개인 회원 폼 유효성 검사
    function validateIndividualForm() {
        const name = document.getElementById('individualName').value.trim();
        const id = document.getElementById('individualId').value.trim();
        const password = document.getElementById('individualPassword').value.trim();
        const passwordConfirm = document.getElementById('individualPasswordConfirm').value.trim();
        const phone = document.getElementById('individualPhone').value.trim();
        
        if (!name || !id || !password || !passwordConfirm || !phone) {
            alert('모든 필수 항목을 입력해주세요.');
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
        
        // 가입 완료 시뮬레이션
        alert('개인 회원 가입이 완료되었습니다!');
        window.location.href = '/';
    }
    
    // 판매 회원 폼 유효성 검사
    function validateSellerForm() {
        const id = document.getElementById('sellerId').value.trim();
        const password = document.getElementById('sellerPassword').value.trim();
        const passwordConfirm = document.getElementById('sellerPasswordConfirm').value.trim();
        const companyName = document.getElementById('companyName').value.trim();
        const businessNumber = document.getElementById('businessNumber').value.trim();
        const contactName = document.getElementById('contactName').value.trim();
        const phone = document.getElementById('sellerPhone').value.trim();
        
        if (!id || !password || !passwordConfirm || !companyName || !businessNumber || !contactName || !phone) {
            alert('모든 필수 항목을 입력해주세요.');
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
        
        // 사업자등록번호 형식 검증
        const businessRegex = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
        if (!businessRegex.test(businessNumber)) {
            alert('올바른 사업자등록번호 형식을 입력해주세요. (예: 123-45-67890)');
            return;
        }
        
        // 가입 완료 시뮬레이션
        alert('판매 회원 가입이 완료되었습니다!');
        window.location.href = '/';
    }
    
    // 동의 항목 내용보기 링크
    const agreementLinks = document.querySelectorAll('.agreement-link');
    agreementLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            alert('이용약관 내용은 준비 중입니다.');
        });
    });
});
