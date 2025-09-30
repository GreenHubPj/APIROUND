/**
 * 재사용 가능한 페이징 컴포넌트
 * 다양한 페이지에서 사용할 수 있는 범용 페이징 처리
 */
class Pagination {
    constructor(options = {}) {
        this.container = options.container;
        this.items = options.items || [];
        this.itemsPerPage = options.itemsPerPage || 12;
        this.maxVisiblePages = options.maxVisiblePages || 5;
        this.onPageChange = options.onPageChange || (() => {});
        this.animation = options.animation || true;
        this.animationDelay = options.animationDelay || 80;
        
        this.totalItems = this.items.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
        this.currentPage = 1;
        
        this.init();
    }
    
    init() {
        if (this.totalItems === 0) {
            this.hidePagination();
            return;
        }
        
        this.createPaginationUI();
        this.showPage(1);
    }
    
    createPaginationUI() {
        if (!this.container) return;
        if (this.totalPages <= 1) {
            this.hidePagination();
            return;
        }
        
        this.container.style.display = '';
        this.container.innerHTML = `
            <div class="pagination-info">
                <span id="pageInfo"></span>
            </div>
            <div class="pagination">
                <button class="page-btn prev-btn" id="prevBtn" disabled><span>← 이전</span></button>
                <div class="page-numbers" id="pageNumbers">${this.generatePageNumbers()}</div>
                <button class="page-btn next-btn" id="nextBtn" ${this.totalPages === 1 ? 'disabled' : ''}><span>다음 →</span></button>
            </div>
        `;
        
        this.addEventListeners();
        this.updatePaginationUI();
    }
    
    generatePageNumbers() {
        let startPage = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + this.maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < this.maxVisiblePages) {
            startPage = Math.max(1, endPage - this.maxVisiblePages + 1);
        }
        
        let html = '';
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        return html;
    }
    
    addEventListeners() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        prevBtn?.addEventListener('click', () => {
            if (this.currentPage > 1) this.showPage(this.currentPage - 1);
        });
        
        nextBtn?.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) this.showPage(this.currentPage + 1);
        });
        
        const pageNumbersWrap = document.getElementById('pageNumbers');
        pageNumbersWrap?.addEventListener('click', (e) => {
            const btn = e.target.closest('.page-number');
            if (!btn) return;
            const page = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(page)) this.showPage(page);
        });
    }
    
    showPage(page) {
        this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalItems);
        
        // 아이템 표시/숨김 처리
        this.items.forEach((item, idx) => {
            if (item.element) {
                item.element.style.display = (idx >= startIndex && idx < endIndex) ? 'block' : 'none';
                
                if (this.animation && idx >= startIndex && idx < endIndex) {
                    item.element.style.opacity = '0';
                    item.element.style.transform = 'translateY(30px)';
                }
            }
        });
        
        // 애니메이션 적용
        if (this.animation) {
            requestAnimationFrame(() => {
                this.items.slice(startIndex, endIndex).forEach((item, i) => {
                    if (item.element) {
                        item.element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                        setTimeout(() => {
                            item.element.style.opacity = '1';
                            item.element.style.transform = 'translateY(0)';
                        }, i * this.animationDelay);
                    }
                });
            });
        }
        
        // 페이지 번호 영역 재생성
        const pageNumbersWrap = document.getElementById('pageNumbers');
        if (pageNumbersWrap) pageNumbersWrap.innerHTML = this.generatePageNumbers();
        
        this.updatePaginationUI();
        
        // 콜백 함수 호출
        this.onPageChange(this.currentPage, startIndex, endIndex);
    }
    
    updatePaginationUI() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        
        // 페이지 번호 활성화 상태 업데이트
        document.querySelectorAll('.page-number').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.page, 10) === this.currentPage);
        });
        
        // 이전/다음 버튼 상태 업데이트
        if (prevBtn) prevBtn.disabled = (this.currentPage === 1);
        if (nextBtn) nextBtn.disabled = (this.currentPage === this.totalPages);
        
        // 페이지 정보 업데이트
        if (pageInfo) {
            const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
            const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
            pageInfo.textContent = `${this.currentPage}페이지 (${startItem}-${endItem} / 총 ${this.totalItems}개)`;
        }
    }
    
    hidePagination() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    // 외부에서 호출할 수 있는 메서드들
    goToPage(page) {
        this.showPage(page);
    }
    
    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.showPage(this.currentPage + 1);
        }
    }
    
    goToPrevPage() {
        if (this.currentPage > 1) {
            this.showPage(this.currentPage - 1);
        }
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.totalItems = this.items.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
        this.currentPage = 1;
        this.init();
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
    
    getTotalPages() {
        return this.totalPages;
    }
    
    getTotalItems() {
        return this.totalItems;
    }
}

// 전역에서 사용할 수 있도록 window 객체에 등록
window.Pagination = Pagination;