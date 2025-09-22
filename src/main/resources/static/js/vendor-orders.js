// src/main/resources/static/js/vendor-orders.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Vendor] 주문 목록 로드');

  const listEl       = document.getElementById('vOrdersList');
  const emptyEl      = document.getElementById('vEmptyState');
  const pagingEl     = document.getElementById('vPagination');
  const statusEl     = document.getElementById('vStatusFilter');
  const searchInput  = document.getElementById('vSearchInput');
  const searchBtn    = document.getElementById('vSearchBtn');

  const statusLabels = {
    completed: '배송완료',
    shipping:  '배송중',
    preparing: '준비중',
    cancelled: '취소됨'
  };

  let rawData = [];
  let filtered = [];
  let page = 1;
  const perPage = 5;

  function toPrice(v) {
    const n = v == null ? 0 : Number(v);
    return n.toLocaleString('ko-KR') + '원';
  }
  function toDate(s) {
    if (!s) return '';
    const d = new Date(s);
    return d.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
  }

  function tmplItem(it) {
    return `
      <div class="v-item">
        <img class="v-item-img" src="${it.image || '/images/농산물.png'}" alt="">
        <div class="v-item-info">
          <div class="v-item-name">${it.name}</div>
          <div class="v-item-sub">${it.optionText ? `옵션: ${it.optionText} / ` : ''}수량: ${it.quantity}${it.unit || ''}</div>
        </div>
        <div class="v-item-amount">${toPrice(it.price)}</div>
      </div>
    `;
  }

  function tmplCard(o) {
    const itemsHtml = (o.items || []).map(tmplItem).join('');
    const status = statusLabels[o.status] || o.status;

    return `
      <div class="v-card">
        <div class="v-card-head">
          <div class="v-card-left">
            <div class="v-order-no">주문번호: ${o.id}</div>
            <div class="v-order-date">주문일: ${toDate(o.date)}</div>
            ${o.recipientName ? `<div class="v-recipient">받는 분: ${o.recipientName}</div>` : ''}
          </div>
          <div class="v-status ${'v-' + o.status}">${status}</div>
        </div>

        <div class="v-card-body">
          <div class="v-items">${itemsHtml}</div>

          <div class="v-summary">
            <div class="v-summary-row">
              <div class="v-lbl">판매사 소계</div>
              <div class="v-val">${toPrice(o.vendorSubtotal)}</div>
            </div>
            <div class="v-actions">
              <button class="v-btn v-primary" onclick="location.href='/vendor/orderdetails?id=${encodeURIComponent(o.id)}'">
                상세보기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    if (!filtered.length) {
      listEl.style.display = 'none';
      pagingEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    listEl.style.display  = 'grid';

    const totalPages = Math.ceil(filtered.length / perPage);
    page = Math.min(Math.max(1, page), totalPages);

    const start = (page - 1) * perPage;
    const end   = start + perPage;
    const pageData = filtered.slice(start, end);

    listEl.innerHTML = pageData.map(tmplCard).join('');

    if (totalPages > 1) {
      pagingEl.style.display = 'flex';
      pagingEl.innerHTML =
        `<button class="v-page" ${page===1?'disabled':''} data-p="prev">이전</button>` +
        Array.from({length: totalPages}, (_,i)=>i+1).map(p =>
          `<button class="v-page-num ${p===page?'active':''}" data-p="${p}">${p}</button>`
        ).join('') +
        `<button class="v-page" ${page===totalPages?'disabled':''} data-p="next">다음</button>`;

      pagingEl.querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', ()=>{
          const p = b.getAttribute('data-p');
          if (p === 'prev') page = Math.max(1, page-1);
          else if (p === 'next') page = Math.min(totalPages, page+1);
          else page = parseInt(p,10);
          render();
        });
      });
    } else {
      pagingEl.style.display = 'none';
    }
  }

  function applyFilter() {
    const s = (statusEl?.value || 'all');
    const q = (searchInput?.value || '').toLowerCase().trim();

    let data = [...rawData];
    if (s !== 'all') data = data.filter(o => o.status === s);
    if (q) {
      data = data.filter(o => {
        const nameHit = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
        const rcptHit = (o.recipientName || '').toLowerCase().includes(q);
        return nameHit || rcptHit;
      });
    }
    filtered = data;
    page = 1;
    render();
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/vendor/orders/my', { credentials: 'same-origin' });
      if (!res.ok) {
        if (res.status === 401) {
          alert('판매사 로그인이 필요합니다.');
          return;
        }
        console.warn('vendor orders api error', res.status);
        return;
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.orders)) {
        rawData = data.orders;
        filtered = [...rawData];
        applyFilter();
      } else {
        rawData = [];
        filtered = [];
        render();
      }
    } catch (e) {
      console.error('vendor orders fetch fail', e);
      rawData = [];
      filtered = [];
      render();
    }
  }

  statusEl?.addEventListener('change', applyFilter);
  searchInput?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFilter(); });
  searchBtn?.addEventListener('click', applyFilter);

  fetchData();
});
