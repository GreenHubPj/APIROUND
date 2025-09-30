// /src/main/resources/static/js/customerOrder.js
// 고객 주문관리 페이지 JavaScript (실데이터 연동 버전)

let salesChart = null;

// 전역 상태
const state = {
    orders: [],        // [{orderNumber, createdAt: Date, amount: number, uiStatus}]
    filtered: [],      // 현재 필터(기간/탭) 적용된 목록
    activeStatusTab: 'all',
    dateRange: { start: null, end: null }, // Date
};

// UI에 쓰는 상태 라벨 & 버튼 클래스 매핑
const STATUS_BTN = {
    new:        { text: '신규 주문',  cls: 'new' },
    confirmed:  { text: '주문 확인',  cls: 'confirmed' },
    preparing:  { text: '배송 준비',  cls: 'preparing' },
    shipping:   { text: '배송중',    cls: 'shipping' },
    completed:  { text: '완료',      cls: 'completed' },
    cancelled:  { text: '재주문',    cls: 'cancelled' },
};

document.addEventListener('DOMContentLoaded', async function() {
    initializeDateFilters();
    initializeTabs();
    initializeChartToggle();
    initializeAnimations();

    // 1) 데이터 로드 (회사 로그인 필요)
    await loadVendorOrders();

    // 2) 기간 기본값은 최근 30일 — ★항상 적용
    const today = new Date();
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    setDateInputs(oneMonthAgo, today);
    applyDateFilter(oneMonthAgo, today);

    // 3) 렌더 — ★항상 호출 (0건이어도 더미 제거)
    initializeChart();
    renderAll();

    // 4) 라이브 동기화
    subscribeOrderStatusStream();
});

// ====== SSE 구독 ======
function subscribeOrderStatusStream() {
    let es;
    const connect = () => {
        try {
            const url = '/api/seller/orders/stream';
            es = new EventSource(url);

            es.addEventListener('ping', () => {/* keep-alive */});

            es.addEventListener('order-status', (ev) => {
                try {
                    const msg = JSON.parse(ev.data); // { orderNumber, uiStatus }
                    if (!msg || !msg.orderNumber) return;

                    const key = (msg.uiStatus || 'preparing').toLowerCase();

                    // 상태 메모리 갱신
                    const t1 = state.orders.find(o => o.orderNumber === msg.orderNumber);
                    const t2 = state.filtered.find(o => o.orderNumber === msg.orderNumber);
                    if (t1) t1.uiStatus = key;
                    if (t2) t2.uiStatus = key;

                    // 화면 갱신
                    renderAll();
                    showNotification(`#${msg.orderNumber} 상태가 '${key}'로 변경되었습니다.`, 'success');
                } catch (_) {}
            });

            es.onerror = () => {
                try { es.close(); } catch (_) {}
                setTimeout(connect, 3000);
            };
        } catch (_) {
            // SSE 미지원/차단 시 무시
        }
    };
    connect();
}

// ========================= 서버 연동 =========================
async function loadVendorOrders() {
    try {
        const res = await fetch('/api/seller/orders/my', { credentials: 'include' });
        if (!res.ok) {
            if (res.status === 401) {
                showNotification('판매사 로그인이 필요합니다.', 'error');
            } else {
                showNotification(`주문 조회 실패 (HTTP ${res.status})`, 'error');
            }
            state.orders = [];
            return;
        }

        const json = await res.json();
        if (!json.success || !Array.isArray(json.orders)) {
            showNotification('API 응답 형식이 올바르지 않습니다.', 'error');
            state.orders = [];
            return;
        }

        // 서버 DTO: VendorOrderSummaryDto
        state.orders = json.orders.map(o => {
            const created = o.date ? new Date(o.date) : new Date();
            const amt = toNumber(o.vendorSubtotal ?? o.finalAmount ?? 0);
            const uiStatus = (o.status || 'preparing').toLowerCase();

            const items = Array.isArray(o.items) ? o.items.map(it => ({
                name: it.name,
                quantity: Number(it.quantity ?? 0),
                price: toNumber(it.price ?? it.lineAmount ?? 0),
            })) : [];

            return {
                orderNumber: o.id,
                createdAt: created,
                amount: amt,
                uiStatus,
                items,
            };
        });
    } catch (err) {
        console.warn('주문 로드 실패:', err);
        state.orders = [];
    }
}

