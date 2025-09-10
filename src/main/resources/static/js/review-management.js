// 리뷰 관리 페이지 JavaScript

// 전역 변수
let currentPage = 1;
let totalPages = 1;
let pageSize = 20;
let sortColumn = 'date';
let sortDirection = 'desc';
let selectedReviews = new Set();
let currentFilters = {
    searchType: 'content',
    searchKeyword: '',
    rating: '',
    status: '',
    photo: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    reportCount: ''
};

// 샘플 데이터
const sampleReviewData = [
    {
        id: 1,
        date: '2024-01-15 14:30:25',
        orderNumber: 'ORD-2024-001',
        productName: '신선한 사과 2kg',
        author: '김고객',
        rating: 5,
        content: '정말 신선하고 맛있어요! 포장도 깔끔하게 되어있고 배송도 빨랐습니다. 다음에도 주문할게요.',
        hasPhotos: true,
        photos: ['/images/사과.jpg', '/images/사과2.jpg'],
        status: '게시',
        reportCount: 0,
        processor: '-',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        adminMemo: '',
        history: [
            {
                date: '2024-01-15 14:30:25',
                action: '작성',
                description: '리뷰가 작성되었습니다.',
                processor: '시스템'
            }
        ],
        reply: null
    },
    {
        id: 2,
        date: '2024-01-14 09:15:42',
        orderNumber: 'ORD-2024-002',
        productName: '제철 감자 3kg',
        author: '이소비자',
        rating: 3,
        content: '감자는 괜찮은데 배송이 좀 늦었어요. 하지만 신선도는 만족합니다.',
        hasPhotos: false,
        photos: [],
        status: '게시',
        reportCount: 1,
        processor: '관리자A',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        adminMemo: '배송 지연 관련 문의 있음',
        history: [
            {
                date: '2024-01-14 09:15:42',
                action: '작성',
                description: '리뷰가 작성되었습니다.',
                processor: '시스템'
            },
            {
                date: '2024-01-14 10:30:15',
                action: '신고',
                description: '배송 관련 불만 신고 접수',
                processor: '관리자A'
            }
        ],
        reply: null
    },
    {
        id: 3,
        date: '2024-01-13 16:45:18',
        orderNumber: 'ORD-2024-003',
        productName: '유기농 당근 1kg',
        author: '박구매자',
        rating: 4,
        content: '당근이 정말 달고 맛있어요! 아이들도 좋아합니다.',
        hasPhotos: true,
        photos: ['/images/당근.jpg'],
        status: '숨김',
        reportCount: 0,
        processor: '관리자B',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Android 11; Mobile; rv:68.0)',
        adminMemo: '품질 검토 후 숨김 처리',
        history: [
            {
                date: '2024-01-13 16:45:18',
                action: '작성',
                description: '리뷰가 작성되었습니다.',
                processor: '시스템'
            },
            {
                date: '2024-01-13 17:20:30',
                action: '숨김',
                description: '품질 검토를 위해 임시 숨김 처리',
                processor: '관리자B'
            }
        ],
        reply: {
            content: '고객님의 소중한 후기 감사합니다. 더 좋은 상품으로 보답하겠습니다.',
            date: '2024-01-13 17:25:00',
            author: '관리자B'
        }
    },
    {
        id: 4,
        date: '2024-01-12 11:20:33',
        orderNumber: 'ORD-2024-004',
        productName: '신선한 양파 2kg',
        author: '최고객',
        rating: 1,
        content: '양파가 썩어있었어요. 돈이 아까워요.',
        hasPhotos: true,
        photos: ['/images/썩은양파.jpg'],
        status: '신고됨',
        reportCount: 3,
        processor: '관리자C',
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        adminMemo: '품질 문제 신고 다수 접수',
        history: [
            {
                date: '2024-01-12 11:20:33',
                action: '작성',
                description: '리뷰가 작성되었습니다.',
                processor: '시스템'
            },
            {
                date: '2024-01-12 12:15:20',
                action: '신고',
                description: '품질 문제 신고 접수',
                processor: '관리자C'
            },
            {
                date: '2024-01-12 13:30:45',
                action: '신고',
                description: '추가 신고 접수',
                processor: '관리자C'
            }
        ],
        reply: null
    },
    {
        id: 5,
        date: '2024-01-11 20:10:55',
        orderNumber: 'ORD-2024-005',
        productName: '제철 배추 1포기',
        author: '정소비자',
        rating: 5,
        content: '배추가 정말 싱싱해요! 김치 담그기에 딱입니다.',
        hasPhotos: false,
        photos: [],
        status: '삭제',
        reportCount: 0,
        processor: '관리자A',
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        adminMemo: '중복 리뷰로 삭제 처리',
        history: [
            {
                date: '2024-01-11 20:10:55',
                action: '작성',
                description: '리뷰가 작성되었습니다.',
                processor: '시스템'
            },
            {
                date: '2024-01-11 21:00:10',
                action: '삭제',
                description: '중복 리뷰로 인한 삭제 처리',
                processor: '관리자A'
            }
        ],
        reply: null
    }
];

