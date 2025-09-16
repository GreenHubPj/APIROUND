// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeRegionDetail();
});

// 전역 상태
let currentProduct = null;
let currentImageIndex = 0;
let selectedPriceOption = null;
let quantity = 1;

// 초기화
function initializeRegionDetail() {
    loadProductDetail();
    setupEventListeners();
    console.log('상품 상세 페이지가 초기화되었습니다.');
}

// URL에서 상품 ID (?id=...)
function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}
function getRegionFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('region');
}
function goBackToList() {
    const region = getRegionFromUrl();
    if (region) window.location.href = `/region?region=${encodeURIComponent(region)}`;
    else window.location.href = '/region';
}

// 상품 상세 로드 + 리뷰 요약/프리뷰 호출
function loadProductDetail() {
    const productId = getProductIdFromUrl();
    if (!productId) { showMessage('상품 정보를 찾을 수 없습니다.', 'error'); return; }

    currentProduct = getProductFromServer();
    if (!currentProduct) { showMessage('상품을 찾을 수 없습니다.', 'error'); return; }

    renderProductDetail();
    loadRelatedProducts();

    // ✅ 리뷰 요약 + 프리뷰 호출
    loadReviewSummary(productId);
    loadRecentReviews(productId);
}

// 템플릿에서 읽어 현재 상품 구성
function getProductFromServer() {
    const productName = document.getElementById('productTitle')?.textContent || '';
    const tags = document.querySelectorAll('.product-tag');
    const productType = tags?.[0]?.textContent || '';
    const regionText  = tags?.[1]?.textContent || '';
    const description = document.getElementById('descriptionText')?.textContent || '';
    const thumbnailUrl = document.getElementById('mainImage')?.src || '';
    const harvestSeason = document.getElementById('seasonInfo')?.textContent || '';
    const productId = parseInt(getProductIdFromUrl(), 10);

    let priceOptions;
    const key = `product_${productId}_prices`;
    const stored = localStorage.getItem(key);
    if (stored) priceOptions = JSON.parse(stored);
    else {
        priceOptions = generateConsistentPrices(productId, productType);
        localStorage.setItem(key, JSON.stringify(priceOptions));
    }

    const companyInfo = generateRandomCompany(regionText);

    return {
        id: productId,
        name: productName,
        category: productType,
        region: regionText,
        description,
        thumbnailUrl,
        harvestSeason,
        priceOptions,
        companyInfo,
        images: [{ id: 1, src: thumbnailUrl, alt: productName }]
    };
}

// 가격 생성
function generateConsistentPrices(productId, productType) {
    const base = {
        '농산물': { min: 5000,  max: 15000 },
        '축산물': { min: 15000, max: 35000 },
        '수산물': { min: 10000, max: 25000 },
        '가공식품': { min: 3000,  max: 12000 }
    };
    const range = base[productType] || { min: 5000, max: 20000 };
    const seed = productId * 12345;
    const random = (seed * 9301 + 49297) % 233280;
    const n = random / 233280;
    const p1 = Math.floor(n * (range.max - range.min + 1)) + range.min;
    const p2 = Math.floor(p1 * 1.8);
    const p3 = Math.floor(p1 * 2.5);
    return [
        { quantity: 1, unit: 'kg', price: p1 },
        { quantity: 2, unit: 'kg', price: p2 },
        { quantity: 3, unit: 'kg', price: p3 }
    ];
}
function generateRandomCompany(regionText) {
    const names = ['농협','농업협동조합','지역농협','특산품직판장','농산물유통센터','친환경농장','전통농업','청정농업','자연농업','유기농업','지역특산품','농가직판','농산물도매','신선농산물','제철농산물'];
    const suffix = ['협동조합','농장','직판장','유통센터','농협','농업회사','특산품센터','농산물센터','친환경농업','자연농업'];
    const regionPrefix = regionText.substring(0,2);
    const company = `${regionPrefix}${names[Math.floor(Math.random()*names.length)]}${suffix[Math.floor(Math.random()*suffix.length)]}`;
    const areaCodes = {'서울':'02','경기':'031','인천':'032','강원':'033','충북':'043','충남':'041','대전':'042','전북':'063','전남':'061','광주':'062','경북':'054','경남':'055','대구':'053','울산':'052','부산':'051','제주':'064'};
    const ac = areaCodes[regionPrefix] || '02';
    const phone = `${ac}-${Math.floor(Math.random()*9000)+1000}-${Math.floor(Math.random()*9000)+1000}`;
    const domains = ['naver.com','gmail.com','daum.net','coop.co.kr','farm.co.kr'];
    const email = `${company.toLowerCase().replace(/[^a-z0-9]/g,'')}@${domains[Math.floor(Math.random()*domains.length)]}`;
    return { name: company, phone, email };
}