// ========================= 렌더링 =========================
function renderAll() {
    renderOrderList();
    updateStatusCardsFromState();
    updateDailySummaryText();
    updateChartsFromState();
    renderSalesSummary();
}

function renderOrderList() {
    const list = document.querySelector('.order-list');
    if (!list) return;

    const rows = filterByStatus(state.filtered, state.activeStatusTab);

    if (rows.length === 0) {
        list.innerHTML = `
            <div style="padding:1rem; text-align:center; color:#6c757d;">
                표시할 주문이 없습니다.
            </div>`;
        return;
    }

    rows.sort((a, b) => b.createdAt - a.createdAt);

    list.innerHTML = rows.map(r => {
        const btn = STATUS_BTN[r.uiStatus] || STATUS_BTN.preparing;
        const timeText = renderTimeInfo(r.createdAt);
        const formattedAmount = '₩' + r.amount.toLocaleString();
        const isDisabled = r.uiStatus === 'completed';
        const disabledAttr = isDisabled ? 'disabled' : '';

        const productInfo = r.items && r.items.length > 0
            ? r.items.map(item => `${escapeHtml(item.name)} × ${item.quantity}개`).join(', ')
            : '상품 정보 없음';

        return `
        <div class="order-item" data-status="${r.uiStatus}">
            <div class="order-info">
                <div class="order-number">#${escapeHtml(r.orderNumber)}</div>
                <div class="order-time">${timeText}</div>
                <div class="order-products">${productInfo}</div>
            </div>
            <div class="order-amount">${formattedAmount}</div>
            <div class="order-actions">
                <button class="status-button ${btn.cls}" ${disabledAttr}>${btn.text}</button>
            </div>
        </div>`;
    }).join('');

    initializeOrderStatusUpdates();
}

function updateStatusCardsFromState() {
    const counts = { new:0, confirmed:0, preparing:0, shipping:0, completed:0, cancelled:0 };
    state.filtered.forEach(o => { if (counts[o.uiStatus] !== undefined) counts[o.uiStatus]++; });

    const newOrdersCard       = document.querySelector('.new-orders .card-number');
    const confirmedOrdersCard = document.querySelector('.confirmed-orders .card-number');
    const cancelledOrdersCard = document.querySelector('.cancelled-orders .card-number');
    const totalOrdersCard     = document.querySelector('.total-orders .card-number');

    if (newOrdersCard)       newOrdersCard.textContent = counts.new;
    if (confirmedOrdersCard) confirmedOrdersCard.textContent = counts.confirmed;
    if (cancelledOrdersCard) cancelledOrdersCard.textContent = counts.cancelled;
    if (totalOrdersCard)     totalOrdersCard.textContent = state.filtered.length;
}

function updateDailySummaryText() {
    const summaryText = document.querySelector('.summary-text');
    if (!summaryText) return;

    const orders = filterByStatus(state.filtered, state.activeStatusTab);
    const total = orders.reduce((sum, o) => sum + o.amount, 0);
    summaryText.textContent = `주문 ${orders.length}건 매출 ₩${total.toLocaleString()}`;
}

