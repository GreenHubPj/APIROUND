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

    // ✅ 서버에서 판매사 주문 불러오기
    await loadVendorOrders();

    // 초기 렌더
    if (state.orders.length > 0) {
        // 기본 기간: 최근 30일
        const today = new Date();
        const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        setDateInputs(oneMonthAgo, today);
        applyDateFilter(oneMonthAgo, today);

        renderAll();
    } else {
        // 실패거나 데이터 없음: 화면에 안내
        showNotification('표시할 주문이 없습니다.', 'info');
    }
});

// ========================= 서버 연동 =========================
async function loadVendorOrders() {
    try {
        const res = await fetch('/api/seller/orders/my', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (!json.success || !Array.isArray(json.orders)) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }

        // 서버 DTO: VendorOrderSummaryDto { id(date/status/vendorSubtotal/...) }
        state.orders = json.orders.map(o => {
            const created = o.date ? new Date(o.date) : new Date();
            const amt = toNumber(o.vendorSubtotal ?? o.finalAmount ?? 0);
            const uiStatus = (o.status || 'preparing').toLowerCase();

            // ✅ 주문의 아이템들까지 보관 (상품명/수량/금액)
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
                items, // ✅ 추가
            };
        });



        // 차트 초기화는 데이터 들어온 뒤
        initializeChart();

    } catch (err) {
        console.warn('주문 로드 실패:', err);
        // 더미 유지 없이 빈 상태로 둠 (HTML에 하드코딩된 더미를 덮어쓰기 위해 아래에서 렌더 시 전부 교체)
        state.orders = [];
    }
}

// ========================= 렌더링 =========================
function renderAll() {
    renderOrderList();
    updateStatusCardsFromState();
    updateDailySummaryText();
    updateChartsFromState();
    renderSalesSummary(); // ✅ 매출 요약 갱신
}

function renderOrderList() {
    const list = document.querySelector('.order-list');
    if (!list) return;

    // 현재 필터: 상태 탭 + 날짜 범위
    const rows = filterByStatus(state.filtered, state.activeStatusTab);

    if (rows.length === 0) {
        list.innerHTML = `
            <div style="padding:1rem; text-align:center; color:#6c757d;">
                표시할 주문이 없습니다.
            </div>`;
        return;
    }

    // 시간 최근순 정렬
    rows.sort((a, b) => b.createdAt - a.createdAt);

    list.innerHTML = rows.map(r => {
        const btn = STATUS_BTN[r.uiStatus] || STATUS_BTN.preparing;
        const timeText = renderTimeInfo(r.createdAt);
        const formattedAmount = '₩' + r.amount.toLocaleString();
        
        // 완료된 주문만 버튼 비활성화 (취소된 주문은 재주문 가능)
        const isDisabled = r.uiStatus === 'completed';
        const disabledAttr = isDisabled ? 'disabled' : '';

        return `
        <div class="order-item" data-status="${r.uiStatus}">
            <div class="order-info">
                <div class="order-number">#${escapeHtml(r.orderNumber)}</div>
                <div class="order-time">${timeText}</div>
            </div>
            <div class="order-amount">${formattedAmount}</div>
            <div class="order-actions">
                <button class="status-button ${btn.cls}" ${disabledAttr}>${btn.text}</button>
            </div>
        </div>`;
    }).join('');

    // 상태 버튼 이벤트 바인딩(프론트 전용 전환)
    initializeOrderStatusUpdates();
}

