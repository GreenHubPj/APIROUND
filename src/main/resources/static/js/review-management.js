// 리뷰 관리(판매자) 페이지 — 서버 API 연동 + companyId 보정 버전

let currentPage = 1;
let totalPages = 1;
const pageSize = 20;
let sortColumn = 'date';
let sortDirection = 'desc';
let selected = new Set();

let COMPANY_ID = null; // 반드시 채워 API에 전달
let MISSING_COMPANY = false;

const filters = {
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

document.addEventListener('DOMContentLoaded', async () => {
  injectNoticeBox();
  await ensureCompanyId();   // 1) companyId 확보 시도 (data-* -> _whoami 순)
  initControls();
  queryAndRender();          // 2) 목록 로드(없으면 빈 목록 + 안내)
});

// 화면 상단에 안내 영역 삽입
function injectNoticeBox() {
  const box = document.createElement('div');
  box.id = 'noticeBox';
  box.style.display = 'none';
  box.style.margin = '12px 0';
  box.style.padding = '10px 12px';
  box.style.borderRadius = '8px';
  box.style.background = '#fff3cd';
  box.style.color = '#856404';
  box.style.border = '1px solid #ffeeba';
  box.innerText = '';
  const container = document.querySelector('.review-management-section .container');
  if (container) container.prepend(box);
}

function showNotice(msg) {
  const box = document.getElementById('noticeBox');
  if (!box) return;
  box.innerText = msg || '';
  box.style.display = msg ? 'block' : 'none';
}

async function ensureCompanyId() {
  // 0) window.__ctx.companyId 먼저
  if (window.__ctx && typeof window.__ctx.companyId !== 'undefined' && window.__ctx.companyId !== null) {
    const v = Number(window.__ctx.companyId);
    if (!Number.isNaN(v) && v > 0) {
      COMPANY_ID = v;
      document.body.dataset.companyId = String(v);
      return;
    }
  }

  // 1) body data-company-id
  const fromBody = document.body?.dataset?.companyId;
  if (fromBody && fromBody !== 'null' && fromBody !== 'undefined' && fromBody !== '') {
    const v = Number(fromBody);
    if (!Number.isNaN(v) && v > 0) {
      COMPANY_ID = v;
      return;
    }
  }

  // 2) 서버가 아는 값 조회(_whoami) – 로그인 필요
  try {
    const res = await fetch('/api/admin/reviews/_whoami', { headers: { 'Accept': 'application/json' } });
    if (res.status === 401) {
      // 로그인 아니면 안내만
      MISSING_COMPANY = true;
      showNotice('판매자 식별값(companyId)이 없어 목록을 표시할 수 없습니다. 판매자 계정으로 다시 로그인해 주세요.');
      return;
    }
    if (res.ok) {
      const j = await res.json();
      if (j && typeof j.companyId === 'number' && j.companyId > 0) {
        COMPANY_ID = j.companyId;
        document.body.dataset.companyId = String(COMPANY_ID);
        return;
      }
    }
  } catch (e) {
    // 무시하고 안내로 진행
  }

  // 3) 그래도 없으면 안내 + 빈 목록 유지
  MISSING_COMPANY = true;
  showNotice('판매자 식별값(companyId)이 없어 목록을 표시할 수 없습니다. 판매자 계정으로 다시 로그인해 주세요.');
}


function initControls() {
  // 컬럼 토글 기본 on
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.add('active'));

  // 검색
  document.getElementById('searchType')?.addEventListener('change', function () {
    filters.searchType = this.value;
  });
  document.querySelector('.search-btn')?.addEventListener('click', () => {
    filters.searchKeyword = document.getElementById('searchInput')?.value?.trim() ?? '';
    currentPage = 1;
    queryAndRender();
  });
  document.getElementById('searchInput')?.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      filters.searchKeyword = e.currentTarget.value.trim();
      currentPage = 1;
      queryAndRender();
    }
  });

  // 필터
  ['ratingFilter', 'statusFilter', 'photoFilter', 'reportFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', handleFilterChange);
  });

  // 날짜 필터
  document.getElementById('dateFilter')?.addEventListener('change', () => {
    const v = document.getElementById('dateFilter').value;
    filters.dateRange = v;
    const box = document.getElementById('customDateRange');
    if (v === 'custom') {
      box.style.display = 'block';
    } else {
      box.style.display = 'none';
      filters.startDate = '';
      filters.endDate = '';
      currentPage = 1;
      queryAndRender();
    }
  });
  document.querySelector('.apply-date-btn')?.addEventListener('click', () => {
    const s = document.getElementById('startDate').value;
    const e = document.getElementById('endDate').value;
    if (!s || !e) return alert('시작일과 종료일을 모두 선택해주세요.');
    filters.startDate = s;
    filters.endDate = e;
    currentPage = 1;
    queryAndRender();
  });

  // 컬럼 토글
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.classList.toggle('active');
      toggleColumn(this.dataset.column);
    });
  });

  // 정렬
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', function () {
      const c = this.dataset.column;
      if (sortColumn === c) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      else { sortColumn = c; sortDirection = 'asc'; }
      document.querySelectorAll('.sortable').forEach(el => el.classList.remove('asc', 'desc'));
      this.classList.add(sortDirection);
      currentPage = 1;
      queryAndRender();
    });
  });

  // 선택/일괄
  document.getElementById('selectAll')?.addEventListener('change', e => {
    const checked = e.currentTarget.checked;
    selected.clear();
    document.querySelectorAll('#reviewTableBody input[type="checkbox"]').forEach(chk => {
      chk.checked = checked;
      const id = Number(chk.dataset.reviewId);
      if (checked) selected.add(id);
    });
    updateBulkVisibility();
  });

  document.getElementById('bulkHide')?.addEventListener('click', () => bulkStatus('숨김'));
  document.getElementById('bulkDelete')?.addEventListener('click', () => bulkStatus('삭제'));
  document.getElementById('bulkStatus')?.addEventListener('click', openStatusModal);
  document.getElementById('bulkReport')?.addEventListener('click', openReportModal);

  document.getElementById('prevPage')?.addEventListener('click', () => changePage(currentPage - 1));
  document.getElementById('nextPage')?.addEventListener('click', () => changePage(currentPage + 1));

  document.getElementById('exportExcel')?.addEventListener('click', exportCsv);

  // 모달
  document.getElementById('closeModal')?.addEventListener('click', closeDetailModal);
  document.getElementById('modalClose')?.addEventListener('click', closeDetailModal);

  document.getElementById('closeStatusModal')?.addEventListener('click', closeStatusModal);
  document.getElementById('closeReportModal')?.addEventListener('click', closeReportModal);

  document.getElementById('confirmStatusChange')?.addEventListener('click', applyStatusModal);
  document.getElementById('cancelStatusChange')?.addEventListener('click', closeStatusModal);

  document.getElementById('confirmReport')?.addEventListener('click', applyReportModal);
  document.getElementById('cancelReport')?.addEventListener('click', closeReportModal);

  document.querySelector('.memo-save-btn')?.addEventListener('click', saveAdminMemo);
  document.querySelector('.reply-save-btn')?.addEventListener('click', saveReply);
  document.querySelector('.reply-edit-btn')?.addEventListener('click', editReply);
  document.querySelector('.reply-delete-btn')?.addEventListener('click', deleteReply);
  document.querySelector('.reply-cancel-btn')?.addEventListener('click', cancelReplyEdit);
}

