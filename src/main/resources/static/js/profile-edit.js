// 정보수정 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeProfileEdit();
});

function initializeProfileEdit() {
    setupFormValidation();
    setupLocationSelects();
    setupProfilePictureUpload();
    setupFormSubmission();
    setupDeleteModal();  // ★ 탈퇴 모달
    console.log('정보수정 페이지가 초기화되었습니다.');
}

/* ========== 유효성 검사 ========== */
function setupFormValidation() {
    const form = document.getElementById('profileEditForm');
    if (!form) return;

    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
        if (input.readOnly || input.disabled) return;
        input.addEventListener('blur', function() { validateField(this); });
        input.addEventListener('input', function() { clearFieldError(this); });
    });
}

function getRequiredFields() {
    const isCompanyPage = isCompany();
    if (isCompanyPage) {
        // 업체 페이지라면 담당자명 정도만 필수(이름 input 재사용)
        return ['name'];
    } else {
        return ['name']; // 일반 회원
    }
}

function validateField(field) {
    if (field.readOnly || field.disabled) return true;

    const value = field.value.trim();
    const fieldName = field.id;

    clearFieldError(field);

    const requiredFields = getRequiredFields();
    if (requiredFields.includes(fieldName) && !value) {
        showFieldError(field, '필수 입력 항목입니다.');
        return false;
    }

    if (fieldName === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, '올바른 이메일 형식을 입력해주세요.');
            return false;
        }
    }

    if (fieldName === 'password' && value) {
        if (value.length < 8) {
            showFieldError(field, '비밀번호는 8자 이상 입력해주세요.');
            return false;
        }
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
            showFieldError(field, '비밀번호는 영문과 숫자를 포함해야 합니다.');
            return false;
        }
    }

    showFieldSuccess(field);
    return true;
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    const existing = field.parentNode.querySelector('.error-message');
    if (existing) existing.remove();
    const div = document.createElement('div');
    div.className = 'error-message';
    div.textContent = message;
    field.parentNode.appendChild(div);
}

function showFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
    const existing = field.parentNode.querySelector('.error-message');
    if (existing) existing.remove();
}

function clearFieldError(field) {
    field.classList.remove('error', 'success');
    const existing = field.parentNode.querySelector('.error-message');
    if (existing) existing.remove();
}