// 화면 렌더
function renderProductDetail() {
    if (!currentProduct) return;
    document.getElementById('productTitle').textContent = currentProduct.name;

    const tagsContainer = document.getElementById('productTags');
    tagsContainer.innerHTML = `
        <span class="product-tag">${currentProduct.category}</span>
        <span class="product-tag">${currentProduct.region}</span>
        ${currentProduct.origin ? `<span class="product-tag">${currentProduct.origin}</span>` : ''}
    `;

    renderPriceOptions();

    const originEl = document.getElementById('originInfo');
    const seasonEl = document.getElementById('seasonInfo');
    if (originEl) originEl.textContent = currentProduct.region || '-';
    if (seasonEl) seasonEl.textContent = currentProduct.harvestSeason || '-';

    document.getElementById('descriptionText').textContent = currentProduct.description || '';
    renderCompanyInfo();
    renderProductImages();
}
function renderCompanyInfo() {
    if (!currentProduct.companyInfo) return;
    const { name, phone, email } = currentProduct.companyInfo;
    const nameEl = document.getElementById('companyName');
    const phoneEl = document.getElementById('companyPhone');
    const emailEl = document.getElementById('companyEmail');
    if (nameEl) nameEl.textContent = name;
    if (phoneEl) phoneEl.textContent = phone;
    if (emailEl) emailEl.textContent = email;
}
function renderPriceOptions() {
    const box = document.getElementById('priceOptions');
    const sel = document.getElementById('priceOptionSelect');
    box.innerHTML = '';
    sel.innerHTML = '<option value="">가격 옵션을 선택하세요</option>';
    currentProduct.priceOptions.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'price-option';
        div.innerHTML = `<span class="price-option-info">${opt.quantity}${opt.unit}</span><span class="price-option-amount">${opt.price.toLocaleString()}원</span>`;
        box.appendChild(div);

        const o = document.createElement('option');
        o.value = i; o.textContent = `${opt.quantity}${opt.unit} - ${opt.price.toLocaleString()}원`;
        sel.appendChild(o);
    });
}
function renderProductImages() {
    const main = document.getElementById('mainImage');
    const thumbs = document.getElementById('thumbnailContainer');
    if (!currentProduct.images || currentProduct.images.length === 0) {
        if (main) main.src = 'https://via.placeholder.com/400x400/cccccc/666666?text=이미지+없음';
        return;
    }
    if (main) { main.src = currentProduct.images[0].src; main.alt = currentProduct.images[0].alt; }
    thumbs.innerHTML = '';
    currentProduct.images.forEach((img, idx) => {
        const t = document.createElement('img');
        t.src = img.src; t.alt = img.alt; t.className = 'thumbnail';
        if (idx===0) t.classList.add('active');
        t.addEventListener('click', ()=>{ currentImageIndex = idx; updateMainImage(); updateThumbnailActive(); });
        thumbs.appendChild(t);
    });
    if (currentProduct.images.length <= 1) {
        const prev = document.getElementById('prevBtn'); const next = document.getElementById('nextBtn');
        if (prev) prev.style.display='none'; if (next) next.style.display='none';
    }
}
function updateMainImage() {
    if (!currentProduct.images || currentProduct.images.length===0) return;
    const main = document.getElementById('mainImage');
    const cur = currentProduct.images[currentImageIndex];
    if (main) { main.src = cur.src; main.alt = cur.alt; }
}
function updateThumbnailActive() {
    document.querySelectorAll('.thumbnail').forEach((el,i)=> el.classList.toggle('active', i===currentImageIndex));
}

// 관련 상품 (데모)
function loadRelatedProducts() {
    const dummy = [
        { id: 4, name: '제주 한라봉', category:'과일', region:'제주', priceOptions:[{quantity:2,unit:'kg',price:25000}], images:[{src:'https://via.placeholder.com/250x150/ff8c42/ffffff?text=제주+한라봉',alt:'제주 한라봉'}] },
        { id: 5, name: '강원도 무',   category:'채소', region:'강원', priceOptions:[{quantity:1,unit:'개',price:5000}],   images:[{src:'https://via.placeholder.com/250x150/27ae60/ffffff?text=강원+무',alt:'강원도 무'}] },
        { id: 6, name: '경북 배',     category:'과일', region:'경북', priceOptions:[{quantity:1,unit:'kg',price:15000}], images:[{src:'https://via.placeholder.com/250x150/e74c3c/ffffff?text=경북+배',alt:'경북 배'}] }
    ];
    renderRelatedProducts(dummy);
}
function renderRelatedProducts(list) {
    const grid = document.getElementById('relatedProductsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    list.forEach(p=>{
        const card = document.createElement('div');
        card.className = 'related-product-card';
        card.innerHTML = `
            <img src="${p.images[0].src}" alt="${p.images[0].alt}" class="related-product-image">
            <div class="related-product-info">
                <h3 class="related-product-title">${escapeHtml(p.name)}</h3>
                <div class="related-product-price">${p.priceOptions[0].quantity}${p.priceOptions[0].unit} ${p.priceOptions[0].price.toLocaleString()}원</div>
                <div class="related-product-tags"><span class="related-product-tag">${escapeHtml(p.category)}</span><span class="related-product-tag">${escapeHtml(p.region)}</span></div>
            </div>`;
        card.addEventListener('click', ()=>{ window.location.href = `/region-detail?id=${encodeURIComponent(p.id)}&region=${encodeURIComponent(p.region)}`; });
        grid.appendChild(card);
    });
}