function handleFilterChange() {
  filters.rating = document.getElementById('ratingFilter')?.value ?? '';
  filters.status = document.getElementById('statusFilter')?.value ?? '';
  filters.photo = document.getElementById('photoFilter')?.value ?? '';
  filters.reportCount = document.getElementById('reportFilter')?.value ?? '';
  currentPage = 1;
  queryAndRender();
}

function toggleColumn(column) {
  const map = { rating: 5, photos: 7, reports: 9, processor: 10 };
  const idx = map[column];
  if (idx == null) return;
  const th = document.querySelector(`thead th:nth-child(${idx + 1})`);
  const cells = document.querySelectorAll(`tbody td:nth-child(${idx + 1})`);
  const hidden = th.style.display === 'none';
  th.style.display = hidden ? '' : 'none';
  cells.forEach(td => (td.style.display = hidden ? '' : 'none'));
}

function updateBulkVisibility() {
  const box = document.querySelector('.bulk-actions');
  box.style.display = selected.size > 0 ? 'flex' : 'none';
}

function changePage(p) {
  if (p < 1 || p > totalPages) return;
  currentPage = p;
  queryAndRender();
}

async function queryAndRender() {
  // companyId가 없으면 API를 때리지 말고 빈 목록 + 안내만
  if (!COMPANY_ID && MISSING_COMPANY) {
    renderTable([]);
    renderPagination(0, 1);
    showNotice('판매자 식별값(companyId)이 없어 목록을 표시할 수 없습니다. 판매자 계정으로 다시 로그인해 주세요.');
    return;
  }

  try {
    const params = new URLSearchParams();

    // 🔴 핵심: companyId를 항상 보냄
    if (COMPANY_ID) params.set('companyId', String(COMPANY_ID));

    if (filters.searchKeyword) {
      params.set('keyword', filters.searchKeyword);
      params.set('type', filters.searchType || 'content');
    }
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.status) params.set('status', filters.status);
    if (filters.photo) params.set('photo', filters.photo);
    if (filters.reportCount) params.set('reportMin', filters.reportCount);
    if (filters.dateRange && filters.dateRange !== 'custom') params.set('dateRange', filters.dateRange);
    if (filters.startDate) params.set('start', filters.startDate);
    if (filters.endDate) params.set('end', filters.endDate);

    params.set('page', String(currentPage - 1));
    params.set('size', String(pageSize));
    params.set('sort', `${sortColumn},${sortDirection}`);

    const url = `/api/admin/reviews?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      // 서버가 400을 주더라도 alert 대신 상단 안내만
      const text = await res.text().catch(() => '');
      showNotice(text || '리뷰 목록을 불러오지 못했습니다.');
      renderTable([]);
      renderPagination(0, 1);
      return;
    }

    const data = await res.json();
    showNotice(''); // 안내 제거
    renderTable(data.content || []);
    renderPagination(data.totalElements ?? 0, data.totalPages ?? 1);
  } catch (e) {
    showNotice('목록 조회 중 오류가 발생했습니다.');
    renderTable([]);
    renderPagination(0, 1);
  }
}

function renderTable(rows) {
  const tbody = document.getElementById('reviewTableBody');
  if (!tbody) return;
  tbody.innerHTML = rows
    .map(
      r => `
    <tr>
      <td class="checkbox-col">
        <input type="checkbox" class="checkbox" data-review-id="${r.reviewId}"
          onchange="window.__ghReviewMgmt.onRowCheck(${r.reviewId}, this.checked)">
      </td>
      <td class="date-col">${escapeHtml(r.createdAt ?? '-')}</td>
      <td class="order-col">${escapeHtml(r.orderNumber ?? '-')}</td>
      <td class="product-col">${escapeHtml(r.productName ?? '-')}</td>
      <td class="author-col">${escapeHtml(r.authorName ?? '-')}</td>
      <td class="rating-col">${makeStars(r.rating ?? 0)}</td>
      <td class="content-col">${shorten(escapeHtml(r.content ?? ''), 80)}</td>
      <td class="photo-col">${(r.photoUrls?.length ?? 0) > 0 ? '📷' : '-'}</td>
      <td class="status-col"><span class="status-badge status-${r.status}">${escapeHtml(r.status ?? '-')}</span></td>
      <td class="report-col"><span class="report-badge ${r.reportCount > 0 ? 'has-reports' : 'no-reports'}">${r.reportCount ?? 0}</span></td>
      <td class="processor-col">${escapeHtml(r.processor ?? '-')}</td>
      <td class="action-col">
        <button class="action-btn detail-btn" onclick="window.__ghReviewMgmt.detail(${r.reviewId})">상세</button>
        <button class="action-btn hide-btn"   onclick="window.__ghReviewMgmt.singleStatus(${r.reviewId}, '숨김')">숨김</button>
        <button class="action-btn delete-btn" onclick="window.__ghReviewMgmt.singleStatus(${r.reviewId}, '삭제')">삭제</button>
      </td>
    </tr>
  `
    )
    .join('');

  const all = document.getElementById('selectAll');
  if (all) {
    all.checked = false;
    all.indeterminate = false;
  }
  selected.clear();
  updateBulkVisibility();
}

function renderPagination(totalElements, tp) {
  totalPages = tp || 1;
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if (prev) prev.disabled = currentPage <= 1;
  if (next) next.disabled = currentPage >= totalPages;

  const wrap = document.getElementById('pageNumbers');
  if (!wrap) return;

  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  let html = '';
  for (let i = start; i <= end; i++) {
    html += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="window.__ghReviewMgmt.goto(${i})">${i}</button>`;
  }
  wrap.innerHTML = html;
}