// DOM 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    renderTable();
    renderPagination();
});

// 페이지 초기화
function initializePage() {
    // 컬럼 토글 버튼 초기화
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(btn => {
        btn.classList.add('active');
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 검색 관련
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    document.getElementById('searchType').addEventListener('change', function() {
        currentFilters.searchType = this.value;
    });

    // 필터 관련
    document.getElementById('ratingFilter').addEventListener('change', handleFilterChange);
    document.getElementById('statusFilter').addEventListener('change', handleFilterChange);
    document.getElementById('photoFilter').addEventListener('change', handleFilterChange);
    document.getElementById('dateFilter').addEventListener('change', handleDateFilterChange);
    document.getElementById('reportFilter').addEventListener('change', handleFilterChange);

    // 날짜 직접입력
    document.getElementById('applyDateBtn').addEventListener('click', handleCustomDateApply);

    // 컬럼 토글
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const column = this.dataset.column;
            toggleColumn(column);
        });
    });

    // 정렬
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const column = this.dataset.column;
            handleSort(column);
        });
    });

    // 체크박스
    document.getElementById('selectAll').addEventListener('change', handleSelectAll);
    
    // 일괄 처리 버튼
    document.getElementById('bulkHide').addEventListener('click', () => handleBulkAction('hide'));
    document.getElementById('bulkDelete').addEventListener('click', () => handleBulkAction('delete'));
    document.getElementById('bulkStatus').addEventListener('click', () => handleBulkAction('status'));
    document.getElementById('bulkReport').addEventListener('click', () => handleBulkAction('report'));

    // 페이지네이션
    document.getElementById('prevPage').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(currentPage + 1));

    // 엑셀 내보내기
    document.getElementById('exportExcel').addEventListener('click', handleExportExcel);

    // 모달 관련
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('closeStatusModal').addEventListener('click', closeStatusModal);
    document.getElementById('closeReportModal').addEventListener('click', closeReportModal);

    // 모달 외부 클릭 시 닫기
    document.getElementById('reviewDetailModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    document.getElementById('statusChangeModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeStatusModal();
        }
    });
    document.getElementById('reportModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeReportModal();
        }
    });

    // 상태 변경 모달
    document.getElementById('confirmStatusChange').addEventListener('click', handleStatusChange);
    document.getElementById('cancelStatusChange').addEventListener('click', closeStatusModal);

    // 신고 처리 모달
    document.getElementById('confirmReport').addEventListener('click', handleReportProcess);
    document.getElementById('cancelReport').addEventListener('click', closeReportModal);

    // 관리자 메모 저장
    document.querySelector('.memo-save-btn').addEventListener('click', saveAdminMemo);

    // 답글 관련
    document.querySelector('.reply-save-btn').addEventListener('click', saveReply);
    document.querySelector('.reply-edit-btn').addEventListener('click', editReply);
    document.querySelector('.reply-delete-btn').addEventListener('click', deleteReply);
    document.querySelector('.reply-cancel-btn').addEventListener('click', cancelReplyEdit);

    // 모달 액션 버튼
    document.getElementById('modalStatus').addEventListener('click', () => openStatusModal());
    document.getElementById('modalHide').addEventListener('click', () => handleSingleAction('hide'));
    document.getElementById('modalDelete').addEventListener('click', () => handleSingleAction('delete'));
}

// 검색 처리
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    currentFilters.searchKeyword = searchInput.value.trim();
    currentPage = 1;
    renderTable();
    renderPagination();
}