/* ========== 지역 선택 ========== */
function setupLocationSelects() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    if (!citySelect || !districtSelect) return;

    const districts = {
        '서울': ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구'],
        '부산': ['강서구','금정구','남구','동구','동래구','부산진구','북구','사상구','사하구','서구','수영구','연제구','영도구','중구','해운대구','기장군'],
        '대구': ['남구','달서구','달성군','동구','북구','서구','수성구','중구'],
        '인천': ['계양구','남동구','동구','부평구','서구','연수구','중구','강화군','옹진군'],
        '광주': ['광산구','남구','동구','북구','서구'],
        '대전': ['대덕구','동구','서구','유성구','중구'],
        '울산': ['남구','동구','북구','울주군','중구'],
        '세종': ['세종특별자치시'],
        '경기': ['수원시','성남시','의정부시','안양시','부천시','광명시','평택시','과천시','오산시','시흥시','군포시','의왕시','하남시','용인시','파주시','이천시','안성시','김포시','화성시','광주시','여주시','양평군','고양시','동두천시','가평군','연천군'],
        '강원': ['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
        '충북': ['청주시','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
        '충남': ['천안시','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
        '전북': ['전주시','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
        '전남': ['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
        '경북': ['포항시','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','군위군','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
        '경남': ['창원시','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
        '제주': ['제주시','서귀포시']
    };

    citySelect.addEventListener('change', function() {
        const selectedCity = this.value;
        districtSelect.innerHTML = '<option value="">동 선택</option>';
        if (selectedCity && districts[selectedCity]) {
            districts[selectedCity].forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d;
                districtSelect.appendChild(opt);
            });
        }
    });
}

/* ========== 프로필 사진 업로드 ========== */
function setupProfilePictureUpload() {
    const cameraIcon = document.querySelector('.camera-icon');
    const profilePicture = document.querySelector('.profile-picture');
    if (!cameraIcon || !profilePicture) return;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    cameraIcon.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                const box = document.querySelector('.profile-placeholder');
                box.innerHTML = `<img src="${ev.target.result}" alt="프로필 사진" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

/* ========== 저장 ========== */
function setupFormSubmission() {
    const form = document.getElementById('profileEditForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const inputs = form.querySelectorAll('.form-input, .form-select');
        let ok = true;
        inputs.forEach(input => {
            if (!input.readOnly && !input.disabled) {
                if (!validateField(input)) ok = false;
            }
        });

        if (!ok) {
            const saveBtn = document.querySelector('.save-btn');
            showMessage('입력 정보를 확인해주세요.', 'error', saveBtn);
            return;
        }

        const data = collectFormData();
        saveProfileData(data);
    });
}

function collectFormData() {
    const form = document.getElementById('profileEditForm');
    const map = {};
    const inputs = form.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        if (!input.readOnly && !input.disabled) {
            map[input.id] = input.value.trim();
        }
    });
    return map;
}

// 데모: 실제 저장 API 연결 시 fetch 사용
function saveProfileData(formData) {
    const btn = document.querySelector('.save-btn');
    const old = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> 저장 중...';
    btn.disabled = true;

    setTimeout(() => {
        console.log('저장할 데이터:', formData);
        showMessage('정보가 성공적으로 저장되었습니다.', 'success');
        btn.innerHTML = old;
        btn.disabled = false;

        setTimeout(() => {
            window.location.href = isCompany() ? '/mypage-company' : '/mypage';
        }, 1200);
    }, 1000);
}

/* ========== 탈퇴(모달 + 요청) ========== */
function setupDeleteModal() {
    const openBtn = document.getElementById('openDeleteModalBtn');
    const modal = document.getElementById('deleteModal');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    if (!openBtn || !modal) return;

    openBtn.addEventListener('click', () => showModal(modal, true));
    cancelBtn.addEventListener('click', () => showModal(modal, false));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) showModal(modal, false);
    });

    confirmBtn.addEventListener('click', async () => {
        const reason = document.getElementById('deleteReason').value.trim();
        const ack = document.getElementById('deleteAcknowledge').checked;
        if (!ack) {
            alert('안내를 확인하고 체크해 주세요.');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = '처리 중...';

        // 엔드포인트 결정 (템플릿의 data-delete-url 사용)
        const root = document.querySelector('.profile-edit-container');
        const deleteUrl = root?.dataset?.deleteUrl || (isCompany() ? '/company/account/delete' : '/account/delete');

        try {
            // 실제 서버 연결 시:
            // const res = await fetch(deleteUrl, {
            //   method: 'POST',
            //   headers: {'Content-Type':'application/x-www-form-urlencoded'},
            //   body: new URLSearchParams({ reason })
            // });
            // if (!res.ok) throw new Error('탈퇴 실패');
            // const data = await res.json();

            // 데모: 성공 시나리오
            await new Promise(r => setTimeout(r, 900));

            showModal(modal, false);
            showMessage('계정이 탈퇴 처리되었습니다.', 'success');

            // 탈퇴 후 로그아웃 또는 홈으로
            setTimeout(() => {
                window.location.href = '/';
            }, 900);

        } catch (e) {
            console.error(e);
            showMessage('탈퇴 처리 중 오류가 발생했습니다.', 'error');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '영구 탈퇴';
        }
    });
}

function showModal(el, visible) {
    el.style.display = visible ? 'flex' : 'none';
}

/* ========== 유틸 ========== */
function isCompany() {
    const root = document.querySelector('.profile-edit-container');
    return root?.dataset?.isCompany === 'true';
}

function showMessage(message, type, targetElement = null) {
    const existing = document.querySelector('.page-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `page-message ${type}`;
    div.textContent = message;
    div.style.cssText = `
        position: absolute; padding: 12px 16px; border-radius: 8px; color: #fff;
        font-weight: 600; z-index: 1000; animation: slideInUp 0.3s ease-out;
        max-width: 300px; word-wrap: break-word; font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); pointer-events: none;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
    `;

    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const top = (window.pageYOffset || document.documentElement.scrollTop) + rect.bottom + 10;
        div.style.left = rect.left + 'px';
        div.style.top = top + 'px';
    } else {
        div.style.cssText += `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            animation: slideInDown 0.3s ease-out;
        `;
    }

    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// 애니메이션 스타일 주입
const style = document.createElement('style');
style.textContent = `
@keyframes slideInUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes slideOutUp { from{transform:translateY(0);opacity:1} to{transform:translateY(-20px);opacity:0} }
@keyframes slideInDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
`;
document.head.appendChild(style);
