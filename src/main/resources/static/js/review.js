// src/main/resources/static/js/review.js
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const writableBox = $('#writable .review-list');
  const writtenBox  = $('#written .review-list');

  // 탭 전환
  Array.from(document.querySelectorAll('.tab-button')).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      $('#'+btn.dataset.tab).classList.add('active');
    });
  });

  function toPrice(v){
    try { return Number(v).toLocaleString('ko-KR')+'원'; } catch(e){ return v; }
  }

  function cardWritable(item){
    const img = item.productImage || '/images/농산물.png';
    const name = item.productName || '상품';
    const store = item.storeName || '';
    const priceText = item.priceText || '';
    const origin = item.originText || '';

    const div = document.createElement('div');
    div.className = 'review-card';
    div.innerHTML = `
      <div class="card-left">
        <img src="${img}" alt="${name}" class="thumb"/>
      </div>
      <div class="card-body">
        <div class="name">${name}</div>
        <div class="meta">
          ${store? `<span class="store">${store}</span>`:``}
          ${origin? `<span class="origin">${origin}</span>`:``}
        </div>
        <div class="price">${priceText}</div>
      </div>
      <div class="card-right">
        <a class="btn" href="/reviews/write?orderItemId=${item.orderItemId}&productId=${item.productId}">리뷰 쓰기</a>
      </div>
    `;
    return div;
  }

  function cardWritten(item){
    const img = item.productImage || '/images/농산물.png';
    const name = item.productName || '상품';
    const rating = item.rating || 0;
    const content = item.content || '';

    const stars = '★★★★★☆☆☆☆☆'.slice(5 - Math.min(5, Math.max(0, rating))), // 간단 처리
          starHtml = `<span class="stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</span>`;

    const div = document.createElement('div');
    div.className = 'review-card';
    div.innerHTML = `
      <div class="card-left">
        <img src="${img}" alt="${name}" class="thumb"/>
      </div>
      <div class="card-body">
        <div class="name">${name}</div>
        <div class="rating">${starHtml}</div>
        <div class="content">${content}</div>
      </div>
    `;
    return div;
  }

  async function fetchJson(url){
    const res = await fetch(url, {headers: {'Accept':'application/json'}});
    if (res.status === 401) {
      let redirect = '/login';
      try {
        const body = await res.json();
        if (body && body.redirectUrl) redirect = body.redirectUrl;
      } catch(e){}
      window.location.href = redirect;
      return [];
    }
    return res.json();
  }

  async function load(){
    try {
      const [writable, written] = await Promise.all([
        fetchJson('/api/my/reviews/writable'),
        fetchJson('/api/my/reviews')
      ]);

      // 작성 가능
      writableBox.innerHTML = '';
      if (!writable || writable.length === 0) {
        writableBox.innerHTML = `<div class="empty">작성 가능한 리뷰가 없습니다.</div>`;
      } else {
        writable.forEach(it => writableBox.appendChild(cardWritable(it)));
      }

      // 내가 쓴 리뷰
      writtenBox.innerHTML = '';
      if (!written || written.length === 0) {
        writtenBox.innerHTML = `<div class="empty">작성한 리뷰가 없습니다.</div>`;
      } else {
        written.forEach(it => writtenBox.appendChild(cardWritten(it)));
      }
    } catch (e) {
      console.error(e);
      writableBox.innerHTML = `<div class="empty">목록을 불러오지 못했습니다.</div>`;
      writtenBox.innerHTML  = `<div class="empty">목록을 불러오지 못했습니다.</div>`;
    }
  }

  load();
})();
