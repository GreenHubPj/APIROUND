// 아이디 찾기 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const memberTypeTabs = document.querySelectorAll('.member-type-tab');
    const individualFindIdForm = document.getElementById('individualFindIdForm');
    const sellerFindIdForm = document.getElementById('sellerFindIdForm');
    const findIdForm = document.getElementById('findIdForm');
    const findSellerIdForm = document.getElementById('findSellerIdForm');
    const resultSection = document.getElementById('resultSection');
    const foundUserId = document.getElementById('foundUserId');
    const joinDate = document.getElementById('joinDate');

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
                individualFindIdForm.style.display = 'block';
                sellerFindIdForm.style.display = 'none';
            } else if (type === 'seller') {
                individualFindIdForm.style.display = 'none';
                sellerFindIdForm.style.display = 'block';
            }
        });
    });

    // 개인 회원 아이디 찾기 폼 제출 처리
    findIdForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userName = document.getElementById('individualName').value.trim();
        const userEmail = document.getElementById('individualEmail').value.trim();
        const verificationCode = document.getElementById('individualVerification').value.trim();

        // 입력값 검증
        if (!userName || !userEmail || !verificationCode) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            return;
        }

        // 아이디 찾기 시뮬레이션
        findUserId(userName, userEmail, 'individual');
    });

    // 판매 회원 아이디 찾기 폼 제출 처리
    findSellerIdForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const companyName = document.getElementById('companyName').value.trim();
        const businessNumber = document.getElementById('businessNumber').value.trim();
        const contactName = document.getElementById('contactName').value.trim();
        const userEmail = document.getElementById('sellerEmail').value.trim();
        const verificationCode = document.getElementById('sellerVerification').value.trim();

        // 입력값 검증
        if (!companyName || !businessNumber || !contactName || !userEmail || !verificationCode) {
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

        // 아이디 찾기 시뮬레이션
        findUserId(contactName, userEmail, 'seller', companyName, businessNumber);
    });

    // 아이디 찾기 함수
    function findUserId(name, email, phone, type) {
        // 로딩 상태 표시
        const submitBtn = document.querySelector('.find-id-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '찾는 중...';
        submitBtn.disabled = true;

        // 시뮬레이션을 위한 지연
        setTimeout(() => {
            // 실제 환경에서는 서버 API를 호출해야 합니다
            // 여기서는 시뮬레이션 데이터를 사용합니다
            const mockResult = simulateFindUserId(name, email, phone, type);
            
            if (mockResult.success) {
                showResult(mockResult.userId, mockResult.joinDate);
            } else {
                alert('입력하신 정보와 일치하는 계정을 찾을 수 없습니다.\n다시 확인해주세요.');
            }

            // 버튼 상태 복원
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // 결과 표시 함수
    function showResult(userId, joinDateStr) {
        foundUserId.textContent = userId;
        joinDate.textContent = joinDateStr;
        resultSection.style.display = 'block';
        
        // 결과 섹션으로 스크롤
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 시뮬레이션 함수 (실제 환경에서는 제거하고 서버 API 사용)
    function simulateFindUserId(name, email, phone, type) {
        // 실제 환경에서는 서버에서 데이터베이스를 조회해야 합니다
        const mockUsers = [
            {
                name: '홍길동',
                email: 'hong@example.com',
                phone: '010-1234-5678',
                userId: 'hong123',
                joinDate: '2024-01-15',
                type: 'individual'
            },
            {
                name: '김철수',
                email: 'kim@example.com',
                phone: '010-9876-5432',
                userId: 'kim456',
                joinDate: '2024-02-20',
                type: 'seller'
            }
        ];

        const foundUser = mockUsers.find(user => 
            user.name === name && 
            user.email === email && 
            user.phone === phone &&
            user.type === type
        );

        if (foundUser) {
            return {
                success: true,
                userId: foundUser.userId,
                joinDate: foundUser.joinDate
            };
        } else {
            return { success: false };
        }
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
});
