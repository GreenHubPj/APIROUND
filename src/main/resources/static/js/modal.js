// 로그인 모달 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 모달 요소들
    const loginModal = document.getElementById('loginModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // 모달 열기
    function openModal() {
        if (loginModal) {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // 모달 닫기
    function closeModal() {
        if (loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    // 로그인 버튼 클릭 시 모달 열기 (이벤트 위임 사용)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-login') || e.target.closest('.btn-login')) {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        }
    });
    
    // 닫기 버튼 클릭 시 모달 닫기
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 모달 배경 클릭 시 모달 닫기
    if (loginModal) {
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                closeModal();
            }
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && loginModal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // 회원 유형 탭 전환
    const memberTabs = document.querySelectorAll('.member-tab');
    memberTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            memberTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
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
    
    // 로그인 폼 제출
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const memberType = document.querySelector('.member-tab.active').textContent;
            const id = document.getElementById('loginId').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!id || !password) {
                alert('아이디와 비밀번호를 입력해주세요.');
                return;
            }
            
            // 로그인 처리 (실제 구현 필요)
            console.log('로그인 시도:', { memberType, id, password });
            alert(`${memberType} 로그인이 완료되었습니다.`);
            closeModal();
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
    
    // 아이디/비밀번호 찾기
    const forgotLinks = document.querySelectorAll('.forgot-link');
    forgotLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = this.textContent;
            alert(`${linkText} 기능은 준비 중입니다.`);
        });
    });
});