// 매출 요약(우측 카드)
function renderSalesSummary() {
    const section = document.querySelector('.sales-summary-section');
    if (!section) return;
    const values = section.querySelectorAll('.summary-grid .summary-item .summary-value');
    if (values.length < 6) return;
    const setVal = (i, t) => { if (values[i]) values[i].textContent = t; };

    const orders = state.filtered;
    const totalSales  = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalOrders = orders.length;
    const avgAmount   = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    const completed = orders.filter(o => o.uiStatus === 'completed').length;
    const completionRate = totalOrders > 0 ? (completed * 100) / totalOrders : 0;

    const hourCounts = Array(24).fill(0);
    orders.forEach(o => { hourCounts[o.createdAt.getHours()]++; });
    const peakHour = hourCounts.reduce((best, v, i, arr) => v > arr[best] ? i : best, 0);
    const peakHourLabel = `${String(peakHour).padStart(2,'0')}:00-${String((peakHour+1)%24).padStart(2,'0')}:00`;

    let bestProduct = '-';
    const productQty = new Map();
    orders.forEach(o => (o.items || []).forEach(it => {
        const key = it.name || '상품';
        const q = Number(it.quantity) || 0;
        productQty.set(key, (productQty.get(key) || 0) + q);
    }));
    if (productQty.size > 0) bestProduct = [...productQty.entries()].sort((a,b)=>b[1]-a[1])[0][0];

    setVal(0, `₩${totalSales.toLocaleString()}`);
    setVal(1, `${totalOrders}건`);
    setVal(2, `₩${avgAmount.toLocaleString()}`);
    setVal(3, `${completionRate.toFixed(1)}%`);
    setVal(4, peakHourLabel);
    setVal(5, bestProduct);
}

// ========================= 차트 =========================
function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '일별 매출',
                data: [],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#28a745',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: baseChartOptions('#28a745', 'rgba(40, 167, 69, 0.1)')
    });
}

function initializeChartToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            changeChartView(view);
        });
    });
}

function changeChartView(view) {
    if (!salesChart) return;
    if (view === 'daily') {
        const { labels, data } = buildDailySeries(state.filtered);
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = data;
        applyChartColors(salesChart, '#28a745', 'rgba(40, 167, 69, 0.1)');
    } else {
        const { labels, data } = buildHourlySeries(state.filtered);
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = data;
        applyChartColors(salesChart, '#20c997', 'rgba(32, 201, 151, 0.1)');
    }
    salesChart.update('active');
}

function updateChartsFromState() {
    const dailyBtn = document.querySelector('.toggle-btn[data-view="daily"]');
    if (dailyBtn) dailyBtn.classList.add('active');
    changeChartView('daily');
}

function buildDailySeries(rows) {
    const map = new Map(); // 'M/D' -> total
    rows.forEach(o => {
        const d = o.createdAt;
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        map.set(key, (map.get(key) || 0) + o.amount);
    });
    const entries = Array.from(map.entries()).sort((a, b) => toMonthDay(a[0]) - toMonthDay(b[0]));
    return { labels: entries.map(e => e[0]), data: entries.map(e => e[1]) };
}