// helpers
function makeStars(n) {
  n = Number(n) || 0;
  let s = '';
  for (let i = 1; i <= 5; i++) s += `<span class="star ${i <= n ? '' : 'empty'}">★</span>`;
  return s;
}
function shorten(t, n) {
  return t.length > n ? t.slice(0, n) + '...' : t;
}
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

// 공개 핸들러
window.__ghReviewMgmt = {
  onRowCheck(id, checked) {
    if (checked) selected.add(id);
    else selected.delete(id);
    const bodyChecks = document.querySelectorAll('#reviewTableBody input[type="checkbox"]');
    const all = document.getElementById('selectAll');
    const checkedCount = Array.from(bodyChecks).filter(c => c.checked).length;
    if (all) {
      all.checked = checkedCount === bodyChecks.length;
      all.indeterminate = checkedCount > 0 && checkedCount < bodyChecks.length;
    }
    updateBulkVisibility();
  },
  goto: changePage,
  detail: openDetailModal,
  singleStatus(id, status) {
    if (!confirm(`이 리뷰를 ${status} 처리하시겠습니까?`)) return;
    patchStatus([id], status);
  }
};

// 일괄 상태
function bulkStatus(status) {
  if (selected.size === 0) return alert('처리할 리뷰를 선택해주세요.');
  if (!confirm(`선택한 ${selected.size}개 리뷰를 ${status} 처리하시겠습니까?`)) return;
  patchStatus(Array.from(selected), status);
}