function updateStatusCardsFromState() {
    const counts = {
        new: 0, confirmed: 0, preparing: 0, shipping: 0, completed: 0, cancelled: 0,
    };
    state.filtered.forEach(o => {
        if (counts[o.uiStatus] !== undefined) counts[o.uiStatus]++;
    });

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

// ✅ 매출 요약(우측 카드) 업데이트: 현재 탭 + 날짜필터가 적용된 주문으로 집계
function renderSalesSummary() {
    const section = document.querySelector('.sales-summary-section');
    if (!section) return;

    // HTML에 있는 6개 값 순서: 총 매출, 총 주문건, 평균 주문금액, 주문 완료율, 최다 주문시간, 베스트 상품
    const values = section.querySelectorAll('.summary-grid .summary-item .summary-value');
    if (values.length < 6) return;

    const setVal = (idx, text) => { if (values[idx]) values[idx].textContent = text; };

    // 현재 기간/탭 필터 적용된 목록 기준
    const orders = state.filtered;

    // 총 매출 / 총 주문건 / 평균 주문금액
    const totalSales  = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    const totalOrders = orders.length;
    const avgAmount   = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    // 완료율: 상태가 'completed' 인 주문 비율
    const completed = orders.filter(o => o.uiStatus === 'completed').length;
    const completionRate = totalOrders > 0 ? (completed * 100) / totalOrders : 0;

    // 최다 주문시간(시간대별 주문 "건수" 기준)
    const hourCounts = Array(24).fill(0);
    orders.forEach(o => { hourCounts[o.createdAt.getHours()]++; });
    const peakHour = hourCounts.reduce((bestIdx, v, idx, arr) => v > arr[bestIdx] ? idx : bestIdx, 0);
    const peakHourLabel = `${String(peakHour).padStart(2,'0')}:00-${String((peakHour+1)%24).padStart(2,'0')}:00`;

    // ✅ 베스트 상품: 현재 필터 범위의 모든 주문 아이템 중 "수량 합"이 가장 큰 상품명
    let bestProduct = '-';
    const productQty = new Map();
    orders.forEach(o => {
        (o.items || []).forEach(it => {
            const key = it.name || '상품';
            const q = Number(it.quantity) || 0;
            productQty.set(key, (productQty.get(key) || 0) + q);
        });
    });
    if (productQty.size > 0) {
        bestProduct = [...productQty.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }

    // 값 반영 (인덱스는 현재 HTML 순서와 1:1)
    setVal(0, `₩${totalSales.toLocaleString()}`);  // 총 매출
    setVal(1, `${totalOrders}건`);                 // 총 주문건
    setVal(2, `₩${avgAmount.toLocaleString()}`);   // 평균 주문금액
    setVal(3, `${completionRate.toFixed(1)}%`);    // 주문 완료율
    setVal(4, peakHourLabel);                      // 최다 주문시간
    setVal(5, bestProduct);                        // ✅ 베스트 상품
}


// ========================= 차트 =========================
function initializeChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    // 기본 빈 차트
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
    // 기본은 일별 뷰
    const dailyBtn = document.querySelector('.toggle-btn[data-view="daily"]');
    if (dailyBtn) {
        dailyBtn.classList.add('active');
    }
    changeChartView('daily');
}

function buildDailySeries(rows) {
    // 최근 7일 또는 현재 필터 기간 전체
    // 여기서는 필터된 rows를 날짜별 합계로 그룹
    const map = new Map(); // 'M/D' -> total
    rows.forEach(o => {
        const d = o.createdAt;
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        map.set(key, (map.get(key) || 0) + o.amount);
    });

    // 정렬
    const entries = Array.from(map.entries()).sort((a, b) => toMonthDay(a[0]) - toMonthDay(b[0]));
    const labels = entries.map(e => e[0]);
    const data = entries.map(e => e[1]);
    return { labels, data };
}

function buildHourlySeries(rows) {
    // 0~23시 그룹
    const buckets = Array(24).fill(0);
    rows.forEach(o => {
        const h = o.createdAt.getHours();
        buckets[h] += o.amount;
    });
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
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { family: 'Noto Sans KR', size: 12, weight: '500' }
                }
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
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Noto Sans KR', size: 11 }, color: '#6c757d' }
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.1)', drawBorder: false },
                ticks: {
                    font: { family: 'Noto Sans KR', size: 11 },
                    color: '#6c757d',
                    callback: v => '₩' + (v || 0).toLocaleString()
                }
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
                // ✅ '신규 주문' 탭 클릭 시: 오늘 날짜로 기간을 강제 적용
                const today = new Date();
                const s = startOfDay(today);
                const e = endOfDay(today);

                // 날짜 입력 UI도 오늘로 맞춰줌(선택)
                setDateInputs(s, e);

                // 상태의 기간 필터만 오늘로 재적용
                applyDateFilter(s, e);

                // 오늘의 "모든 상태" 주문을 보이게 하려면:
                state.activeStatusTab = 'all';

                // 만약 "오늘 + 신규 상태만" 보고 싶다면 위 줄 대신 아래 한 줄을 쓰면 됨
                // state.activeStatusTab = 'new';
            } else {
                // 다른 탭은 기존 동작 유지 (상태 기반 필터)
                state.activeStatusTab = target;
            }

            // 탭 하이라이트 유지
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 화면 다시 그리기 (리스트/요약/차트 모두 반영)
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
                case 'today':
                    s = startOfDay(today); e = endOfDay(today); break;
                case 'yesterday':
                    const y = new Date(today.getTime() - 86400000);
                    s = startOfDay(y); e = endOfDay(y); break;
                case 'thisWeek':
                    const startW = startOfWeek(today);
                    s = startOfDay(startW); e = endOfDay(today); break;
                case 'lastWeek':
                    const lwEnd = new Date(startOfWeek(today).getTime() - 86400000);
                    const lwStart = new Date(lwEnd.getTime() - 6 * 86400000);
                    s = startOfDay(lwStart); e = endOfDay(lwEnd); break;
                case 'thisMonth':
                    const startM = new Date(today.getFullYear(), today.getMonth(), 1);
                    s = startOfDay(startM); e = endOfDay(today); break;
                case 'lastMonth':
                    const lmStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                    s = startOfDay(lmStart); e = endOfDay(lmEnd); break;
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