function buildHourlySeries(rows) {
    const buckets = Array(24).fill(0);
    rows.forEach(o => { buckets[o.createdAt.getHours()] += o.amount; });
    return {
        labels: Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}:00` : `${i}:00`)),
        data: buckets
    };
}

function baseChartOptions(border, fill) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { usePointStyle: true, padding: 20, font: { family: 'Noto Sans KR', size: 12, weight: '500' } }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: border,
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                callbacks: { label: ctx => '매출: ₩' + (ctx.parsed.y || 0).toLocaleString() }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Noto Sans KR', size: 11 }, color: '#6c757d' } },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: false },
                ticks: { font: { family: 'Noto Sans KR', size: 11 }, color: '#6c757d', callback: v => '₩' + (v || 0).toLocaleString() }
            }
        },
        interaction: { intersect: false, mode: 'index' },
        animation: { duration: 2000, easing: 'easeInOutQuart' }
    };
}

function applyChartColors(chart, border, fill) {
    chart.data.datasets[0].borderColor = border;
    chart.data.datasets[0].backgroundColor = fill;
    chart.data.datasets[0].pointBackgroundColor = border;
}

// ========================= 탭 / 필터 =========================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');

            if (target === 'new') {
                const today = new Date();
                const s = startOfDay(today);
                const e = endOfDay(today);
                setDateInputs(s, e);
                applyDateFilter(s, e);
                state.activeStatusTab = 'all';
            } else {
                state.activeStatusTab = target;
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderAll();
        });
    });
}

function initializeDateFilters() {
    const applyBtn = document.querySelector('.apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const range = readDateInputs();
            if (range.start && range.end) {
                applyDateFilter(range.start, range.end);
                renderAll();
                showNotification('조회 기간이 적용되었습니다.', 'success');
            } else {
                showNotification('시작일과 종료일을 모두 선택해주세요.', 'error');
            }
        });
    }
    initializeQuickDateButtons();
}

function initializeQuickDateButtons() {
    const quickButtons = document.querySelectorAll('.quick-btn');
    quickButtons.forEach(button => {
        button.addEventListener('click', function() {
            quickButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const today = new Date();
            let s, e;

            switch (this.getAttribute('data-period')) {
                case 'today':     s = startOfDay(today); e = endOfDay(today); break;
                case 'yesterday': const y = new Date(today.getTime() - 86400000); s = startOfDay(y); e = endOfDay(y); break;
                case 'thisWeek':  const startW = startOfWeek(today); s = startOfDay(startW); e = endOfDay(today); break;
                case 'lastWeek':  const lwEnd = new Date(startOfWeek(today).getTime() - 86400000); const lwStart = new Date(lwEnd.getTime() - 6 * 86400000); s = startOfDay(lwStart); e = endOfDay(lwEnd); break;
                case 'thisMonth': const startM = new Date(today.getFullYear(), today.getMonth(), 1); s = startOfDay(startM); e = endOfDay(today); break;
                case 'lastMonth': const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1); const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0); s = startOfDay(lmStart); e = endOfDay(lmEnd); break;
            }

            setDateInputs(s, e);
            applyDateFilter(s, e);
            renderAll();
        });
    });
}

function applyDateFilter(start, end) {
    state.dateRange = { start, end };
    state.filtered = state.orders.filter(o => {
        const t = o.createdAt.getTime();
        return t >= start.getTime() && t <= end.getTime();
    });
}

function filterByStatus(list, status) {
    if (status === 'all') return list.slice();
    return list.filter(o => o.uiStatus === status);
}

// ========================= 상태 버튼 동작(서버 연동) =========================
function initializeOrderStatusUpdates() {
    const statusButtons = document.querySelectorAll('.status-button');
    statusButtons.forEach(button => {
        button.addEventListener('click', function() {
            const orderItem = this.closest('.order-item');
            const orderNumber = orderItem?.querySelector('.order-number')?.textContent || '';
            if (confirm(`주문 ${orderNumber}의 상태를 변경하시겠습니까?`)) {
                updateOrderStatusWithServer(this, orderItem);
            }
        });
    });
}

async function updateOrderStatusWithServer(button, orderItem) {
    const currentText = button.textContent.trim();
    const next = nextStatusByText(currentText);
    if (!next) return;

    const orderNumber = orderItem?.querySelector('.order-number')?.textContent?.replace('#', '')?.trim();
    if (!orderNumber) {
        showNotification('주문번호를 찾을 수 없습니다.', 'error');
        return;
    }

    button.disabled = true;
    button.textContent = '처리중...';

    try {
        const response = await fetch(`/orders/${orderNumber}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: mapButtonTextToDbStatus(next.text) })
        });

        const result = await response.json();

        if (result.success) {
            button.className = `status-button ${next.cls}`;
            button.textContent = next.text;
            orderItem?.setAttribute('data-status', mapButtonTextToKey(next.text));

            const target = state.filtered.find(o => o.orderNumber === orderNumber);
            if (target) {
                target.uiStatus = mapButtonTextToKey(next.text);
                const origin = state.orders.find(o => o.orderNumber === target.orderNumber);
                if (origin) origin.uiStatus = target.uiStatus;
            }

            renderAll();

            if (typeof window.updateCompanyStats === 'function') {
                window.updateCompanyStats();
            }
            showNotification('주문 상태가 업데이트되었습니다.', 'success');
        } else {
            showNotification(result.message || '상태 업데이트에 실패했습니다.', 'error');
            button.disabled = false;
            button.textContent = currentText;
        }
    } catch (error) {
        console.error('상태 업데이트 오류:', error);
        showNotification('서버와의 통신 중 오류가 발생했습니다.', 'error');
        button.disabled = false;
        button.textContent = currentText;
    }
}