async function patchStatus(ids, status) {
  try {
    await Promise.all(
      ids.map(id =>
        fetch(`/api/admin/reviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, companyId: COMPANY_ID })
        })
      )
    );
    alert('처리되었습니다.');
    selected.clear();
    updateBulkVisibility();
    queryAndRender();
  } catch {
    alert('상태 변경 중 오류가 발생했습니다.');
  }
}

// 상세 모달
async function openDetailModal(reviewId) {
  try {
    const res = await fetch(`/api/admin/reviews/${reviewId}?companyId=${encodeURIComponent(COMPANY_ID ?? '')}`);
    if (!res.ok) throw 0;
    const r = await res.json();

    setText('modalReviewId', r.reviewId);
    setText('modalWriteDate', r.createdAt);
    setText('modalIpAddress', r.ipAddress ?? '-');
    setText('modalUserAgent', r.userAgent ?? '-');
    setText('modalOrderNumber', r.orderNumber ?? '-');
    setText('modalProductName', r.productName ?? '-');
    setHtml('modalRating', makeStars(r.rating));
    setText('modalAuthor', r.authorName ?? '-');
    setText('modalContent', r.content ?? '');

    const g = document.getElementById('modalPhotos');
    if ((r.photoUrls?.length ?? 0) > 0) {
      g.innerHTML = r.photoUrls.map(u => `<div class="photo-item"><img src="${u}" alt="리뷰 사진"></div>`).join('');
    } else {
      g.innerHTML = '<p class="no-photo">첨부된 사진이 없습니다.</p>';
    }

    document.getElementById('adminMemo').value = r.adminMemo ?? '';

    const hist = document.getElementById('modalHistorySection');
    hist.innerHTML = (r.history ?? [])
      .map(h => `
      <div class="history-item">
        <div class="history-date">${escapeHtml(h.date)}</div>
        <div class="history-action">${escapeHtml(h.action)}</div>
        <div class="history-description">${escapeHtml(h.description)}</div>
      </div>`)
      .join('');

    const existing = document.getElementById('existingReply');
    const form = document.getElementById('replyForm');
    if (r.reply?.content) {
      document.getElementById('replyText').textContent = r.reply.content;
      existing.style.display = 'block';
      form.style.display = 'none';
    } else {
      existing.style.display = 'none';
      form.style.display = 'block';
    }

    document.getElementById('reviewDetailModal')?.classList.add('show');
    document.getElementById('modalReviewId').dataset.id = String(reviewId);
  } catch {
    alert('상세 정보를 불러오지 못했습니다.');
  }
}

function closeDetailModal() {
  document.getElementById('reviewDetailModal')?.classList.remove('show');
}

function openStatusModal() {
  if (selected.size === 0) return alert('선택된 리뷰가 없습니다.');
  document.getElementById('statusChangeModal')?.classList.add('show');
}
function closeStatusModal() {
  document.getElementById('statusChangeModal')?.classList.remove('show');
}
async function applyStatusModal() {
  const status = document.getElementById('newStatus').value;
  const reason = document.getElementById('statusReason').value.trim();
  if (!reason) return alert('변경 사유를 입력해주세요.');
  await patchStatus(Array.from(selected), status);
  closeStatusModal();
}

function openReportModal() {
  if (selected.size === 0) return alert('선택된 리뷰가 없습니다.');
  document.getElementById('reportModal')?.classList.add('show');
}
function closeReportModal() {
  document.getElementById('reportModal')?.classList.remove('show');
}
async function applyReportModal() {
  const reason = document.querySelector('input[name="reportReason"]:checked');
  const action = document.getElementById('reportAction').value;
  const memo = document.getElementById('reportMemo').value.trim();
  if (!reason) return alert('신고 사유를 선택해주세요.');

  try {
    await Promise.all(
      Array.from(selected).map(id =>
        fetch(`/api/admin/reviews/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reported: true, reportAction: action, reportReason: reason.value, reportMemo: memo, companyId: COMPANY_ID
          })
        })
      )
    );
    alert('신고 처리가 완료되었습니다.');
    selected.clear();
    updateBulkVisibility();
    closeReportModal();
    queryAndRender();
  } catch {
    alert('신고 처리 중 오류가 발생했습니다.');
  }
}

