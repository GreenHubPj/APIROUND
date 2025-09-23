// 업체 마이페이지 JavaScript (서버 렌더 데이터 사용)
document.addEventListener('DOMContentLoaded', function() {
    // 모듈 클릭 이벤트 처리
    const moduleItems = document.querySelectorAll('.module-item');

    moduleItems.forEach(item => {
        item.addEventListener('click', function() {
            const moduleType = this.getAttribute('data-module');
            handleModuleClick(moduleType);
        });

        // 호버 효과
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 모듈 클릭 처리
    function handleModuleClick(moduleType) {
        switch(moduleType) {
            case 'orders':
                window.location.href = '/customerOrder';
                break;
            case 'delivery':
                showDevelopmentAlert('배송건');
                break;
            case 'reviews':
                window.location.href = '/review-management';
                break;
            case 'company-edit':
                window.location.href = '/profile-edit-company';
                break;
            case 'refund':
                showDevelopmentAlert('환불처리');
                break;
            case 'products':
                window.location.href = '/item-management';
                break;
            case 'email-notification':
                openEmailModal();
                break;
            case 'recipe-management':
                window.location.href = '/admin/recipe-management';
                break;
            default:
                console.log('알 수 없는 모듈:', moduleType);
        }
    }

    // 개발중 알림 표시 함수
    function showDevelopmentAlert(featureName) {
        // 기존 알림이 있다면 제거
        const existingAlert = document.querySelector('.development-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // 알림 요소 생성
        const alertDiv = document.createElement('div');
        alertDiv.className = 'development-alert';
        alertDiv.innerHTML = `
            <div class="alert-content">
                <div class="alert-icon">🚧</div>
                <div class="alert-text">
                    <h3>${featureName} 기능</h3>
                    <p>현재 개발중입니다.<br>곧 만나보실 수 있습니다!</p>
                </div>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // 스타일 적용
        alertDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .development-alert .alert-content {
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                position: relative;
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .development-alert .alert-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }
            .development-alert .alert-text h3 {
                color: #2c5530;
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
            }
            .development-alert .alert-text p {
                color: #666;
                margin: 0;
                line-height: 1.5;
            }
            .development-alert .alert-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .development-alert .alert-close:hover {
                background: #f5f5f5;
                color: #333;
            }
        `;
        document.head.appendChild(style);

        // body에 추가
        document.body.appendChild(alertDiv);

        // 배경 클릭 시 닫기
        alertDiv.addEventListener('click', function(e) {
            if (e.target === alertDiv) {
                alertDiv.remove();
            }
        });

        // ESC 키로 닫기
        const handleEsc = function(e) {
            if (e.key === 'Escape') {
                alertDiv.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // 이메일 모달 관련 JavaScript - 전역 스코프로 이동
    window.openEmailModal = function() {
        document.getElementById('emailModal').style.display = 'flex';
        checkRecipients();
    }

    window.closeEmailModal = function() {
        document.getElementById('emailModal').style.display = 'none';
        document.getElementById('emailForm').reset();
    }

    // 수신자 수 확인
    async function checkRecipients() {
        try {
            const response = await fetch('/api/admin/email/recipients');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('recipientCount').textContent = data.count;
            } else {
                document.getElementById('recipientCount').textContent = '0';
                console.error('수신자 조회 실패:', data.message);
            }
        } catch (error) {
            console.error('수신자 조회 에러:', error);
            document.getElementById('recipientCount').textContent = '0';
        }
    }

    // 수신자 확인 버튼
    document.getElementById('checkRecipientsBtn').addEventListener('click', async function() {
        try {
            const response = await fetch('/api/admin/email/recipients');
            const data = await response.json();
            
            if (data.success) {
                const userList = data.users.map(user => `${user.name} (${user.email})`).join('\n');
                alert(`SMS 동의 고객 ${data.count}명:\n\n${userList}`);
            } else {
                alert('수신자 목록을 불러올 수 없습니다: ' + data.message);
            }
        } catch (error) {
            alert('수신자 목록 조회 중 오류가 발생했습니다.');
            console.error(error);
        }
    });

    // 이메일 발송 폼 제출
    document.getElementById('emailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('.btn-send');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = '발송 중...';
        
        const formData = new FormData();
        formData.append('subject', document.getElementById('emailSubject').value);
        formData.append('message', document.getElementById('emailMessage').value);
        
        try {
            const response = await fetch('/api/admin/email/send-bulk', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('메일 발송이 시작되었습니다! 발송 완료까지 시간이 소요될 수 있습니다.');
                closeEmailModal();
            } else {
                alert('메일 발송 실패: ' + data.message);
            }
        } catch (error) {
            alert('메일 발송 중 오류가 발생했습니다.');
            console.error(error);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // 모달 외부 클릭 시 닫기
    document.getElementById('emailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeEmailModal();
        }
    });

    // 반응형 처리
    function handleResize() {
        const modulesGrid = document.querySelector('.modules-grid');
        const companyStats = document.querySelector('.company-stats');
        if (!modulesGrid || !companyStats) return;

        if (window.innerWidth <= 480) {
            // 모바일: 1열
            modulesGrid.style.gridTemplateColumns = '1fr';
            companyStats.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            // 태블릿: 2열
            modulesGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            // 데스크톱: 3열 (모듈), 4열 (통계)
            modulesGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
            companyStats.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }
    
    // 초기 로드 시 반응형 적용
    handleResize();
    
    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize);
    
    // 통계 실시간 업데이트 (주문 상태 변경 시)
    function updateStats() {
        // 통계 숫자 애니메이션 재실행
        animateNumbers();
    }
    
    // 주문 상태 변경 시 통계 업데이트 (전역 함수로 등록)
    window.updateCompanyStats = updateStats;



    // 모듈/통계 애니메이션
    function addAnimation() {
        const stats = document.querySelectorAll('.stat-item');
        const modules = document.querySelectorAll('.module-item');

        stats.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, i * 100);
        });

        modules.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(() => {
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 400 + i * 100);
        });
    }
    setTimeout(addAnimation, 300);

    // 접근성
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const focused = document.activeElement;
            if (focused && focused.classList.contains('module-item')) {
                e.preventDefault();
                focused.click();
            }
        }
    });
    moduleItems.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        const title = item.querySelector('.module-title')?.textContent || '';
        item.setAttribute('aria-label', `업체 마이페이지 기능: ${title}`);
    });

    // 통계 숫자 카운트 애니메이션 (표시값 기준)
    function animateNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(el => {
            const finalText = el.textContent.trim();
            const isDecimal = finalText.includes('.');
            const target = isDecimal ? parseFloat(finalText) : parseInt(finalText, 10);
            if (isNaN(target)) return;

            let current = 0;
            const steps = 50;
            const inc = target / steps;

            const timer = setInterval(() => {
                current += inc;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                el.textContent = isDecimal ? current.toFixed(1) : Math.round(current);
            }, 30);
        });
    }
    setTimeout(animateNumbers, 800);
});