// 필터 변경 처리
function handleFilterChange() {
    const ratingFilter = document.getElementById('ratingFilter');
    const statusFilter = document.getElementById('statusFilter');
    const photoFilter = document.getElementById('photoFilter');
    const reportFilter = document.getElementById('reportFilter');

    currentFilters.rating = ratingFilter.value;
    currentFilters.status = statusFilter.value;
    currentFilters.photo = photoFilter.value;
    currentFilters.reportCount = reportFilter.value;

    currentPage = 1;
    renderTable();
    renderPagination();
}

// 날짜 필터 변경 처리
function handleDateFilterChange() {
    const dateFilter = document.getElementById('dateFilter');
    const customDateRange = document.getElementById('customDateRange');
    
    currentFilters.dateRange = dateFilter.value;
    
    if (dateFilter.value === 'custom') {
        customDateRange.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
        currentFilters.startDate = '';
        currentFilters.endDate = '';
        currentPage = 1;
        renderTable();
        renderPagination();
    }
}

// 직접입력 날짜 적용
function handleCustomDateApply() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        currentFilters.startDate = startDate;
        currentFilters.endDate = endDate;
        currentPage = 1;
        renderTable();
        renderPagination();
    } else {
        alert('시작일과 종료일을 모두 선택해주세요.');
    }
}

// 컬럼 토글
function toggleColumn(column) {
    const table = document.querySelector('.review-table');
    const columnIndex = getColumnIndex(column);
    
    if (columnIndex !== -1) {
        const header = table.querySelectorAll('th')[columnIndex];
        const cells = table.querySelectorAll(`td:nth-child(${columnIndex + 1})`);
        
        if (header.style.display === 'none') {
            header.style.display = '';
            cells.forEach(cell => cell.style.display = '');
        } else {
            header.style.display = 'none';
            cells.forEach(cell => cell.style.display = 'none');
        }
    }
}

// 컬럼 인덱스 가져오기
function getColumnIndex(column) {
    const columnMap = {
        'rating': 5,
        'photos': 7,
        'reports': 9,
        'processor': 10
    };
    return columnMap[column] || -1;
}

// 정렬 처리
function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // 정렬 아이콘 업데이트
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('asc', 'desc');
    });
    
    const currentTh = document.querySelector(`[data-column="${column}"]`);
    currentTh.classList.add(sortDirection);
    
    renderTable();
}

// 전체 선택/해제
function handleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
        const reviewId = parseInt(checkbox.dataset.reviewId);
        
        if (selectAllCheckbox.checked) {
            selectedReviews.add(reviewId);
        } else {
            selectedReviews.delete(reviewId);
        }
    });
    
    updateBulkActionsVisibility();
}

// 개별 체크박스 처리
function handleCheckboxChange(reviewId) {
    const checkbox = document.querySelector(`input[data-review-id="${reviewId}"]`);
    
    if (checkbox.checked) {
        selectedReviews.add(reviewId);
    } else {
        selectedReviews.delete(reviewId);
    }
    
    // 전체 선택 체크박스 상태 업데이트
    const allCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const checkedCheckboxes = document.querySelectorAll('tbody input[type="checkbox"]:checked');
    
    const selectAllCheckbox = document.getElementById('selectAll');
    selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
    selectAllCheckbox.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
    
    updateBulkActionsVisibility();
}

// 일괄 처리 버튼 가시성 업데이트
function updateBulkActionsVisibility() {
    const bulkActions = document.querySelector('.bulk-actions');
    if (selectedReviews.size > 0) {
        bulkActions.style.display = 'flex';
    } else {
        bulkActions.style.display = 'none';
    }
}

// 일괄 처리
function handleBulkAction(action) {
    if (selectedReviews.size === 0) {
        alert('처리할 리뷰를 선택해주세요.');
        return;
    }
    
    switch (action) {
        case 'hide':
            if (confirm(`선택한 ${selectedReviews.size}개의 리뷰를 숨김 처리하시겠습니까?`)) {
                selectedReviews.forEach(id => updateReviewStatus(id, '숨김'));
                selectedReviews.clear();
                renderTable();
                updateBulkActionsVisibility();
            }
            break;
        case 'delete':
            if (confirm(`선택한 ${selectedReviews.size}개의 리뷰를 삭제하시겠습니까?`)) {
                selectedReviews.forEach(id => updateReviewStatus(id, '삭제'));
                selectedReviews.clear();
                renderTable();
                updateBulkActionsVisibility();
            }
            break;
        case 'status':
            openStatusModal();
            break;
        case 'report':
            openReportModal();
            break;
    }
}

