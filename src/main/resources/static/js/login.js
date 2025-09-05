// 로그인 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 탭 전환 기능
    const memberTabs = document.querySelectorAll('.member-type-tab');
    const loginForm = document.getElementById('loginForm');
    const socialLoginSection = document.getElementById('socialLoginSection');
    
    memberTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 모든 탭에서 active 클래스 제거
            memberTabs.forEach(t => t.classList.remove('active'));
            // 클릭된 탭에 active 클래스 추가
            this.classList.add('active');
            
            // 탭에 따른 폼 변경
            const tabType = this.getAttribute('data-type');
            console.log('선택된 회원 유형:', tabType);
            
            // 판매회원 선택 시 소셜로그인 섹션 숨기기
            if (tabType === 'seller') {
                socialLoginSection.style.display = 'none';
            } else {
                socialLoginSection.style.display = 'block';
            }
        });
    });
    
    // 비밀번호 보기/숨기기 토글
    const passwordToggle = document.querySelector('.password-toggle');
    const passwordInput = document.getElementById('loginPassword');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            
            const img = this.querySelector('img');
            if (img) {
                img.src = isPassword ? '/images/뜬눈.png' : '/images/감은눈.png';
            }
        });
    }
    
    // 로그인 폼 제출
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const loginId = document.getElementById('loginId').value;
            const loginPassword = document.getElementById('loginPassword').value;
            const activeTab = document.querySelector('.member-type-tab.active');
            const memberType = activeTab ? activeTab.getAttribute('data-type') : 'individual';
            
            if (!loginId || !loginPassword) {
                alert('아이디와 비밀번호를 모두 입력해주세요.');
                return;
            }
            
            // 로그인 처리 (실제 구현시 서버와 연동)
            console.log('로그인 시도:', {
                id: loginId,
                password: loginPassword,
                memberType: memberType
            });
            
            // 임시 성공 메시지
            alert(`${memberType === 'individual' ? '개인 회원' : '판매 회원'} 로그인이 완료되었습니다.`);
            
            // 로그인 성공 후 메인 페이지로 이동
            window.location.href = '/';
        });
    }
    
    // 소셜 로그인 버튼
    const kakaoBtn = document.querySelector('.kakao-btn');
    const googleBtn = document.querySelector('.google-btn');
    
    if (kakaoBtn) {
        kakaoBtn.addEventListener('click', function() {
            alert('카카오 로그인 기능은 준비 중입니다.');
        });
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            alert('구글 로그인 기능은 준비 중입니다.');
        });
    }
    
    // 아이디/비밀번호 찾기 링크
    const forgotLinks = document.querySelectorAll('.forgot-link');
    forgotLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = this.textContent;
            alert(`${linkText} 기능은 준비 중입니다.`);
        });
    });
    
    console.log('로그인 페이지가 로드되었습니다.');
});
