// 배송관리 페이지 JS (리스트 응답만 사용 + 상태 저장)
(function () {
  const LIST_API = "/api/seller/orders/my";
  const PATCH_ITEM_STATUS_API = (orderItemId) => `/api/seller/delivery/${orderItemId}/status`;

  const $orderList = document.getElementById("orderList");
  const $loader = document.getElementById("loader");
  const $error = document.getElementById("errorBox");
  const tabButtons = document.querySelectorAll(".tab-button");

  // 화면 <-> DB 상태 매핑
  const UI_TO_DB = { preparing: "PREPARING", shipping: "SHIPPED", completed: "DELIVERED" };
  const DB_TO_UI = {
    PREPARING: "preparing",
    SHIPPED: "shipping",
    DELIVERED: "completed",
    NEW: "preparing",
    CONFIRMED: "preparing",
    CANCELLED: "return",
    REFUND_REQUESTED: "return",
    REFUNDED: "return",
  };

  // 평탄화 아이템 캐시
  // [{ orderNumber, orderDate, recipientName, itemId, uiStatus, name, spec, image }]
  let allItems = [];

  document.addEventListener("DOMContentLoaded", async () => {
    bindTabs();
    await loadData();
    updateSummaryCards();
    applyFilter("all");
    attachEscForModal();
  });

  function bindTabs() {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyFilter(btn.getAttribute("data-tab"));
      });
    });
  }

  async function loadData() {
    showError(null);
    showLoader(true);
    allItems = [];

    try {
      const res = await fetch(LIST_API, { credentials: "include" });
      if (res.status === 401) {
        const body = await safeJson(res);
        if (body?.redirectUrl) { window.location.href = body.redirectUrl; return; }
        throw new Error("로그인이 필요합니다.");
      }
      if (!res.ok) throw new Error("주문 목록을 불러오지 못했습니다.");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "주문 데이터를 가져오지 못했습니다.");

      const orders = Array.isArray(data.orders) ? data.orders : [];
      // ✅ 상세 호출 없이 리스트에서 평탄화
      for (const o of orders) {
        const orderNumber = o.id;
        const orderDate = o.date;
        const recipientName = o.recipientName || "-";
        const items = Array.isArray(o.items) ? o.items : [];
        for (const it of items) {
          const itemId = it.orderItemId;      // ✅ 서버가 내려줌
          const dbStatus = (it.itemStatus || o.status || "").toUpperCase();
          const uiStatus = DB_TO_UI[dbStatus] || "preparing";

          allItems.push({
            orderNumber,
            orderDate,
            recipientName,
            itemId,
            listingId: it.listingId,
            uiStatus,
            name: it.name || "상품",
            spec: `${it.unit || ""} × ${it.quantity || 0}개`,
            image: it.image || "/images/농산물.png",
          });
        }
      }

      renderItems(allItems);
    } catch (e) {
      showError(e.message || "오류가 발생했습니다.");
    } finally {
      showLoader(false);
    }
  }

  function renderItems(items) {
    $orderList.innerHTML = "";
    if (!items.length) {
      $orderList.innerHTML = `<div class="empty">표시할 주문이 없습니다.</div>`;
      return;
    }
    const frag = document.createDocumentFragment();

    items.forEach((it) => {
      const cfg = statusUiConfig(it.uiStatus);
      const el = document.createElement("div");
      el.className = "order-item";
      el.setAttribute("data-status", cfg.tab);
      el.innerHTML = `
        <div class="order-header">
          <span class="order-number">주문번호: ${escapeHtml(it.orderNumber)}</span>
          <span class="order-date">${formatDate(it.orderDate)}</span>
        </div>
        <div class="order-content">
          <div class="product-info">
            <div class="product-icon"><img src="/api/listings/${it.listingId}/thumbnail" alt="" onerror="this.onerror=null;this.src='/images/농산물.png'"></div>
            <div class="product-details">
              <div class="product-name">${escapeHtml(it.name)}</div>
              <div class="product-spec">${escapeHtml(it.spec)}</div>
            </div>
          </div>
          <div class="recipient-info">
            <div class="recipient-name">${escapeHtml(it.recipientName)}</div>
            <div class="recipient-address">-</div>
          </div>
          <div class="order-actions">
            <button class="status-button ${cfg.btnClass}" ${it.itemId ? "" : "disabled"}>${cfg.label}</button>
            ${cfg.tab === "shipping" ? `<button class="action-button">송장 확인</button>` : ""}
            ${cfg.tab === "completed" ? `<button class="action-button">리뷰 확인</button>` : ""}
            ${cfg.tab === "return" ? `<button class="action-button">처리하기</button>` : ""}
          </div>
        </div>
      `;

      // 상태 변경 + 저장
      const statusBtn = el.querySelector(".status-button");
      if (statusBtn && !statusBtn.disabled) {
        statusBtn.addEventListener("click", async () => {
          const next = nextUiStatus(statusBtn.textContent.trim());
          if (!next) return;
          try {
            await patchItemStatus(it.itemId, UI_TO_DB[next.tab]);
            statusBtn.className = `status-button ${next.btnClass}`;
            statusBtn.textContent = next.label;
            el.setAttribute("data-status", next.tab);
            it.uiStatus = next.tab;
            updateSummaryCards();
            toast("주문 상태가 저장되었습니다.", "success");
          } catch (err) {
            toast(err.message || "상태 저장에 실패했습니다.", "error");
          }
        });
      }

      // 부가 액션
      const actionBtn = el.querySelector(".action-button");
      if (actionBtn) {
        actionBtn.addEventListener("click", () => {
          const label = actionBtn.textContent.trim();
          if (label === "송장 확인") showInvoiceModal(it);
          else if (label === "리뷰 확인") showReviewModal(it);
          else if (label === "처리하기") showReturnModal(it);
        });
      }

      frag.appendChild(el);
    });

    $orderList.appendChild(frag);
  }

  async function patchItemStatus(orderItemId, nextDbStatus) {
    const res = await fetch(PATCH_ITEM_STATUS_API(orderItemId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ nextStatus: nextDbStatus }),
    });
    if (res.status === 401) {
      const body = await safeJson(res);
      if (body?.redirectUrl) { window.location.href = body.redirectUrl; return; }
      throw new Error("로그인이 필요합니다.");
    }
    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.message || "상태 저장 실패");
    }
  }

  // 요약 카드
  function updateSummaryCards() {
    const counts = { preparing: 0, shipping: 0, completed: 0, return: 0 };
    $orderList.querySelectorAll(".order-item").forEach((n) => {
      const st = n.getAttribute("data-status");
      if (counts.hasOwnProperty(st)) counts[st]++;
    });
    setSummary("preparing", counts.preparing);
    setSummary("shipping", counts.shipping);
    setSummary("completed", counts.completed);
    setSummary("return", counts.return);
  }
  function setSummary(key, val) {
    const el = document.querySelector(`.summary-number[data-summary="${key}"]`);
    if (el) el.textContent = String(val);
  }

  // 탭 필터
  function applyFilter(tab) {
    const items = $orderList.querySelectorAll(".order-item");
    items.forEach((el) => {
      const st = el.getAttribute("data-status");
      const show = tab === "all" || tab === st;
      el.style.display = show ? "block" : "none";
      if (show) {
        el.style.opacity = "0"; el.style.transform = "translateY(20px)";
        setTimeout(() => {
          el.style.transition = "all 0.3s ease";
          el.style.opacity = "1"; el.style.transform = "translateY(0)";
        }, 50);
      }
    });
    updateSummaryCards();
  }

  // 상태 전이 & UI 설정
  function nextUiStatus(currentLabel) {
    switch (currentLabel) {
      case "배송 준비중": return statusUiConfig("shipping");
      case "배송중": return statusUiConfig("completed");
      default: return null; // 교환/환불 전이는 별도
    }
  }
  function statusUiConfig(uiStatus) {
    switch (uiStatus) {
      case "shipping":   return { tab: "shipping",   label: "배송중",     btnClass: "delivering" };
      case "completed":  return { tab: "completed",  label: "배송 완료",  btnClass: "completed" };
      case "return":     return { tab: "return",     label: "교환/환불",  btnClass: "return" };
      case "preparing":
      default:           return { tab: "preparing",  label: "배송 준비중", btnClass: "preparing" };
    }
  }

  // 모달/알림 (간단 샘플)
  function showInvoiceModal(it) {
    const html = `
      <h3>송장 정보</h3>
      <div class="invoice-info">
        <p><strong>주문번호:</strong> ${escapeHtml(it.orderNumber)}</p>
        <p><strong>상품명:</strong> ${escapeHtml(it.name)}</p>
        <p><strong>송장번호:</strong> 1234567890</p>
        <p><strong>배송업체:</strong> CJ대한통운</p>
        <p><strong>예상배송일:</strong> ${formatDate(new Date())}</p>
      </div>
      <div class="modal-actions">
        <button class="modal-button primary" onclick="closeModal()">확인</button>
        <button class="modal-button secondary" onclick="trackDelivery()">배송추적</button>
      </div>`;
    document.body.appendChild(createModal(html));
  }
  function showReviewModal(it) {
    const html = `
      <h3>고객 리뷰</h3>
      <div class="review-info">
        <p><strong>주문번호:</strong> ${escapeHtml(it.orderNumber)}</p>
        <p><strong>상품명:</strong> ${escapeHtml(it.name)}</p>
        <div class="review-rating">
          <span class="stars">⭐⭐⭐⭐⭐</span>
          <span class="rating-text">5.0점</span>
        </div>
        <div class="review-content">
          <p>"정말 신선하고 맛있었습니다! 다음에도 주문할 예정이에요."</p>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-button primary" onclick="closeModal()">확인</button>
        <button class="modal-button secondary" onclick="replyToReview()">답글달기</button>
      </div>`;
    document.body.appendChild(createModal(html));
  }
  function showReturnModal(it) {
    const html = `
      <h3>교환/환불 처리</h3>
      <div class="return-info">
        <p><strong>주문번호:</strong> ${escapeHtml(it.orderNumber)}</p>
        <p><strong>상품명:</strong> ${escapeHtml(it.name)}</p>
        <p><strong>고객명:</strong> ${escapeHtml(it.recipientName)}</p>
        <div class="return-reason">
          <h4>교환/환불 사유</h4>
          <p>"상품이 손상되어 배송되었습니다. 교환을 요청드립니다."</p>
        </div>
        <div class="return-options">
          <h4>처리 옵션</h4>
          <div class="option-buttons">
            <button class="option-btn" onclick="processReturn('exchange')">교환 처리</button>
            <button class="option-btn" onclick="processReturn('refund')">환불 처리</button>
            <button class="option-btn" onclick="processReturn('reject')">요청 거부</button>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="modal-button primary" onclick="closeModal()">닫기</button>
      </div>`;
    document.body.appendChild(createModal(html));
  }

  function createModal(content) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `<div class="modal-content">${content}</div>`;
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    if (!document.getElementById("modalStyle")) {
      const style = document.createElement("style");
      style.id = "modalStyle";
      style.textContent = MODAL_STYLES;
      document.head.appendChild(style);
    }
    return modal;
  }

  window.closeModal = function () {
    const m = document.querySelector(".modal-overlay");
    if (m) m.remove();
  };
  window.trackDelivery = function () {
    window.open("https://www.cjlogistics.com/ko/tool/parcel/tracking", "_blank");
    closeModal();
  };
  window.replyToReview = function () {
    const reply = prompt("답글을 입력해주세요:");
    if (reply) { toast("답글이 등록되었습니다.", "success"); closeModal(); }
  };
  window.processReturn = function (type) {
    const msg = type === "exchange" ? "교환이 처리되었습니다."
      : type === "refund" ? "환불이 처리되었습니다."
      : "교환/환불 요청이 거부되었습니다.";
    toast(msg, "success"); closeModal();
  };

  // 유틸
  function showLoader(on) { if ($loader) $loader.style.display = on ? "block" : "none"; }
  function showError(msg) {
    if (!$error) return;
    if (!msg) { $error.style.display = "none"; $error.textContent = ""; return; }
    $error.style.display = "block"; $error.textContent = msg;
  }
  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `notification ${type}`;
    el.textContent = message;
    Object.assign(el.style, {
      position: "fixed", top: "20px", right: "20px",
      padding: "1rem 1.5rem", borderRadius: "8px",
      color: "white", fontWeight: "500", zIndex: "10000",
      transform: "translateX(100%)", transition: "transform 0.3s ease"
    });
    const colors = { success: "#27ae60", error: "#e74c3c", info: "#3498db", warning: "#f39c12" };
    el.style.backgroundColor = colors[type] || colors.info;
    document.body.appendChild(el);
    setTimeout(() => { el.style.transform = "translateX(0)"; }, 100);
    setTimeout(() => { el.style.transform = "translateX(100%)"; setTimeout(() => el.remove(), 300); }, 3000);
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  function formatDate(v) {
    if (!v) return "-";
    const d = (v instanceof Date) ? v : new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  }
  async function safeJson(res) { try { return await res.json(); } catch { return null; } }
  function attachEscForModal() { document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); }); }

  // 모달 스타일
  const MODAL_STYLES = `
    .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:10000;}
    .modal-content{background:#fff;border-radius:16px;padding:2rem;max-width:520px;width:90%;
      max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);}
    .modal-content h3{margin:0 0 1.5rem;color:#2c3e50;font-size:1.5rem;}
    .invoice-info,.review-info{margin-bottom:2rem;}
    .invoice-info p,.review-info p{margin:.5rem 0;color:#34495e;}
    .review-rating{display:flex;align-items:center;gap:.5rem;margin:1rem 0;}
    .stars{font-size:1.2rem;}
    .rating-text{font-weight:600;color:#f39c12;}
    .review-content{background:#f8f9fa;padding:1rem;border-radius:8px;margin-top:1rem;}
    .modal-actions{display:flex;gap:1rem;justify-content:flex-end;}
    .modal-button{padding:.75rem 1.5rem;border:none;border-radius:8px;font-weight:500;cursor:pointer;transition:all .3s;}
    .modal-button.primary{background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:#fff;}
    .modal-button.secondary{background:#ecf0f1;color:#2c3e50;}
    .modal-button:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(0,0,0,.2);}
  `;
})();