// 서버 API를 통한 주문 상태 업데이트
async function updateOrderStatusWithServer(button, orderItem) {
    const currentText = button.textContent.trim();
    const next = nextStatusByText(currentText);
    if (!next) return;

    const orderNumber = orderItem?.querySelector('.order-number')?.textContent?.replace('#', '')?.trim();
    if (!orderNumber) {
        showNotification('주문번호를 찾을 수 없습니다.', 'error');
        return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    button.disabled = true;
    button.textContent = '처리중...';

    try {
        const response = await fetch(`/orders/${orderNumber}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: mapButtonTextToDbStatus(next.text)
            })
        });

        const result = await response.json();

        if (result.success) {
            // 성공 시 UI 업데이트
            button.className = `status-button ${next.cls}`;
            button.textContent = next.text;
            orderItem?.setAttribute('data-status', mapButtonTextToKey(next.text));

            // 내부 상태도 갱신
            const target = state.filtered.find(o => o.orderNumber === orderNumber);
            if (target) {
                target.uiStatus = mapButtonTextToKey(next.text);
                // 원본 orders에서도 동일 변경
                const origin = state.orders.find(o => o.orderNumber === target.orderNumber);
                if (origin) origin.uiStatus = target.uiStatus;
            }

            updateStatusCardsFromState();
            updateDailySummaryText();
            
            // mypage-company 통계 업데이트 (해당 페이지가 열려있는 경우)
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

// 서버 반영 없이 프론트에서만 다음 상태로 전환 (필요 시 API 연결)
function updateOrderStatusFrontOnly(button, orderItem) {
    const currentText = button.textContent.trim();
    const next = nextStatusByText(currentText);
    if (!next) return;

    button.className = `status-button ${next.cls}`;
    button.textContent = next.text;
    orderItem?.setAttribute('data-status', mapButtonTextToKey(next.text));

    // 내부 상태도 갱신
    const num = orderItem?.querySelector('.order-number')?.textContent?.replace('#', '')?.trim();
    const target = state.filtered.find(o => `#${o.orderNumber}` === `#${num}`);
    if (target) {
        target.uiStatus = mapButtonTextToKey(next.text);
        // 원본 orders에서도 동일 변경
        const origin = state.orders.find(o => o.orderNumber === target.orderNumber);
        if (origin) origin.uiStatus = target.uiStatus;
    }

    updateStatusCardsFromState();
    updateDailySummaryText();
    showNotification('주문 상태가 업데이트되었습니다.', 'success');
}

function nextStatusByText(text) {
    switch (text) {
        case '신규 주문': return STATUS_BTN.confirmed;
        case '주문 확인': return STATUS_BTN.preparing;
        case '배송 준비': return STATUS_BTN.shipping;
        case '배송중':   return STATUS_BTN.completed;
        case '완료':     return null; // 완료된 주문은 더 이상 변경 불가
        case '취소':     return STATUS_BTN.preparing; // 취소된 주문은 재주문 가능
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
        case '주문 확인': return 'PREPARING';
        case '배송 준비': return 'PREPARING';
        case '배송중': return 'SHIPPED';
        case '완료': return 'DELIVERED';
        case '재주문': return 'PREPARING'; // 취소된 주문을 재주문으로 변경
        case '취소': return 'CANCELLED';
        default: return 'PREPARING';
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
    const day = t.getDay(); // 0(Sun)~6(Sat)
    t.setDate(t.getDate() - day);
    t.setHours(0,0,0,0);
    return t;
}

function toMonthDay(md) {
    // 'M/D' -> 숫자 비교용 mmdd
    const [m, d] = md.split('/').map(Number);
    return m * 100 + d;
}

function renderTimeInfo(date) {
    const now = new Date();
    const diff = now - date; // ms
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const isToday = now.toDateString() === date.toDateString();

    if (isToday) {
        if (hrs >= 1) return `${pad2(date.getHours())}:${pad2(date.getMinutes())} (${hrs}시간 전)`;
        return `${pad2(date.getHours())}:${pad2(date.getMinutes())} (${Math.max(mins,1)}분 전)`;
    } else {
        // 어제/그 외
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

// 초기 애니메이션 (디자인 유지)
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