// 프론트 전용 전환(미사용)
function updateOrderStatusFrontOnly(button, orderItem) {
    const currentText = button.textContent.trim();
    const next = nextStatusByText(currentText);
    if (!next) return;

    button.className = `status-button ${next.cls}`;
    button.textContent = next.text;
    orderItem?.setAttribute('data-status', mapButtonTextToKey(next.text));

    const num = orderItem?.querySelector('.order-number')?.textContent?.replace('#', '')?.trim();
    const target = state.filtered.find(o => `#${o.orderNumber}` === `#${num}`);
    if (target) {
        target.uiStatus = mapButtonTextToKey(next.text);
        const origin = state.orders.find(o => o.orderNumber === target.orderNumber);
        if (origin) origin.uiStatus = target.uiStatus;
    }

    renderAll();
    showNotification('주문 상태가 업데이트되었습니다.', 'success');
}

function nextStatusByText(text) {
    switch (text) {
        case '신규 주문': return STATUS_BTN.preparing;
        case '주문 확인': return STATUS_BTN.preparing;
        case '배송 준비': return STATUS_BTN.shipping;
        case '배송중':   return STATUS_BTN.completed;
        case '완료':     return null;
        case '재주문':   return STATUS_BTN.preparing;
        default: return null;
    }
}

function mapButtonTextToKey(text) {
    for (const k of Object.keys(STATUS_BTN)) {
        if (STATUS_BTN[k].text === text) return k;
    }
    return 'preparing';
}

function mapButtonTextToDbStatus(text) {
    switch (text) {
        case '배송 준비': return 'PREPARING';
        case '배송중':   return 'SHIPPED';
        case '완료':     return 'DELIVERED';
        case '재주문':   return 'PREPARING';
        case '취소':     return 'CANCELLED';
        default:         return 'PREPARING';
    }
}

// ========================= 유틸 =========================
function setDateInputs(start, end) {
    const s = document.getElementById('startDate');
    const e = document.getElementById('endDate');
    if (s) s.value = toInputDate(start);
    if (e) e.value = toInputDate(end);
}

function readDateInputs() {
    const s = document.getElementById('startDate')?.value;
    const e = document.getElementById('endDate')?.value;
    return {
        start: s ? startOfDay(new Date(s)) : null,
        end:   e ? endOfDay(new Date(e))   : null,
    };
}

function toInputDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function startOfDay(d) { const t = new Date(d); t.setHours(0,0,0,0); return t; }
function endOfDay(d)   { const t = new Date(d); t.setHours(23,59,59,999); return t; }
function startOfWeek(d){
    const t = new Date(d);
    const day = t.getDay();
    t.setDate(t.getDate() - day);
    t.setHours(0,0,0,0);
    return t;
}

function toMonthDay(md) {
    const [m, d] = md.split('/').map(Number);
    return m * 100 + d;
}

function renderTimeInfo(date) {
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const isToday = now.toDateString() === date.toDateString();

    if (isToday) {
        if (hrs >= 1) return `${pad2(date.getHours())}:${pad2(date.getMinutes())} (${hrs}시간 전)`;
        return `${pad2(date.getHours())}:${pad2(date.getMinutes())} (${Math.max(mins,1)}분 전)`;
    } else {
        const yday = new Date(now.getTime() - 86400000);
        const label = (yday.toDateString() === date.toDateString()) ? '어제' : `${date.getFullYear()}.${pad2(date.getMonth()+1)}.${pad2(date.getDate())}`;
        return `${label} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
    }
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function toNumber(x) { return typeof x === 'number' ? x : Number(x || 0); }
function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// 알림
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease'
    });
    const colors = { success: '#28a745', error: '#dc3545', info: '#17a2b8', warning: '#ffc107' };
    notification.style.backgroundColor = colors[type] || colors.info;
    document.body.appendChild(notification);
    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 50);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
    }
});

// 첫 렌더 이후 카드/요약 보정
setTimeout(() => {
    updateStatusCardsFromState();
    updateDailySummaryText();
}, 800);

// 초기 애니메이션
function initializeAnimations() {
    const cards = document.querySelectorAll('.status-card, .summary-item');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });

    const orderItems = document.querySelectorAll('.order-item');
    orderItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-30px)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, (index * 100) + 500);
    });
}
