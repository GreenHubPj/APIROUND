// 환불 관리 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수
    let currentPage = 1;
    let totalPages = 1;
    let selectedRefunds = new Set();
    let currentRefundData = null;
    let filteredData = [];

    // 초기 데이터 (실제 구현 시 서버에서 가져와야 함)
    const sampleRefundData = [
        {
            id: 1,
            requestDate: '2024-01-15',
            orderNumber: 'ORD-2024-001',
            customerName: '김철수',
            productName: '제주 감귤 5kg',
            quantity: 2,
            type: '환불',
            reason: '상품 불량',
            amount: 45000,
            status: '신청',
            attachment: 'product_image.jpg',
            orderDate: '2024-01-10',
            paymentMethod: '카드결제',
            totalAmount: 50000,
            refundMethod: '계좌환불',
            customerPhone: '010-1234-5678',
            customerEmail: 'kim@example.com',
            accountNumber: '123-456-789012',
            history: [
                { date: '2024-01-15 14:30', status: '신청', description: '환불 신청이 접수되었습니다.' }
            ]
        },
        {
            id: 2,
            requestDate: '2024-01-14',
            orderNumber: 'ORD-2024-002',
            customerName: '이영희',
            productName: '친환경 쌀 10kg',
            quantity: 1,
            type: '교환',
            reason: '사이즈 불일치',
            amount: 35000,
            status: '승인대기',
            attachment: null,
            orderDate: '2024-01-08',
            paymentMethod: '계좌이체',
            totalAmount: 35000,
            refundMethod: '상품교환',
            customerPhone: '010-9876-5432',
            customerEmail: 'lee@example.com',
            accountNumber: null,
            history: [
                { date: '2024-01-14 09:15', status: '신청', description: '교환 신청이 접수되었습니다.' },
                { date: '2024-01-14 16:20', status: '승인대기', description: '교환 승인 대기 중입니다.' }
            ]
        },
        {
            id: 3,
            requestDate: '2024-01-13',
            orderNumber: 'ORD-2024-003',
            customerName: '박민수',
            productName: '유기농 당근 3kg',
            quantity: 3,
            type: '환불',
            reason: '단순 변심',
            amount: 24000,
            status: '처리중',
            attachment: 'damage_photo.jpg',
            orderDate: '2024-01-05',
            paymentMethod: '카드결제',
            totalAmount: 25000,
            refundMethod: '계좌환불',
            customerPhone: '010-5555-1234',
            customerEmail: 'park@example.com',
            accountNumber: '987-654-321098',
            history: [
                { date: '2024-01-13 11:45', status: '신청', description: '환불 신청이 접수되었습니다.' },
                { date: '2024-01-13 15:30', status: '승인대기', description: '환불 승인 대기 중입니다.' },
                { date: '2024-01-14 10:15', status: '처리중', description: '환불 처리가 진행 중입니다.' }
            ]
        },
        {
            id: 4,
            requestDate: '2024-01-12',
            orderNumber: 'ORD-2024-004',
            customerName: '정수진',
            productName: '제주 흑돼지 1kg',
            quantity: 1,
            type: '교환',
            reason: '상품 불량',
            amount: 55000,
            status: '완료',
            attachment: 'defect_image.jpg',
            orderDate: '2024-01-03',
            paymentMethod: '계좌이체',
            totalAmount: 55000,
            refundMethod: '상품교환',
            customerPhone: '010-7777-8888',
            customerEmail: 'jung@example.com',
            accountNumber: '456-789-123456',
            history: [
                { date: '2024-01-12 13:20', status: '신청', description: '교환 신청이 접수되었습니다.' },
                { date: '2024-01-12 16:45', status: '승인대기', description: '교환 승인 대기 중입니다.' },
                { date: '2024-01-13 09:30', status: '처리중', description: '교환 처리가 진행 중입니다.' },
                { date: '2024-01-13 14:15', status: '완료', description: '교환 처리가 완료되었습니다.' }
            ]
        },
        {
            id: 5,
            requestDate: '2024-01-11',
            orderNumber: 'ORD-2024-005',
            customerName: '최동현',
            productName: '친환경 토마토 2kg',
            quantity: 2,
            type: '환불',
            reason: '배송 오류',
            amount: 18000,
            status: '반려',
            attachment: null,
            orderDate: '2024-01-01',
            paymentMethod: '카드결제',
            totalAmount: 18000,
            refundMethod: '카드환불',
            customerPhone: '010-3333-4444',
            customerEmail: 'choi@example.com',
            accountNumber: null,
            history: [
                { date: '2024-01-11 10:30', status: '신청', description: '환불 신청이 접수되었습니다.' },
                { date: '2024-01-11 14:20', status: '반려', description: '환불 사유가 불충분하여 반려되었습니다.' }
            ]
        }
    ];

    // 초기화
    init();

    function init() {
        filteredData = [...sampleRefundData];
        renderTable();
        setupEventListeners();
        updatePagination();
    }

    // 이벤트 리스너 설정
    function setupEventListeners() {
        // 필터 이벤트
        document.getElementById('dateFilter').addEventListener('change', handleDateFilter);
        document.getElementById('typeFilter').addEventListener('change', handleTypeFilter);
        document.getElementById('statusFilter').addEventListener('change', handleStatusFilter);
        document.getElementById('searchInput').addEventListener('input', handleSearch);
        document.querySelector('.search-btn').addEventListener('click', handleSearch);

        // 직접입력 날짜 필터
        document.getElementById('dateFilter').addEventListener('change', function() {
            const customDateRange = document.getElementById('customDateRange');
            if (this.value === 'custom') {
                customDateRange.style.display = 'block';
            } else {
                customDateRange.style.display = 'none';
            }
        });

        document.querySelector('.apply-date-btn').addEventListener('click', applyCustomDateFilter);

        // 일괄 처리 버튼
        document.getElementById('bulkApprove').addEventListener('click', () => handleBulkAction('approve'));
        document.getElementById('bulkReject').addEventListener('click', () => handleBulkAction('reject'));
        document.getElementById('bulkComplete').addEventListener('click', () => handleBulkAction('complete'));

        // 전체 선택 체크박스
        document.getElementById('selectAll').addEventListener('change', handleSelectAll);

        // 페이지네이션
        document.getElementById('prevPage').addEventListener('click', () => changePage(currentPage - 1));
        document.getElementById('nextPage').addEventListener('click', () => changePage(currentPage + 1));

        // 모달 이벤트
        document.getElementById('closeModal').addEventListener('click', closeModal);
        document.getElementById('modalClose').addEventListener('click', closeModal);
        document.getElementById('closeRejectModal').addEventListener('click', closeRejectModal);
        document.getElementById('cancelReject').addEventListener('click', closeRejectModal);

        // 모달 액션 버튼
        document.getElementById('modalApprove').addEventListener('click', () => handleModalAction('approve'));
        document.getElementById('modalReject').addEventListener('click', () => handleModalAction('reject'));
        document.getElementById('modalComplete').addEventListener('click', () => handleModalAction('complete'));

        // 반려 확인 버튼
        document.getElementById('confirmReject').addEventListener('click', confirmReject);

        // 모달 오버레이 클릭으로 닫기
        document.getElementById('refundDetailModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        document.getElementById('rejectReasonModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeRejectModal();
            }
        });
    }

    // 테이블 렌더링
    function renderTable() {
        const tbody = document.getElementById('refundTableBody');
        tbody.innerHTML = '';

        const startIndex = (currentPage - 1) * 10;
        const endIndex = Math.min(startIndex + 10, filteredData.length);
        const pageData = filteredData.slice(startIndex, endIndex);

        pageData.forEach(refund => {
            const row = createTableRow(refund);
            tbody.appendChild(row);
        });

        updateSelectAllCheckbox();
    }

    // 테이블 행 생성
    function createTableRow(refund) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="checkbox-col">
                <input type="checkbox" class="checkbox row-checkbox" data-id="${refund.id}">
            </td>
            <td class="date-col">${formatDate(refund.requestDate)}</td>
            <td class="order-col">${refund.orderNumber}</td>
            <td class="customer-col">${refund.customerName}</td>
            <td class="product-col">${refund.productName}<br><small>수량: ${refund.quantity}</small></td>
            <td class="type-col">
                <span class="type-badge type-${refund.type}">${refund.type}</span>
            </td>
            <td class="reason-col">${refund.reason}</td>
            <td class="amount-col">${formatCurrency(refund.amount)}</td>
            <td class="status-col">
                <span class="status-badge status-${refund.status}">${refund.status}</span>
            </td>
            <td class="file-col">
                ${refund.attachment ? 
                    `<button class="file-download-btn" onclick="downloadFile('${refund.attachment}')">다운로드</button>` : 
                    '-'
                }
            </td>
            <td class="action-col">
                <button class="action-btn approve-btn" onclick="handleSingleAction(${refund.id}, 'approve')">승인</button>
                <button class="action-btn reject-btn" onclick="handleSingleAction(${refund.id}, 'reject')">반려</button>
                <button class="action-btn" onclick="showRefundDetail(${refund.id})" style="background-color: #6c757d; color: white;">상세보기</button>
            </td>
        `;

        // 체크박스 이벤트
        const checkbox = row.querySelector('.row-checkbox');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedRefunds.add(refund.id);
            } else {
                selectedRefunds.delete(refund.id);
            }
            updateSelectAllCheckbox();
        });

        return row;
    }

    // 날짜 필터 처리
    function handleDateFilter() {
        const filter = document.getElementById('dateFilter').value;
        const today = new Date();
        
        filteredData = sampleRefundData.filter(refund => {
            const refundDate = new Date(refund.requestDate);
            
            switch(filter) {
                case 'today':
                    return refundDate.toDateString() === today.toDateString();
                case 'week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return refundDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return refundDate >= monthAgo;
                default:
                    return true;
            }
        });
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // 직접입력 날짜 필터 적용
    function applyCustomDateFilter() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate || !endDate) {
            alert('시작일과 종료일을 모두 선택해주세요.');
            return;
        }
        
        filteredData = sampleRefundData.filter(refund => {
            const refundDate = new Date(refund.requestDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return refundDate >= start && refundDate <= end;
        });
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // 유형 필터 처리
    function handleTypeFilter() {
        const filter = document.getElementById('typeFilter').value;
        
        if (filter === '') {
            filteredData = [...sampleRefundData];
        } else {
            filteredData = sampleRefundData.filter(refund => refund.type === filter);
        }
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // 상태 필터 처리
    function handleStatusFilter() {
        const filter = document.getElementById('statusFilter').value;
        
        if (filter === '') {
            filteredData = [...sampleRefundData];
        } else {
            filteredData = sampleRefundData.filter(refund => refund.status === filter);
        }
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // 검색 처리
    function handleSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        filteredData = sampleRefundData.filter(refund => 
            refund.orderNumber.toLowerCase().includes(searchTerm) ||
            refund.customerName.toLowerCase().includes(searchTerm)
        );
        
        currentPage = 1;
        renderTable();
        updatePagination();
    }

    // 전체 선택 처리
    function handleSelectAll() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
            const refundId = parseInt(checkbox.dataset.id);
            
            if (selectAllCheckbox.checked) {
                selectedRefunds.add(refundId);
            } else {
                selectedRefunds.delete(refundId);
            }
        });
    }

    // 전체 선택 체크박스 업데이트
    function updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAll');
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
        
        if (rowCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === rowCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length > 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    // 일괄 처리
    function handleBulkAction(action) {
        if (selectedRefunds.size === 0) {
            alert('처리할 항목을 선택해주세요.');
            return;
        }
        
        const actionText = action === 'approve' ? '승인' : action === 'reject' ? '반려' : action === 'exchange' ? '교환' : '완료';
        const confirmMessage = `선택한 ${selectedRefunds.size}개 항목을 ${actionText}하시겠습니까?`;
        
        if (confirm(confirmMessage)) {
            if (action === 'reject') {
                showRejectModal();
            } else {
                processBulkAction(action);
            }
        }
    }

    // 일괄 처리 실행
    function processBulkAction(action) {
        selectedRefunds.forEach(refundId => {
            const refund = sampleRefundData.find(r => r.id === refundId);
            if (refund) {
                updateRefundStatus(refund, action);
            }
        });
        
        selectedRefunds.clear();
        filteredData = [...sampleRefundData];
        renderTable();
        updatePagination();
        alert('처리가 완료되었습니다.');
    }

    // 단일 액션 처리
    function handleSingleAction(refundId, action) {
        const refund = sampleRefundData.find(r => r.id === refundId);
        if (!refund) return;
        
        const actionText = action === 'approve' ? '승인' : action === 'reject' ? '반려' : action === 'exchange' ? '교환' : '완료';
        const confirmMessage = `이 ${refund.type}을 ${actionText}하시겠습니까?`;
        
        if (confirm(confirmMessage)) {
            if (action === 'reject') {
                currentRefundData = refund;
                showRejectModal();
            } else {
                updateRefundStatus(refund, action);
                filteredData = [...sampleRefundData];
                renderTable();
                alert('처리가 완료되었습니다.');
            }
        }
    }

    // 환불 상태 업데이트
    function updateRefundStatus(refund, action) {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
        
        let newStatus = '';
        let description = '';
        
        switch(action) {
            case 'approve':
                newStatus = '승인대기';
                description = `${refund.type}이 승인되었습니다.`;
                break;
            case 'reject':
                newStatus = '반려';
                description = `${refund.type}이 반려되었습니다.`;
                break;
            case 'exchange':
                newStatus = '처리중';
                description = '교환 처리가 진행 중입니다.';
                break;
            case 'complete':
                newStatus = '완료';
                description = `${refund.type} 처리가 완료되었습니다.`;
                break;
        }
        
        refund.status = newStatus;
        refund.history.push({
            date: timestamp,
            status: newStatus,
            description: description
        });
    }

    // 환불 상세보기
    function showRefundDetail(refundId) {
        const refund = sampleRefundData.find(r => r.id === refundId);
        if (!refund) return;
        
        currentRefundData = refund;
        
        // 모달 데이터 채우기
        document.getElementById('modalOrderNumber').textContent = refund.orderNumber;
        document.getElementById('modalOrderDate').textContent = formatDate(refund.orderDate);
        document.getElementById('modalPaymentMethod').textContent = refund.paymentMethod;
        document.getElementById('modalTotalAmount').textContent = formatCurrency(refund.totalAmount);
        document.getElementById('modalRefundReason').textContent = refund.reason;
        document.getElementById('modalRefundDate').textContent = formatDate(refund.requestDate);
        document.getElementById('modalRefundAmount').textContent = formatCurrency(refund.amount);
        document.getElementById('modalRefundMethod').textContent = refund.refundMethod;
        document.getElementById('modalCustomerName').textContent = refund.customerName;
        document.getElementById('modalCustomerPhone').textContent = refund.customerPhone;
        document.getElementById('modalCustomerEmail').textContent = refund.customerEmail;
        document.getElementById('modalAccountNumber').textContent = refund.accountNumber || '-';
        
        // 첨부 파일 섹션
        const fileSection = document.getElementById('modalFileSection');
        if (refund.attachment) {
            fileSection.innerHTML = `
                <div class="file-item">
                    <span class="file-icon">📎</span>
                    <span class="file-name">${refund.attachment}</span>
                    <button class="file-download-btn" onclick="downloadFile('${refund.attachment}')">다운로드</button>
                </div>
            `;
        } else {
            fileSection.innerHTML = '<p class="no-file">첨부된 파일이 없습니다.</p>';
        }
        
        // 처리 이력 섹션
        const historySection = document.getElementById('modalHistorySection');
        historySection.innerHTML = '';
        refund.history.forEach(history => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-date">${history.date}</div>
                <div class="history-status status-${history.status}">${history.status}</div>
                <div class="history-description">${history.description}</div>
            `;
            historySection.appendChild(historyItem);
        });
        
        // 모달 표시
        document.getElementById('refundDetailModal').classList.add('show');
    }

    // 모달 액션 처리
    function handleModalAction(action) {
        if (!currentRefundData) return;
        
        const actionText = action === 'approve' ? '승인' : action === 'reject' ? '반려' : action === 'exchange' ? '교환' : '완료';
        const confirmMessage = `이 ${currentRefundData.type}을 ${actionText}하시겠습니까?`;
        
        if (confirm(confirmMessage)) {
            if (action === 'reject') {
                showRejectModal();
            } else {
                updateRefundStatus(currentRefundData, action);
                filteredData = [...sampleRefundData];
                renderTable();
                closeModal();
                alert('처리가 완료되었습니다.');
            }
        }
    }

    // 반려 모달 표시
    function showRejectModal() {
        document.getElementById('rejectReasonModal').classList.add('show');
    }

    // 반려 모달 닫기
    function closeRejectModal() {
        document.getElementById('rejectReasonModal').classList.remove('show');
        document.getElementById('rejectReason').value = '';
    }

    // 반려 확인
    function confirmReject() {
        const reason = document.getElementById('rejectReason').value.trim();
        
        if (!reason) {
            alert('반려 사유를 입력해주세요.');
            return;
        }
        
        if (currentRefundData) {
            // 단일 반려
            updateRefundStatus(currentRefundData, 'reject');
            currentRefundData.history[currentRefundData.history.length - 1].description += ` (사유: ${reason})`;
            filteredData = [...sampleRefundData];
            renderTable();
            closeModal();
            closeRejectModal();
            alert('반려 처리가 완료되었습니다.');
        } else {
            // 일괄 반려
            selectedRefunds.forEach(refundId => {
                const refund = sampleRefundData.find(r => r.id === refundId);
                if (refund) {
                    updateRefundStatus(refund, 'reject');
                    refund.history[refund.history.length - 1].description += ` (사유: ${reason})`;
                }
            });
            
            selectedRefunds.clear();
            filteredData = [...sampleRefundData];
            renderTable();
            updatePagination();
            closeRejectModal();
            alert('일괄 반려 처리가 완료되었습니다.');
        }
    }

    // 모달 닫기
    function closeModal() {
        document.getElementById('refundDetailModal').classList.remove('show');
        currentRefundData = null;
    }

    // 페이지 변경
    function changePage(page) {
        if (page < 1 || page > totalPages) return;
        
        currentPage = page;
        renderTable();
        updatePagination();
    }

    // 페이지네이션 업데이트
    function updatePagination() {
        totalPages = Math.ceil(filteredData.length / 10);
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');
        
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
        
        pageNumbers.innerHTML = '';
        
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => changePage(i));
            pageNumbers.appendChild(pageBtn);
        }
    }

    // 유틸리티 함수들
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    }

    function downloadFile(filename) {
        // 실제 구현 시 서버에서 파일 다운로드 처리
        alert(`${filename} 파일을 다운로드합니다.`);
    }

    // 전역 함수로 노출 (HTML에서 호출하기 위해)
    window.handleSingleAction = handleSingleAction;
    window.showRefundDetail = showRefundDetail;
    window.downloadFile = downloadFile;
});