async function saveAdminMemo() {
  const id = document.getElementById('modalReviewId')?.dataset?.id;
  const memo = document.getElementById('adminMemo').value;
  if (!id) return;
  try {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminMemo: memo, companyId: COMPANY_ID })
    });
    if (!res.ok) throw 0;
    alert('관리자 메모가 저장되었습니다.');
  } catch {
    alert('메모 저장 중 오류가 발생했습니다.');
  }
}

async function saveReply() {
  const id = document.getElementById('modalReviewId')?.dataset?.id;
  const content = document.getElementById('replyContent').value.trim();
  if (!id) return;
  if (!content) return alert('답글 내용을 입력해주세요.');
  try {
    const res = await fetch(`/api/admin/reviews/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, companyId: COMPANY_ID })
    });
    if (!res.ok) throw 0;
    alert('답글이 등록되었습니다.');
    openDetailModal(Number(id));
  } catch {
    alert('답글 등록 중 오류가 발생했습니다.');
  }
}

function editReply() {
  const text = document.getElementById('replyText')?.textContent ?? '';
  document.getElementById('replyContent').value = text;
  document.getElementById('existingReply').style.display = 'none';
  document.getElementById('replyForm').style.display = 'block';
  document.querySelector('.reply-cancel-btn').style.display = 'inline-block';
}

function deleteReply() {
  const id = document.getElementById('modalReviewId')?.dataset?.id;
  if (!id) return;
  if (!confirm('답글을 삭제하시겠습니까?')) return;
  fetch(`/api/admin/reviews/${id}/reply?companyId=${encodeURIComponent(COMPANY_ID ?? '')}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw 0;
      alert('답글이 삭제되었습니다.');
      openDetailModal(Number(id));
    })
    .catch(() => alert('답글 삭제 중 오류가 발생했습니다.'));
}

function cancelReplyEdit() {
  document.getElementById('existingReply').style.display = 'block';
  document.getElementById('replyForm').style.display = 'none';
  document.querySelector('.reply-cancel-btn').style.display = 'none';
  document.getElementById('replyContent').value = '';
}

function exportCsv() {
  const rows = Array.from(document.querySelectorAll('#reviewTableBody tr')).map(tr =>
    Array.from(tr.querySelectorAll('td')).map(td => td.innerText.replace(/\n/g, ' ').trim())
  );
  const header = ['선택', '작성일시', '주문번호', '상품명', '작성자', '평점', '내용', '사진', '상태', '신고', '처리자', '액션'];
  const csv = [header, ...rows].map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `리뷰관리_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v ?? '';
}
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html ?? '';
}
