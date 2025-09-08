// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 탭 기능 초기화
    initializeTabs();
    
    // 리뷰 작성 버튼 이벤트 초기화
    initializeReviewButtons();
    
    // 숨기기 버튼 이벤트 초기화
    initializeHideButtons();
    
    // 페이지 로드 애니메이션
    addPageAnimations();
});

// 탭 기능 초기화
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼에서 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // 모든 탭 콘텐츠에서 active 클래스 제거
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 클릭된 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 해당 탭 콘텐츠에 active 클래스 추가
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 탭 전환 애니메이션
                targetContent.style.opacity = '0';
                targetContent.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    targetContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateY(0)';
                }, 50);
            }
        });
    });
}

// 리뷰 작성 버튼 이벤트 초기화
function initializeReviewButtons() {
    const writeReviewButtons = document.querySelectorAll('.write-review-btn');
    const editReviewButtons = document.querySelectorAll('.edit-review-btn');
    
    // 작성 가능한 리뷰의 "리뷰 작성하기" 버튼
    writeReviewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 버튼 클릭 애니메이션
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // 리뷰 작성 모달 또는 페이지로 이동
            handleReviewWrite(this);
        });
        
        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // 작성한 리뷰의 "리뷰 수정하기" 버튼
    editReviewButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 버튼 클릭 애니메이션
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // 리뷰 수정 페이지로 이동
            handleReviewEdit(this);
        });
        
        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 숨기기 버튼 이벤트 초기화
function initializeHideButtons() {
    const hideButtons = document.querySelectorAll('.hide-btn');
    
    hideButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 버튼 클릭 애니메이션
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
            
            // 숨기기 기능
            handleHideReview(this);
        });
        
        // 호버 효과
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// 리뷰 작성 처리
function handleReviewWrite(button) {
    // 작성 가능한 리뷰에서 리뷰 작성 페이지로 이동
    window.location.href = '/review-write';
}

// 리뷰 수정 처리
function handleReviewEdit(button) {
    const reviewItem = button.closest('.written-review-item');
    const productName = reviewItem.querySelector('.product-name').textContent;
    const storeName = reviewItem.querySelector('.store-name').textContent;
    const deliveryDate = reviewItem.querySelector('.delivery-date').textContent;
    
    // 리뷰 수정 페이지로 이동 (기존 작성한 내용과 함께)
    alert(`${storeName} - ${productName} (${deliveryDate}) 리뷰를 수정합니다.`);
    
    // 실제 구현 시 기존 리뷰 데이터를 전달하여 수정 페이지로 이동
    // window.location.href = `/review-edit?product=${productName}&store=${storeName}&date=${deliveryDate}`;
}

// 리뷰 숨기기 처리
function handleHideReview(button) {
    const reviewItem = button.closest('.written-review-item');
    const deliveryDate = reviewItem.querySelector('.delivery-date').textContent;
    
    // 확인 대화상자
    if (confirm(`${deliveryDate} 주문의 리뷰를 숨기시겠습니까?`)) {
        // 숨기기 애니메이션
        reviewItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        reviewItem.style.opacity = '0';
        reviewItem.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            reviewItem.remove();
            
            // 리뷰가 없을 때 메시지 표시
            const reviewList = document.querySelector('#written .review-list');
            if (reviewList && reviewList.children.length === 0) {
                showEmptyMessage(reviewList);
            }
        }, 300);
    }
}

// 빈 리스트 메시지 표시
function showEmptyMessage(container) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <div style="font-size: 3rem; margin-bottom: 20px;">📝</div>
            <h3 style="margin-bottom: 10px;">작성한 리뷰가 없습니다</h3>
            <p>아직 작성한 리뷰가 없습니다. 상품을 구매하고 리뷰를 작성해보세요!</p>
        </div>
    `;
    
    container.appendChild(emptyMessage);
}

// 페이지 로드 애니메이션
function addPageAnimations() {
    // 사용자 프로필 섹션 애니메이션
    const userProfile = document.querySelector('.user-profile-section');
    if (userProfile) {
        userProfile.style.opacity = '0';
        userProfile.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            userProfile.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            userProfile.style.opacity = '1';
            userProfile.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // 탭 섹션 애니메이션
    const reviewTabs = document.querySelector('.review-tabs');
    if (reviewTabs) {
        reviewTabs.style.opacity = '0';
        reviewTabs.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            reviewTabs.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            reviewTabs.style.opacity = '1';
            reviewTabs.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // 리뷰 아이템들 순차 애니메이션
    const reviewItems = document.querySelectorAll('.review-item, .written-review-item');
    reviewItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
}

// 리뷰 작성 모달 열기 (예시)
function openReviewModal(productName, storeName) {
    // 실제 구현 시 모달 HTML과 CSS를 추가하여 구현
    console.log(`리뷰 작성 모달 열기: ${storeName} - ${productName}`);
}

// 리뷰 수정 모달 열기 (예시)
function openReviewEditModal(deliveryDate) {
    // 실제 구현 시 모달 HTML과 CSS를 추가하여 구현
    console.log(`리뷰 수정 모달 열기: ${deliveryDate}`);
}

// 반응형 처리
function handleResize() {
    const reviewItems = document.querySelectorAll('.review-item');
    const writtenReviewItems = document.querySelectorAll('.written-review-item');
    
    if (window.innerWidth <= 768) {
        // 모바일에서는 세로 배치
        reviewItems.forEach(item => {
            item.style.flexDirection = 'column';
            item.style.textAlign = 'center';
        });
        
        writtenReviewItems.forEach(item => {
            item.style.flexDirection = 'column';
            item.style.textAlign = 'center';
        });
    } else {
        // 데스크톱에서는 가로 배치
        reviewItems.forEach(item => {
            item.style.flexDirection = 'row';
            item.style.textAlign = 'left';
        });
        
        writtenReviewItems.forEach(item => {
            item.style.flexDirection = 'row';
            item.style.textAlign = 'left';
        });
    }
}

// 윈도우 리사이즈 이벤트 리스너
window.addEventListener('resize', handleResize);

// 초기 반응형 설정
handleResize();
