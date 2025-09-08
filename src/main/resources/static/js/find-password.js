// 비밀번호 찾기 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const memberTypeTabs = document.querySelectorAll('.member-type-tab');
    const individualFindPasswordForm = document.getElementById('individualFindPasswordForm');
    const sellerFindPasswordForm = document.getElementById('sellerFindPasswordForm');
    const findPasswordForm = document.getElementById('findPasswordForm');
    const findSellerPasswordForm = document.getElementById('findSellerPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetPasswordSection = document.getElementById('resetPasswordSection');
    const successSection = document.getElementById('successSection');

    // 회원 유형 탭 전환
    memberTypeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 모든 탭에서 active 클래스 제거
            memberTypeTabs.forEach(t => t.classList.remove('active'));
            // 클릭된 탭에 active 클래스 추가
            this.classList.add('active');
            
            // 폼 전환
            const type = this.getAttribute('data-type');
            if (type === 'individual') {
                individualFindPasswordForm.style.display = 'block';
                sellerFindPasswordForm.style.display = 'none';
            } else if (type === 'seller') {
                individualFindPasswordForm.style.display = 'none';
                sellerFindPasswordForm.style.display = 'block';
            }
        });
    });

    // 개인 회원 비밀번호 찾기 폼 제출 처리
    findPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('individualUserId').value.trim();
        const userName = document.getElementById('individualName').value.trim();
        const userEmail = document.getElementById('individualEmail').value.trim();
        const verificationCode = document.getElementById('individualVerification').value.trim();

        // 입력값 검증
        if (!userId || !userName || !userEmail || !verificationCode) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        // 사용자 인증 시뮬레이션
        verifyUser(userId, userName, userEmail, 'individual');
    });

    // 판매 회원 비밀번호 찾기 폼 제출 처리
    findSellerPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userId = document.getElementById('sellerUserId').value.trim();
        const companyName = document.getElementById('companyName').value.trim();
        const businessNumber = document.getElementById('businessNumber').value.trim();
        const contactName = document.getElementById('contactName').value.trim();
        const userEmail = document.getElementById('sellerEmail').value.trim();
        const verificationCode = document.getElementById('sellerVerification').value.trim();

        // 입력값 검증
        if (!userId || !companyName || !businessNumber || !contactName || !userEmail || !verificationCode) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        // 사업자등록번호 형식 검증
        const businessRegex = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
        if (!businessRegex.test(businessNumber)) {
            alert('올바른 사업자등록번호 형식을 입력해주세요. (예: 123-45-67890)');
            return;
        }

        // 사용자 인증 시뮬레이션
        verifyUser(userId, contactName, userEmail, 'seller', companyName, businessNumber);
    });

    // 비밀번호 재설정 폼 제출 처리
    resetPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 비밀번호 검증
        if (!validatePassword(newPassword)) {
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 변경 시뮬레이션
        changePassword(newPassword);
    });

    // 사용자 인증 함수
    function verifyUser(userId, name, email, phone, type) {
        const submitBtn = document.querySelector('.find-password-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '인증 중...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // 실제 환경에서는 서버 API를 호출해야 합니다
            const mockResult = simulateUserVerification(userId, name, email, phone, type);
            
            if (mockResult.success) {
                showResetPasswordSection();
            } else {
                alert('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.\n다시 확인해주세요.');
            }

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // 비밀번호 재설정 섹션 표시
    function showResetPasswordSection() {
        resetPasswordSection.style.display = 'block';
        resetPasswordSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 비밀번호 변경 함수
    function changePassword(newPassword) {
        const submitBtn = document.querySelector('.reset-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '변경 중...';
        submitBtn.disabled = true;

        setTimeout(() => {
            // 실제 환경에서는 서버 API를 호출해야 합니다
            const mockResult = simulatePasswordChange(newPassword);
            
            if (mockResult.success) {
                showSuccessSection();
            } else {
                alert('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
            }

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // 성공 섹션 표시
    function showSuccessSection() {
        successSection.style.display = 'block';
        successSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 비밀번호 유효성 검사
    function validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return false;
        }

        if (!hasUpperCase || !hasLowerCase) {
            alert('비밀번호는 대문자와 소문자를 포함해야 합니다.');
            return false;
        }

        if (!hasNumbers) {
            alert('비밀번호는 숫자를 포함해야 합니다.');
            return false;
        }

        if (!hasSpecialChar) {
            alert('비밀번호는 특수문자를 포함해야 합니다.');
            return false;
        }

        return true;
    }

    // 시뮬레이션 함수들 (실제 환경에서는 제거하고 서버 API 사용)
    function simulateUserVerification(userId, name, email, phone, type) {
        const mockUsers = [
            {
                userId: 'hong123',
                name: '홍길동',
                email: 'hong@example.com',
                phone: '010-1234-5678',
                type: 'individual'
            },
            {
                userId: 'kim456',
                name: '김철수',
                email: 'kim@example.com',
                phone: '010-9876-5432',
                type: 'seller'
            }
        ];

        const foundUser = mockUsers.find(user => 
            user.userId === userId &&
            user.name === name && 
            user.email === email && 
            user.phone === phone &&
            user.type === type
        );

        return { success: !!foundUser };
    }

    function simulatePasswordChange(newPassword) {
        // 실제 환경에서는 서버에서 비밀번호를 업데이트해야 합니다
        console.log('새 비밀번호:', newPassword);
        return { success: true };
    }

    // 인증번호 전송 버튼
    const verificationSendBtns = document.querySelectorAll('.verification-btn');
    verificationSendBtns.forEach(btn => {
        if (btn.textContent === '인증번호 전송') {
            btn.addEventListener('click', function() {
                const emailInput = this.parentElement.querySelector('input');
                const email = emailInput.value.trim();
                
                if (!email) {
                    alert('이메일을 입력해주세요.');
                    return;
                }
                
                // 이메일 형식 검증
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    alert('올바른 이메일 형식을 입력해주세요.');
                    return;
                }
                
                // 인증번호 전송 시뮬레이션
                alert('인증번호가 전송되었습니다.');
                this.textContent = '재전송';
                this.classList.add('secondary');
            });
        }
    });
    
    // 인증번호 확인 버튼
    verificationSendBtns.forEach(btn => {
        if (btn.textContent === '확인') {
            btn.addEventListener('click', function() {
                const verificationInput = this.parentElement.querySelector('input');
                const verificationCode = verificationInput.value.trim();
                
                if (!verificationCode) {
                    alert('인증번호를 입력해주세요.');
                    return;
                }
                
                // 인증번호 확인 시뮬레이션
                alert('인증이 완료되었습니다.');
                this.textContent = '인증완료';
                this.style.background = '#4CAF50';
                this.disabled = true;
            });
        }
    });
    
    // 재전송 버튼
    verificationSendBtns.forEach(btn => {
        if (btn.textContent === '재전송') {
            btn.addEventListener('click', function() {
                alert('인증번호가 재전송되었습니다.');
            });
        }
    });

    // 사업자등록번호 자동 포맷팅
    const businessNumberInput = document.getElementById('businessNumber');
    if (businessNumberInput) {
        businessNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // 숫자만 추출
            if (value.length >= 3) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            }
            if (value.length >= 6) {
                value = value.substring(0, 6) + '-' + value.substring(6, 11);
            }
            e.target.value = value;
        });
    }

    // 비밀번호 보기/숨기기 토글
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const img = this.querySelector('img');
            
            if (input.type === 'password') {
                input.type = 'text';
                img.src = '/images/뜬눈.png'; // 눈 뜬 아이콘으로 변경
            } else {
                input.type = 'password';
                img.src = '/images/감은눈.png'; // 눈 감은 아이콘으로 변경
            }
        });
    });

    // 비밀번호 강도 표시 (선택사항)
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthIndicator = document.getElementById('passwordStrength');
            
            if (strengthIndicator) {
                const strength = calculatePasswordStrength(password);
                strengthIndicator.textContent = strength.text;
                strengthIndicator.className = `password-strength ${strength.level}`;
            }
        });
    }

    // 비밀번호 강도 계산
    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

        if (score < 3) {
            return { level: 'weak', text: '약함' };
        } else if (score < 5) {
            return { level: 'medium', text: '보통' };
        } else {
            return { level: 'strong', text: '강함' };
        }
    }
});