// 개별 액션 처리
function handleSingleAction(action, reviewId) {
    switch (action) {
        case 'detail':
            showReviewDetail(reviewId);
            break;
        case 'edit':
            // 편집 기능 (추후 구현)
            alert('편집 기능은 추후 구현 예정입니다.');
            break;
        case 'hide':
            if (confirm('이 리뷰를 숨김 처리하시겠습니까?')) {
                updateReviewStatus(reviewId, '숨김');
                renderTable();
            }
            break;
        case 'delete':
            if (confirm('이 리뷰를 삭제하시겠습니까?')) {
                updateReviewStatus(reviewId, '삭제');
                renderTable();
            }
            break;
    }
}

// 리뷰 상태 업데이트
function updateReviewStatus(reviewId, newStatus) {
    const review = sampleReviewData.find(r => r.id === reviewId);
    if (review) {
        review.status = newStatus;
        review.processor = '관리자A'; // 실제로는 현재 로그인한 관리자
        
        // 처리 이력 추가
        review.history.push({
            date: new Date().toLocaleString('ko-KR'),
            action: newStatus,
            description: `리뷰가 ${newStatus} 처리되었습니다.`,
            processor: '관리자A'
        });
    }
}

// 리뷰 상세보기
function showReviewDetail(reviewId) {
    const review = sampleReviewData.find(r => r.id === reviewId);
    if (!review) return;
    
    // 모달 데이터 채우기
    document.getElementById('modalReviewId').textContent = review.id;
    document.getElementById('modalWriteDate').textContent = review.date;
    document.getElementById('modalIpAddress').textContent = review.ipAddress;
    document.getElementById('modalUserAgent').textContent = review.userAgent;
    document.getElementById('modalOrderNumber').textContent = review.orderNumber;
    document.getElementById('modalProductName').textContent = review.productName;
    document.getElementById('modalAuthor').textContent = review.author;
    document.getElementById('modalRating').innerHTML = createRatingStars(review.rating);
    document.getElementById('modalContent').textContent = review.content;
    
    // 사진 표시
    const photoGallery = document.getElementById('modalPhotos');
    if (review.photos.length > 0) {
        photoGallery.innerHTML = review.photos.map(photo => 
            `<div class="photo-item"><img src="${photo}" alt="리뷰 사진"></div>`
        ).join('');
    } else {
        photoGallery.innerHTML = '<p class="no-photo">첨부된 사진이 없습니다.</p>';
    }
    
    // 관리자 메모
    document.getElementById('adminMemo').value = review.adminMemo || '';
    
    // 처리 이력
    const historySection = document.getElementById('modalHistorySection');
    historySection.innerHTML = review.history.map(history => `
        <div class="history-item">
            <div class="history-date">${history.date}</div>
            <div class="history-action">${history.action}</div>
            <div class="history-description">${history.description}</div>
        </div>
    `).join('');
    
    // 답글 표시
    const existingReply = document.getElementById('existingReply');
    const replyForm = document.getElementById('replyForm');
    
    if (review.reply) {
        document.getElementById('replyText').textContent = review.reply.content;
        existingReply.style.display = 'block';
        replyForm.style.display = 'none';
    } else {
        existingReply.style.display = 'none';
        replyForm.style.display = 'block';
    }
    
    // 모달 표시
    document.getElementById('reviewDetailModal').classList.add('show');
}

// 평점 별표 생성
function createRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="star">★</span>';
        } else {
            stars += '<span class="star empty">★</span>';
        }
    }
    return stars;
}

// 상태 변경 모달 열기
function openStatusModal() {
    document.getElementById('statusChangeModal').classList.add('show');
}

// 상태 변경 모달 닫기
function closeStatusModal() {
    document.getElementById('statusChangeModal').classList.remove('show');
}

// 신고 처리 모달 열기
function openReportModal() {
    document.getElementById('reportModal').classList.add('show');
}

