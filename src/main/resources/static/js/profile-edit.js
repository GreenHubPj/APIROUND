// 정보수정 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeProfileEdit();
});

function initializeProfileEdit() {
    setupFormValidation();
    setupLocationSelects();
    setupProfilePictureUpload();
    setupFormSubmission();
    console.log('정보수정 페이지가 초기화되었습니다.');
}

// 폼 유효성 검사 설정
function setupFormValidation() {
    const form = document.getElementById('profileEditForm');
    const inputs = form.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        // 실시간 유효성 검사
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// 필드 유효성 검사
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.id;
    
    clearFieldError(field);
    
    // 필수 필드 검사
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }
    
    // 이메일 형식 검사
    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, '올바른 이메일 형식을 입력해주세요.');
            return false;
        }
    }
    
    // 전화번호 형식 검사
    if (fieldName === 'contactNumber' && value) {
        const phoneRegex = /^[0-9-+\s()]+$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, '올바른 전화번호 형식을 입력해주세요.');
            return false;
        }
    }
    
    // 사업자등록번호 형식 검사
    if (fieldName === 'businessNumber' && value) {
        const businessRegex = /^\d{3}-\d{2}-\d{5}$/;
        if (!businessRegex.test(value)) {
            showFieldError(field, '올바른 사업자등록번호 형식을 입력해주세요. (예: 123-45-67890)');
            return false;
        }
    }
    
    showFieldSuccess(field);
    return true;
}

// 필드 에러 표시
function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    
    // 기존 에러 메시지 제거
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 새 에러 메시지 추가
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// 필드 성공 표시
function showFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
    
    // 기존 에러 메시지 제거
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// 필드 에러 제거
function clearFieldError(field) {
    field.classList.remove('error', 'success');
    
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// 지역 선택 설정
function setupLocationSelects() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    
    if (!citySelect || !districtSelect) return;
    
    // 시/도별 동 목록
    const districts = {
        '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
        '부산': ['강서구', '금정구', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구', '기장군'],
        '대구': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
        '인천': ['계양구', '남구', '남동구', '동구', '부평구', '서구', '연수구', '중구', '강화군', '옹진군'],
        '광주': ['광산구', '남구', '동구', '북구', '서구'],
        '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
        '울산': ['남구', '동구', '북구', '울주군', '중구'],
        '세종': ['세종특별자치시'],
        '경기': ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '과천시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '여주시', '양평군', '고양시', '의정부시', '동두천시', '가평군', '연천군'],
        '강원': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
        '충북': ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
        '충남': ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
        '전북': ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
        '전남': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
        '경북': ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
        '경남': ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
        '제주': ['제주시', '서귀포시']
    };
    
    // 시/도 선택 시 동 목록 업데이트
    citySelect.addEventListener('change', function() {
        const selectedCity = this.value;
        districtSelect.innerHTML = '<option value="">동 선택</option>';
        
        if (selectedCity && districts[selectedCity]) {
            districts[selectedCity].forEach(district => {
                const option = document.createElement('option');
                option.value = district;
                option.textContent = district;
                districtSelect.appendChild(option);
            });
        }
    });
}

// 프로필 사진 업로드 설정
function setupProfilePictureUpload() {
    const cameraIcon = document.querySelector('.camera-icon');
    const profilePicture = document.querySelector('.profile-picture');
    
    if (!cameraIcon || !profilePicture) return;
    
    // 파일 입력 생성
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // 카메라 아이콘 클릭 시 파일 선택
    cameraIcon.addEventListener('click', function() {
        fileInput.click();
    });
    
    // 파일 선택 시 미리보기
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const profilePlaceholder = document.querySelector('.profile-placeholder');
                profilePlaceholder.innerHTML = `<img src="${e.target.result}" alt="프로필 사진" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// 폼 제출 설정
function setupFormSubmission() {
    const form = document.getElementById('profileEditForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 모든 필드 유효성 검사
        const inputs = form.querySelectorAll('.form-input');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            // 폼 데이터 수집
            const formData = collectFormData();
            
            // 저장 처리
            saveProfileData(formData);
        } else {
            showMessage('입력 정보를 확인해주세요.', 'error');
        }
    });
}

// 폼 데이터 수집
function collectFormData() {
    const form = document.getElementById('profileEditForm');
    const formData = {};
    
    const inputs = form.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        if (input.value && !input.readOnly && !input.disabled) {
            formData[input.id] = input.value;
        }
    });
    
    return formData;
}

// 프로필 데이터 저장
function saveProfileData(formData) {
    // 로딩 상태 표시
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>⏳</span> 저장 중...';
    saveBtn.disabled = true;
    
    // 실제 저장 로직 (서버 연동)
    setTimeout(() => {
        console.log('저장할 데이터:', formData);
        
        // 성공 메시지 표시
        showMessage('정보가 성공적으로 저장되었습니다.', 'success');
        
        // 버튼 원상복구
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
        // 2초 후 마이페이지로 이동
        setTimeout(() => {
            // 현재 페이지가 판매회원 페이지인지 확인
            const isCompanyPage = window.location.pathname.includes('company');
            const redirectUrl = isCompanyPage ? '/mypage-company' : '/mypage';
            window.location.href = redirectUrl;
        }, 2000);
        
    }, 1500);
}

// 메시지 표시
function showMessage(message, type) {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.page-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 새 메시지 생성
    const messageDiv = document.createElement('div');
    messageDiv.className = `page-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3초 후 자동 제거
    setTimeout(() => {
        messageDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 300);
    }, 3000);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