// ✅ 리뷰 요약(평균/개수) 로드 & 렌더
async function loadReviewSummary(productId) {
    try {
        const res = await fetch(`/api/products/${productId}/reviews/summary`, { headers: { 'Accept':'application/json' }});
        if (!res.ok) throw new Error('요약 조회 실패');
        const s = await res.json();

        const avgNumEl = document.getElementById('avgRatingMini');
        const countEl  = document.getElementById('totalReviewCountMini');
        const starsEl  = document.getElementById('avgStarsMini');

        const avg = Number(s.averageRating || 0);
        avgNumEl.textContent = avg.toFixed(1);
        countEl.textContent  = s.totalCount || 0;

        const rounded = Math.round(avg);
        starsEl.innerHTML = '';
        for (let i=0;i<5;i++){
            const span = document.createElement('span');
            span.className = 'star';
            span.textContent = i < rounded ? '★' : '☆';
            starsEl.appendChild(span);
        }
    } catch (e) {
        console.error(e);
    }
}

// ✅ 최신 3개 리뷰
async function loadRecentReviews(productId) {
    const list = document.getElementById('reviewList');
    if (!list) return;

    // 로딩 스켈레톤
    list.innerHTML = `
        <div class="review-item skeleton"><div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div><div class="review-rating"><span class="skeleton-line w-50"></span></div><div class="review-text"><span class="skeleton-line w-90"></span><span class="skeleton-line w-80"></span></div></div>
        <div class="review-item skeleton"><div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div><div class="review-rating"><span class="skeleton-line w-50"></span></div><div class="review-text"><span class="skeleton-line w-90"></span><span class="skeleton-line w-60"></span></div></div>
        <div class="review-item skeleton"><div class="review-header"><span class="skeleton-line w-30"></span><span class="skeleton-line w-20"></span></div><div class="review-rating"><span class="skeleton-line w-50"></span></div><div class="review-text"><span class="skeleton-line w-80"></span><span class="skeleton-line w-70"></span></div></div>
    `;

    try {
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews?page=0&size=3`, { headers: { 'Accept':'application/json' }});
        if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status}`);
        const data = await res.json();
        const reviews = Array.isArray(data?.content) ? data.content : [];
        if (reviews.length === 0) {
            list.innerHTML = `<div class="review-empty">아직 작성된 리뷰가 없습니다. 첫 리뷰의 주인공이 되어보세요!</div>`;
            return;
        }
        renderReviews(reviews.map(r=>({
            reviewerName: `사용자 #${r.userId}`,
            rating: Number(r.rating) || 0,
            date: (r.createdAt || '').slice(0,10),
            text: r.content || ''
        })));
    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="review-error">리뷰를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>`;
    }
}
function renderReviews(reviews) {
    const list = document.getElementById('reviewList');
    list.innerHTML = '';
    reviews.forEach(rv=>{
        const el = document.createElement('div');
        el.className = 'review-item';
        const stars = '★'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating);
        el.innerHTML = `
            <div class="review-header"><span class="reviewer-name">${escapeHtml(rv.reviewerName)}</span><span class="review-date">${escapeHtml(rv.date || '')}</span></div>
            <div class="review-rating">${stars.split('').map(s=>`<span class="star">${s}</span>`).join('')}</div>
            <div class="review-text">${escapeHtml(rv.text)}</div>`;
        list.appendChild(el);
    });
}

// 공통 유틸/이벤트
function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function setupEventListeners() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', ()=>{ if (currentProduct.images?.length){ currentImageIndex=(currentImageIndex-1+currentProduct.images.length)%currentProduct.images.length; updateMainImage(); updateThumbnailActive(); }});
    if (nextBtn) nextBtn.addEventListener('click', ()=>{ if (currentProduct.images?.length){ currentImageIndex=(currentImageIndex+1)%currentProduct.images.length; updateMainImage(); updateThumbnailActive(); }});

    const dec = document.getElementById('decreaseBtn');
    const inc = document.getElementById('increaseBtn');
    const qty = document.getElementById('quantity');
    if (dec) dec.addEventListener('click', ()=>{ if (quantity>1){ quantity--; qty.value=quantity; updateTotalPrice(); }});
    if (inc) inc.addEventListener('click', ()=>{ quantity++; qty.value=quantity; updateTotalPrice(); });
    if (qty) qty.addEventListener('input', e=>{ quantity = Math.max(1, parseInt(e.target.value) || 1); e.target.value = quantity; updateTotalPrice(); });

    const sel = document.getElementById('priceOptionSelect');
    if (sel) sel.addEventListener('change', e=>{
        const idx = parseInt(e.target.value,10);
        if (!isNaN(idx) && idx>=0 && idx<currentProduct.priceOptions.length) selectedPriceOption=currentProduct.priceOptions[idx];
        else selectedPriceOption=null;
        updateTotalPrice();
    });

    const addBtn = document.getElementById('addToCartBtn');
    const buyBtn = document.getElementById('buyNowBtn');
    if (addBtn) addBtn.addEventListener('click', (ev)=>addToCart(ev));
    if (buyBtn) buyBtn.addEventListener('click', (ev)=>buyNow(ev));

    // 스켈레톤/메시지 애니메이션 스타일
    if (!document.querySelector('#messageAnimation')) {
        const style = document.createElement('style');
        style.id = 'messageAnimation';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .message { animation: slideIn 0.3s ease; }
            .skeleton .skeleton-line{display:block;height:10px;margin:6px 0;background:#eee;border-radius:4px}
            .skeleton .skeleton-line.w-20{width:20%}.skeleton .skeleton-line.w-30{width:30%}.skeleton .skeleton-line.w-50{width:50%}
            .skeleton .skeleton-line.w-60{width:60%}.skeleton .skeleton-line.w-70{width:70%}.skeleton .skeleton-line.w-80{width:80%}.skeleton .skeleton-line.w-90{width:90%}
        `;
        document.head.appendChild(style);
    }
}
function updateTotalPrice() {
    const el = document.getElementById('totalAmount');
    if (!el) return;
    el.textContent = selectedPriceOption ? `${(selectedPriceOption.price * quantity).toLocaleString()}원` : '0원';
}
function addToCart(event) {
    if (!selectedPriceOption) { showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target); return; }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const idx = cart.findIndex(it => it.productId === currentProduct.id && it.priceOptionIndex === currentProduct.priceOptions.indexOf(selectedPriceOption));
    if (idx>=0) cart[idx].quantity += quantity;
    else cart.push({ productId: currentProduct.id, productName: currentProduct.name, priceOptionIndex: currentProduct.priceOptions.indexOf(selectedPriceOption), priceOption: selectedPriceOption, quantity, image: currentProduct.images?.[0]?.src || currentProduct.thumbnailUrl });
    localStorage.setItem('cart', JSON.stringify(cart));
    showMessageAtPosition('장바구니에 상품이 추가되었습니다.', 'success', event.target);
}
function buyNow(event) {
    if (!selectedPriceOption) { showMessageAtPosition('가격 옵션을 선택해주세요.', 'error', event.target); return; }
    const orderItem = { id: currentProduct.id, name: currentProduct.name, quantity: `${selectedPriceOption.quantity}${selectedPriceOption.unit}`, price: `${selectedPriceOption.price.toLocaleString()}원`, timestamp: new Date().toISOString() };
    localStorage.setItem('currentOrder', JSON.stringify([orderItem]));
    showMessageAtPosition('구매 페이지로 이동합니다...', 'success', event.target);
    setTimeout(()=>{ window.location.href = '/buying'; }, 800);
}
function showMessage(message, type) { showMessageAtPosition(message, type); }
function showMessageAtPosition(message, type, target=null) {
    const old = document.querySelector('.message'); if (old) old.remove();
    const m = document.createElement('div'); m.className = `message message-${type}`; m.textContent = message;
    m.style.cssText = `position:fixed;padding:15px 20px;border-radius:8px;color:#fff;font-weight:500;z-index:1000;max-width:300px;${type==='success'?'background:#27ae60':'background:#e74c3c'}`;
    if (target) { const rect = target.getBoundingClientRect(); m.style.top = `${rect.bottom + 10}px`; m.style.left = `${rect.left}px`; } else { m.style.top='20px'; m.style.right='20px'; }
    document.body.appendChild(m); setTimeout(()=>m.remove(),3000);
}