// 신고 처리 모달 닫기
function closeReportModal() {
    document.getElementById('reportModal').classList.remove('show');
}

// 상태 변경 처리
function handleStatusChange() {
    const newStatus = document.getElementById('newStatus').value;
    const reason = document.getElementById('statusReason').value;
    
    if (!reason.trim()) {
        alert('변경 사유를 입력해주세요.');
        return;
    }
    
    selectedReviews.forEach(id => {
        updateReviewStatus(id, newStatus);
    });
    
    selectedReviews.clear();
    closeStatusModal();
    renderTable();
    updateBulkActionsVisibility();
    
    alert('상태가 변경되었습니다.');
}

// 신고 처리
function handleReportProcess() {
    const reason = document.querySelector('input[name="reportReason"]:checked');
    const action = document.getElementById('reportAction').value;
    const memo = document.getElementById('reportMemo').value;
    
    if (!reason) {
        alert('신고 사유를 선택해주세요.');
        return;
    }
    
    selectedReviews.forEach(id => {
        const review = sampleReviewData.find(r => r.id === id);
        if (review) {
            review.reportCount++;
            review.status = '신고됨';
            review.processor = '관리자A';
            
            review.history.push({
                date: new Date().toLocaleString('ko-KR'),
                action: '신고처리',
                description: `신고 처리: ${reason.value} - ${action}`,
                processor: '관리자A'
            });
        }
    });
    
    selectedReviews.clear();
    closeReportModal();
    renderTable();
    updateBulkActionsVisibility();
    
    alert('신고 처리가 완료되었습니다.');
}

// 관리자 메모 저장
function saveAdminMemo() {
    const memo = document.getElementById('adminMemo').value;
    // 실제로는 서버에 저장
    alert('관리자 메모가 저장되었습니다.');
}

// 답글 저장
function saveReply() {
    const content = document.getElementById('replyContent').value;
    
    if (!content.trim()) {
        alert('답글 내용을 입력해주세요.');
        return;
    }
    
    // 실제로는 서버에 저장
    alert('답글이 등록되었습니다.');
    document.getElementById('replyContent').value = '';
}

// 답글 편집
function editReply() {
    const existingReply = document.getElementById('existingReply');
    const replyForm = document.getElementById('replyForm');
    const replyText = document.getElementById('replyText').textContent;
    
    document.getElementById('replyContent').value = replyText;
    existingReply.style.display = 'none';
    replyForm.style.display = 'block';
    document.querySelector('.reply-cancel-btn').style.display = 'inline-block';
}

// 답글 삭제
function deleteReply() {
    if (confirm('답글을 삭제하시겠습니까?')) {
        // 실제로는 서버에서 삭제
        alert('답글이 삭제되었습니다.');
    }
}

// 답글 편집 취소
function cancelReplyEdit() {
    const existingReply = document.getElementById('existingReply');
    const replyForm = document.getElementById('replyForm');
    
    existingReply.style.display = 'block';
    replyForm.style.display = 'none';
    document.querySelector('.reply-cancel-btn').style.display = 'none';
    document.getElementById('replyContent').value = '';
}

// 모달 닫기
function closeModal() {
    document.getElementById('reviewDetailModal').classList.remove('show');
}

// 페이지 변경
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    renderPagination();
}

// 테이블 렌더링
function renderTable() {
    const tbody = document.getElementById('reviewTableBody');
    const filteredData = getFilteredData();
    const sortedData = getSortedData(filteredData);
    const paginatedData = getPaginatedData(sortedData);
    
    tbody.innerHTML = paginatedData.map(review => createTableRow(review)).join('');
    
    // 전체 선택 체크박스 상태 초기화
    document.getElementById('selectAll').checked = false;
    document.getElementById('selectAll').indeterminate = false;
}

