// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 별점 기능 초기화
    initializeStarRating();
    
    // 텍스트에어리어 기능 초기화
    initializeTextarea();
    
    // 저장 버튼 이벤트 초기화
    initializeSaveButton();
    
    // 페이지 로드 애니메이션
    addPageAnimations();
});

// 별점 기능 초기화
function initializeStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.querySelector('.rating-text');
    
    // 별점 텍스트 매핑
    const ratingTexts = {
        1: '별로에요',
        2: '아쉬워요',
        3: '보통이에요',
        4: '좋아요',
        5: '최고에요'
    };
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            updateStarRating(rating);
            updateRatingText(rating, ratingTexts);
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
            updateRatingText(rating, ratingTexts);
        });
    });
    
    // 별점 영역에서 마우스가 나갔을 때
    const starRating = document.querySelector('.star-rating');
    starRating.addEventListener('mouseleave', function() {
        const currentRating = getCurrentRating();
        highlightStars(currentRating);
        updateRatingText(currentRating, ratingTexts);
    });
}

// 별점 업데이트
function updateStarRating(rating) {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// 별점 하이라이트
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#ffc107';
        } else {
            star.style.color = '#e9ecef';
        }
    });
}

// 현재 별점 가져오기
function getCurrentRating() {
    const activeStars = document.querySelectorAll('.star.active');
    return activeStars.length;
}

// 별점 텍스트 업데이트
function updateRatingText(rating, ratingTexts) {
    const ratingText = document.querySelector('.rating-text');
    if (ratingText && ratingTexts[rating]) {
        ratingText.textContent = ratingTexts[rating];
        
        // 텍스트 색상 변경
        ratingText.style.color = getRatingColor(rating);
    }
}

// 별점에 따른 색상 반환
function getRatingColor(rating) {
    const colors = {
        1: '#dc3545', // 빨간색
        2: '#fd7e14', // 주황색
        3: '#ffc107', // 노란색
        4: '#20c997', // 청록색
        5: '#28a745'  // 초록색
    };
    return colors[rating] || '#6c757d';
}

// 텍스트에어리어 기능 초기화
function initializeTextarea() {
    const textarea = document.querySelector('.review-textarea');
    const charCount = document.querySelector('.char-count');
    
    if (textarea && charCount) {
        // 초기 문자 수 업데이트
        updateCharCount(textarea, charCount);
        
        // 입력 이벤트 리스너
        textarea.addEventListener('input', function() {
            updateCharCount(this, charCount);
        });
        
        // 포커스 이벤트
        textarea.addEventListener('focus', function() {
            this.style.borderColor = '#0056b3';
            this.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
        });
        
        textarea.addEventListener('blur', function() {
            this.style.borderColor = '#007bff';
            this.style.boxShadow = 'none';
        });
    }
}

// 문자 수 업데이트
function updateCharCount(textarea, charCountElement) {
    const currentLength = textarea.value.length;
    const maxLength = textarea.getAttribute('maxlength');
    
    charCountElement.textContent = `${currentLength}/${maxLength}`;
    
    // 문자 수에 따른 색상 변경
    if (currentLength > maxLength * 0.9) {
        charCountElement.style.color = '#dc3545';
    } else if (currentLength > maxLength * 0.7) {
        charCountElement.style.color = '#ffc107';
    } else {
        charCountElement.style.color = '#6c757d';
    }
}

// 저장 버튼 이벤트 초기화
function initializeSaveButton() {
    const saveBtn = document.querySelector('.save-btn');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            handleSaveReview(this);
        });
        
        // 호버 효과
        saveBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        saveBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }
}

// 리뷰 저장 처리
function handleSaveReview(button) {
    const textarea = document.querySelector('.review-textarea');
    const rating = getCurrentRating();
    const reviewText = textarea.value.trim();
    
    // 유효성 검사
    if (rating === 0) {
        alert('별점을 선택해주세요.');
        return;
    }
    
    if (reviewText.length === 0) {
        alert('리뷰 내용을 입력해주세요.');
        textarea.focus();
        return;
    }
    
    if (reviewText.length < 10) {
        alert('리뷰는 최소 10자 이상 작성해주세요.');
        textarea.focus();
        return;
    }
    
    // 저장 애니메이션
    button.style.transform = 'scale(0.95)';
    button.textContent = '저장 중...';
    button.disabled = true;
    
    // 실제 저장 로직 (서버로 전송)
    setTimeout(() => {
        // 성공 애니메이션
        button.style.background = 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)';
        button.textContent = '저장 완료!';
        
        setTimeout(() => {
            // 리뷰 목록 페이지로 이동
            alert('리뷰가 성공적으로 저장되었습니다.');
            window.location.href = '/review';
        }, 1000);
    }, 1500);
}

// 페이지 로드 애니메이션
function addPageAnimations() {
    // 상품 정보 섹션 애니메이션
    const productSection = document.querySelector('.product-info-section');
    if (productSection) {
        productSection.style.opacity = '0';
        productSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            productSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            productSection.style.opacity = '1';
            productSection.style.transform = 'translateY(0)';
        }, 100);
    }
    
    // 리뷰 작성 섹션 애니메이션
    const reviewSection = document.querySelector('.review-write-section');
    if (reviewSection) {
        reviewSection.style.opacity = '0';
        reviewSection.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            reviewSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            reviewSection.style.opacity = '1';
            reviewSection.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // 별점 애니메이션
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.style.opacity = '0';
        star.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            star.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            star.style.opacity = '1';
            star.style.transform = 'scale(1)';
        }, 400 + (index * 100));
    });
}

// 뒤로가기 기능
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '/review';
    }
}

// ESC 키로 뒤로가기
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        goBack();
    }
});

// 페이지 이탈 시 확인
window.addEventListener('beforeunload', function(event) {
    const textarea = document.querySelector('.review-textarea');
    const rating = getCurrentRating();
    
    if (textarea.value.trim().length > 0 || rating > 0) {
        event.preventDefault();
        event.returnValue = '작성 중인 리뷰가 있습니다. 정말 나가시겠습니까?';
    }
});
