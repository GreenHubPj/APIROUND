// src/main/resources/static/js/review-write.js
// 리뷰 작성 페이지 전용 스크립트 (검증 + 저장 + 실패 시 자동 구제 경로)
// - YML 토글 없이도 동작하도록 구현
// - 우선순위: orderItemId가 있으면 /api/my/reviews 로 저장 → 실패 시 /api/products/{productId}/reviews 로 1회 재시도
// - orderItemId가 없으면 곧바로 /api/products/{productId}/reviews 사용
// - 401(미로그인) 응답에 redirectUrl 있으면 바로 이동
// - "이미 작성" 등 메시지는 안내 후 리뷰 목록/상세로 이동

(function () {
  // fallback 스크립트가 중복 실행되지 않도록 플래그 설정
  window.__REVIEW_WRITE_READY__ = true;

  // ──────────────────────────────────────────────────────────────
  // 유틸
  // ──────────────────────────────────────────────────────────────
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data ?? {}),
    });
    return res;
  }

  async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
  }

  async function safeText(res) {
    try { return await res.text(); } catch { return ""; }
  }

  function toInt(v) {
    if (v == null) return null;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
  }

  function showErr(msg) {
    const box = $("#saveError");
    if (box) {
      box.style.display = "block";
      box.textContent = msg || "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } else {
      alert(msg || "오류가 발생했습니다.");
    }
  }

  // ──────────────────────────────────────────────────────────────
  // DOM 참조
  // ──────────────────────────────────────────────────────────────
  const container    = document.querySelector("main.container");
  const productId    = toInt(container?.getAttribute("data-product-id"));
  const orderItemId  = toInt(container?.getAttribute("data-order-item-id"));
  const stars        = $$(".star-rating .star");
  const ratingInput  = $("#ratingValue");
  const ratingError  = $("#ratingError");
  const textarea     = $("#reviewTextarea");
  const charCount    = $("#charCount");
  const contentError = $("#contentError");
  const saveBtn      = $("#saveBtn");

  let currentRating = 0;
  let isDirty = false;


  // ──────────────────────────────────────────────────────────────
  // 별점 UI
  // ──────────────────────────────────────────────────────────────
  function initStars() {
    function apply(val) {
      currentRating = val;
      if (ratingInput) ratingInput.value = String(val);
      stars.forEach(s => {
        const r = toInt(s.getAttribute("data-rating")) || 0;
        s.classList.toggle("active", r <= val);
        s.setAttribute("aria-checked", r === val ? "true" : "false");
      });
      if (val >= 1 && ratingError) ratingError.style.display = "none";
    }

    stars.forEach(s => {
      s.addEventListener("click", () => {
        const val = toInt(s.getAttribute("data-rating")) || 0;
        apply(val);
        isDirty = true;
      });
    });

    // 기본 선택을 5로 하고 싶다면 주석 해제
    // apply(5);
  }

  // ──────────────────────────────────────────────────────────────
  // 텍스트/글자수 UI
  // ──────────────────────────────────────────────────────────────
  function initTextarea() {
    const update = () => {
      const len = (textarea?.value || "").length;
      if (charCount) charCount.textContent = `${len}/500`;
      if (len >= 10 && contentError) contentError.style.display = "none";
    };
    textarea?.addEventListener("input", () => {
      isDirty = true;
      update();
    });
    update();
  }

  // ──────────────────────────────────────────────────────────────
  // 저장 로직
  // ──────────────────────────────────────────────────────────────
  function validateForm() {
    const rating  = toInt(ratingInput?.value) || currentRating || 0;
    const content = (textarea?.value || "").trim();

    let ok = true;
    if (rating < 1 || rating > 5) {
      ratingError && (ratingError.style.display = "block");
      ok = false;
    }
    if (content.length < 10) {
      contentError && (contentError.style.display = "block");
      ok = false;
    }
    return { ok, rating, content };
  }

  async function submitReview() {
    // 버튼 UI 잠금
    const btn = saveBtn;
    const backupText = btn?.textContent;
    btn && (btn.disabled = true, btn.textContent = "저장 중...");

    try {
      const { ok, rating, content } = validateForm();
      if (!ok) return;

      if (!productId) {
        // 이 경우는 거의 없음(템플릿에서 data-product-id 내려줌)
        throw new Error("상품 정보가 올바르지 않습니다. (productId 없음)");
      }

      // 1순위: orderItemId가 있으면 내 주문항목으로 저장
      if (orderItemId) {
        const res = await postJSON("/api/my/reviews", { orderItemId, rating, content });
        if (res.status === 401) {
          const body = await safeJson(res);
          if (body?.redirectUrl) { location.href = body.redirectUrl; return; }
          throw new Error("로그인이 필요합니다.");
        }
        if (res.ok) {
          const body = await safeJson(res);
          isDirty = false;
          const redirect = body?.redirectUrl || `/products/${productId}/reviews`;
          location.href = redirect;
          return;
        }

        // 409 등 실패 → 메시지 확인 후 구제 경로 시도
        const msg = (await safeJson(res))?.message || (await safeText(res)) || "";
        // 이미 작성함 → 안내 후 리뷰 페이지로
        if (msg.includes("이미") && msg.includes("리뷰")) {
          alert(msg);
          isDirty = false;
          location.href = `/products/${productId}/reviews`;
          return;
        }
        // 그 외 → product 경로로 1회 재시도
        const retry = await postJSON(`/api/products/${productId}/reviews`, { rating, content, orderItemId });
        if (retry.status === 401) {
          const b = await safeJson(retry);
          if (b?.redirectUrl) { location.href = b.redirectUrl; return; }
          throw new Error("로그인이 필요합니다.");
        }
        if (retry.ok) {
          const b = await safeJson(retry);
          isDirty = false;
          const redirect = b?.redirectUrl || `/products/${productId}/reviews`;
          location.href = redirect;
          return;
        }
        const retryMsg = (await safeJson(retry))?.message || (await safeText(retry)) || "";
        throw new Error(retryMsg || msg || "리뷰 저장에 실패했습니다.");
      }

      // 2순위: orderItemId가 없으면 product 경로로 저장
      const res2 = await postJSON(`/api/products/${productId}/reviews`, { rating, content });
      if (res2.status === 401) {
        const body = await safeJson(res2);
        if (body?.redirectUrl) { location.href = body.redirectUrl; return; }
        throw new Error("로그인이 필요합니다.");
      }
      if (res2.ok) {
        const body = await safeJson(res2);
        isDirty = false;
        const redirect = body?.redirectUrl || `/products/${productId}/reviews`;
        location.href = redirect;
        return;
      }
      const msg2 = (await safeJson(res2))?.message || (await safeText(res2)) || "";
      // 이미 작성함 → 안내 후 리뷰 페이지로
      if (msg2.includes("이미") && msg2.includes("리뷰")) {
        alert(msg2);
        isDirty = false;
        location.href = `/products/${productId}/reviews`;
        return;
      }
      throw new Error(msg2 || "리뷰 저장에 실패했습니다.");

    } catch (err) {
      const msg = (err && err.message) ? err.message : "리뷰 저장 중 오류가 발생했습니다.";
      showErr(msg);
      // "상품을 찾을 수 없습니다"가 떠도 사용자는 작성 폼에 머물게만 함 (팝업 난사 방지)
    } finally {
      btn && (btn.disabled = false, btn.textContent = backupText || "저장하기");
    }
  }

  // ──────────────────────────────────────────────────────────────
  // 이탈 방지 & 단축키
  // ──────────────────────────────────────────────────────────────
  function initGuards() {
    window.addEventListener("beforeunload", (e) => {
      const txt = (textarea?.value || "").trim();
      if (isDirty || txt.length > 0) {
        e.preventDefault();
        e.returnValue = "작성 중인 리뷰가 있습니다. 페이지를 벗어나시겠습니까?";
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        history.back();
      }
    });
  }


  // ──────────────────────────────────────────────────────────────
  // 초기화
  // ──────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initStars();
    initTextarea();
    initGuards();
    saveBtn?.addEventListener("click", submitReview);
  });
})();