// 테이블 행 생성
function createTableRow(review) {
    return `
        <tr>
            <td class="checkbox-col">
                <input type="checkbox" class="checkbox" data-review-id="${review.id}" 
                       onchange="handleCheckboxChange(${review.id})">
            </td>
            <td class="date-col">${review.date}</td>
            <td class="order-col">${review.orderNumber}</td>
            <td class="product-col">${review.productName}</td>
            <td class="author-col">${review.author}</td>
            <td class="rating-col">${createRatingStars(review.rating)}</td>
            <td class="content-col">${review.content.length > 50 ? review.content.substring(0, 50) + '...' : review.content}</td>
            <td class="photo-col">${review.hasPhotos ? '📷' : '-'}</td>
            <td class="status-col">
                <span class="status-badge status-${review.status}">${review.status}</span>
            </td>
            <td class="report-col">
                <span class="report-badge ${review.reportCount > 0 ? 'has-reports' : 'no-reports'}">
                    ${review.reportCount}
                </span>
            </td>
            <td class="processor-col">${review.processor}</td>
            <td class="action-col">
                <button class="action-btn detail-btn" onclick="handleSingleAction('detail', ${review.id})">상세</button>
                <button class="action-btn edit-btn" onclick="handleSingleAction('edit', ${review.id})">편집</button>
                <button class="action-btn hide-btn" onclick="handleSingleAction('hide', ${review.id})">숨김</button>
                <button class="action-btn delete-btn" onclick="handleSingleAction('delete', ${review.id})">삭제</button>
            </td>
        </tr>
    `;
}

// 필터링된 데이터 가져오기
function getFilteredData() {
    return sampleReviewData.filter(review => {
        // 키워드 검색
        if (currentFilters.searchKeyword) {
            const keyword = currentFilters.searchKeyword.toLowerCase();
            switch (currentFilters.searchType) {
                case 'content':
                    if (!review.content.toLowerCase().includes(keyword)) return false;
                    break;
                case 'author':
                    if (!review.author.toLowerCase().includes(keyword)) return false;
                    break;
                case 'orderNumber':
                    if (!review.orderNumber.toLowerCase().includes(keyword)) return false;
                    break;
                case 'productName':
                    if (!review.productName.toLowerCase().includes(keyword)) return false;
                    break;
            }
        }
        
        // 평점 필터
        if (currentFilters.rating) {
            const rating = parseInt(currentFilters.rating);
            if (review.rating < rating) return false;
        }
        
        // 상태 필터
        if (currentFilters.status && review.status !== currentFilters.status) {
            return false;
        }
        
        // 사진 여부 필터
        if (currentFilters.photo) {
            const hasPhotos = currentFilters.photo === 'true';
            if (review.hasPhotos !== hasPhotos) return false;
        }
        
        // 신고건수 필터
        if (currentFilters.reportCount) {
            const reportCount = parseInt(currentFilters.reportCount);
            if (review.reportCount < reportCount) return false;
        }
        
        return true;
    });
}

// 정렬된 데이터 가져오기
function getSortedData(data) {
    return data.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortColumn) {
            case 'date':
                aValue = new Date(a.date);
                bValue = new Date(b.date);
                break;
            case 'order':
                aValue = a.orderNumber;
                bValue = b.orderNumber;
                break;
            case 'product':
                aValue = a.productName;
                bValue = b.productName;
                break;
            case 'author':
                aValue = a.author;
                bValue = b.author;
                break;
            case 'rating':
                aValue = a.rating;
                bValue = b.rating;
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            default:
                aValue = a.date;
                bValue = b.date;
        }
        
        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
}

// 페이지네이션된 데이터 가져오기
function getPaginatedData(data) {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
}

// 페이지네이션 렌더링
function renderPagination() {
    const filteredData = getFilteredData();
    totalPages = Math.ceil(filteredData.length / pageSize);
    
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    // 이전/다음 버튼 상태
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // 페이지 번호 생성
    let pageHtml = '';
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `
            <button class="page-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `;
    }
    
    pageNumbers.innerHTML = pageHtml;
}

// 엑셀 내보내기
function handleExportExcel() {
    const filteredData = getFilteredData();
    
    // CSV 형태로 변환
    const headers = ['작성일시', '주문번호', '상품명', '작성자', '평점', '내용', '사진여부', '상태', '신고건수', '처리자'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(review => [
            review.date,
            review.orderNumber,
            review.productName,
            review.author,
            review.rating,
            `"${review.content.replace(/"/g, '""')}"`,
            review.hasPhotos ? 'Y' : 'N',
            review.status,
            review.reportCount,
            review.processor
        ].join(','))
    ].join('\n');
    
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `리뷰관리_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('엑셀 파일이 다운로드되었습니다.');
}