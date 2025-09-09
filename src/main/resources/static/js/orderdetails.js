document.addEventListener('DOMContentLoaded', function() {
    console.log('GreenHub 주문 상세 페이지가 로드되었습니다.');

    // URL 파라미터에서 주문 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id') || 'ORD-2024-001'; // 기본값 설정

    // 더미 주문 상세 데이터
    const orderDetailsData = {
        'ORD-2024-001': {
            id: 'ORD-2024-001',
            date: '2024-01-15',
            status: 'completed',
            items: [
                { 
                    id: 'PROD-001',
                    name: '문경 사과', 
                    image: '/images/사과.jpg', 
                    quantity: 2, 
                    unitPrice: 15000, 
                    unit: 'kg',
                    totalPrice: 30000
                },
                { 
                    id: 'PROD-002',
                    name: '고흥 돼지고기', 
                    image: '/images/제철 돼지.jpg', 
                    quantity: 1, 
                    unitPrice: 25000, 
                    unit: 'kg',
                    totalPrice: 25000
                },
                { 
                    id: 'PROD-003',
                    name: '제주 귤', 
                    image: '/images/인기 귤.jpg', 
                    quantity: 3, 
                    unitPrice: 12000, 
                    unit: 'kg',
                    totalPrice: 36000
                }
            ],
            totalAmount: 91000,
            shippingFee: 3000,
            discountAmount: 0,
            finalAmount: 94000,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '신용카드 (KB국민카드)',
                date: '2024-01-15 14:35',
                approvalNumber: '12345678'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-15 14:30', completed: true },
                { status: '상품 준비', date: '2024-01-16 09:15', completed: true },
                { status: '배송 시작', date: '2024-01-17 08:00', completed: true },
                { status: '배송 완료', date: '2024-01-17 15:30', completed: true }
            ]
        },
        'ORD-2024-002': {
            id: 'ORD-2024-002',
            date: '2024-01-12',
            status: 'shipping',
            items: [
                { 
                    id: 'PROD-004',
                    name: '강원도 감자', 
                    image: '/images/인기 감자.jpg', 
                    quantity: 5, 
                    unitPrice: 8000, 
                    unit: 'kg',
                    totalPrice: 40000
                },
                { 
                    id: 'PROD-005',
                    name: '산청 표고버섯', 
                    image: '/images/인기 표고버섯.jpg', 
                    quantity: 2, 
                    unitPrice: 18000, 
                    unit: 'kg',
                    totalPrice: 36000
                }
            ],
            totalAmount: 76000,
            shippingFee: 3000,
            discountAmount: 0,
            finalAmount: 79000,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '신용카드 (신한카드)',
                date: '2024-01-12 16:20',
                approvalNumber: '87654321'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-12 16:20', completed: true },
                { status: '상품 준비', date: '2024-01-13 10:30', completed: true },
                { status: '배송 시작', date: '2024-01-14 09:00', completed: true },
                { status: '배송 완료', date: '', completed: false }
            ]
        },
        'ORD-2024-003': {
            id: 'ORD-2024-003',
            date: '2024-01-10',
            status: 'preparing',
            items: [
                { 
                    id: 'PROD-006',
                    name: '이천 쌀', 
                    image: '/images/쌀.jpg', 
                    quantity: 1, 
                    unitPrice: 35000, 
                    unit: '20kg',
                    totalPrice: 35000
                },
                { 
                    id: 'PROD-007',
                    name: '구좌 당근', 
                    image: '/images/제철 당근.jpg', 
                    quantity: 3, 
                    unitPrice: 9000, 
                    unit: 'kg',
                    totalPrice: 27000
                }
            ],
            totalAmount: 62000,
            shippingFee: 3000,
            discountAmount: 0,
            finalAmount: 65000,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '계좌이체 (국민은행)',
                date: '2024-01-10 11:45',
                approvalNumber: '11223344'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-10 11:45', completed: true },
                { status: '상품 준비', date: '', completed: false },
                { status: '배송 시작', date: '', completed: false },
                { status: '배송 완료', date: '', completed: false }
            ]
        },
        'ORD-2024-004': {
            id: 'ORD-2024-004',
            date: '2024-01-08',
            status: 'completed',
            items: [
                { 
                    id: 'PROD-009',
                    name: '서해 새우', 
                    image: '/images/인기 새우.jpg', 
                    quantity: 1, 
                    unitPrice: 28000, 
                    unit: 'kg',
                    totalPrice: 28000
                },
                { 
                    id: 'PROD-010',
                    name: '의성 마늘', 
                    image: '/images/제철 마늘.jpg', 
                    quantity: 2, 
                    unitPrice: 15000, 
                    unit: 'kg',
                    totalPrice: 30000
                }
            ],
            totalAmount: 58000,
            shippingFee: 3000,
            discountAmount: 0,
            finalAmount: 61000,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '신용카드 (하나카드)',
                date: '2024-01-08 09:30',
                approvalNumber: '99887766'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-08 09:30', completed: true },
                { status: '상품 준비', date: '2024-01-08 14:20', completed: true },
                { status: '배송 시작', date: '2024-01-09 08:00', completed: true },
                { status: '배송 완료', date: '2024-01-09 16:45', completed: true }
            ]
        },
        'ORD-2024-005': {
            id: 'ORD-2024-005',
            date: '2024-01-05',
            status: 'cancelled',
            items: [
                { 
                    id: 'PROD-008',
                    name: '경산 복숭아', 
                    image: '/images/제철 천도복숭아.jpg', 
                    quantity: 4, 
                    unitPrice: 20000, 
                    unit: 'kg',
                    totalPrice: 80000
                }
            ],
            totalAmount: 80000,
            shippingFee: 3000,
            discountAmount: 0,
            finalAmount: 83000,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '신용카드 (현대카드)',
                date: '2024-01-05 13:20',
                approvalNumber: '55667788'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-05 13:20', completed: true },
                { status: '주문 취소', date: '2024-01-05 15:30', completed: true },
                { status: '상품 준비', date: '', completed: false },
                { status: '배송 시작', date: '', completed: false }
            ]
        },
        'ORD-2024-006': {
            id: 'ORD-2024-006',
            date: '2024-01-03',
            status: 'completed',
            items: [
                { 
                    id: 'PROD-011',
                    name: '문경 사과', 
                    image: '/images/사과.jpg', 
                    quantity: 3, 
                    unitPrice: 22500, 
                    unit: 'kg',
                    totalPrice: 67500
                },
                { 
                    id: 'PROD-012',
                    name: '고흥 돼지고기', 
                    image: '/images/제철 돼지.jpg', 
                    quantity: 2, 
                    unitPrice: 50000, 
                    unit: 'kg',
                    totalPrice: 100000
                },
                { 
                    id: 'PROD-013',
                    name: '제주 귤', 
                    image: '/images/인기 귤.jpg', 
                    quantity: 2, 
                    unitPrice: 8000, 
                    unit: 'kg',
                    totalPrice: 16000
                },
                { 
                    id: 'PROD-014',
                    name: '강원도 감자', 
                    image: '/images/인기 감자.jpg', 
                    quantity: 3, 
                    unitPrice: 4800, 
                    unit: 'kg',
                    totalPrice: 14400
                }
            ],
            totalAmount: 197900,
            shippingFee: 0,
            discountAmount: 0,
            finalAmount: 197900,
            delivery: {
                recipientName: 'Yoyo Kang',
                recipientPhone: '010-1234-5678',
                address: '경기도 성남시 수정구 123-456',
                note: '부재시 경비실에 맡겨주세요'
            },
            payment: {
                method: '신용카드 (삼성카드)',
                date: '2024-01-03 16:45',
                approvalNumber: '44556677'
            },
            tracking: [
                { status: '주문 접수', date: '2024-01-03 16:45', completed: true },
                { status: '상품 준비', date: '2024-01-04 10:20', completed: true },
                { status: '배송 시작', date: '2024-01-05 08:30', completed: true },
                { status: '배송 완료', date: '2024-01-05 14:15', completed: true }
            ]
        }
    };

    // 상태별 한글 변환
    const statusLabels = {
        'completed': '배송완료',
        'shipping': '배송중',
        'preparing': '준비중',
        'cancelled': '취소됨'
    };

    // 상태별 아이콘
    const statusIcons = {
        '주문 접수': '📦',
        '상품 준비': '🏭',
        '배송 시작': '🚚',
        '배송 완료': '✅',
        '주문 취소': '❌'
    };

    // 금액 포맷팅
    function formatPrice(price) {
        return price.toLocaleString('ko-KR') + '원';
    }

    // 날짜 포맷팅
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 주문 상세 정보 로드
    function loadOrderDetails() {
        const orderData = orderDetailsData[orderId];
        
        if (!orderData) {
            alert('주문 정보를 찾을 수 없습니다.');
            window.location.href = '/orderhistory';
            return;
        }

        // 기본 정보 업데이트
        document.getElementById('orderNumber').textContent = `주문번호: ${orderData.id}`;
        document.getElementById('orderDate').textContent = `주문일: ${formatDate(orderData.date)}`;
        
        const statusElement = document.getElementById('orderStatus');
        statusElement.innerHTML = `<span class="status-badge status-${orderData.status}">${statusLabels[orderData.status]}</span>`;

        // 주문 상품 목록 렌더링
        renderOrderItems(orderData.items);

        // 배송 정보 업데이트
        updateDeliveryInfo(orderData.delivery);

        // 배송 추적 정보 업데이트
        updateTrackingInfo(orderData.tracking);

        // 결제 정보 업데이트
        updatePaymentInfo(orderData.payment, orderData);

        // 액션 버튼 표시/숨김 처리
        updateActionButtons(orderData.status);

        console.log('주문 상세 정보 로드 완료:', orderData);
    }

    // 주문 상품 목록 렌더링
    function renderOrderItems(items) {
        const itemsList = document.getElementById('orderItemsList');
        
        itemsList.innerHTML = items.map(item => `
            <div class="order-item-detail" data-product-id="${item.id}" onclick="goToProduct('${item.id}')">
                <img src="${item.image}" alt="${item.name}" class="item-image-detail">
                <div class="item-info-detail">
                    <div class="item-name-detail">${item.name}</div>
                    <div class="item-details-detail">
                        <div class="item-quantity">수량: ${item.quantity}${item.unit}</div>
                        <div class="item-unit-price">단가: ${formatPrice(item.unitPrice)}</div>
                    </div>
                </div>
                <div class="item-total-price">${formatPrice(item.totalPrice)}</div>
            </div>
        `).join('');
    }

    // 배송 정보 업데이트
    function updateDeliveryInfo(delivery) {
        document.getElementById('recipientName').textContent = delivery.recipientName;
        document.getElementById('recipientPhone').textContent = delivery.recipientPhone;
        document.getElementById('deliveryAddress').textContent = delivery.address;
        document.getElementById('deliveryNote').textContent = delivery.note;
    }

    // 배송 추적 정보 업데이트
    function updateTrackingInfo(tracking) {
        const trackingContainer = document.getElementById('deliveryTracking');
        
        const trackingHtml = `
            <h4>배송 추적</h4>
            <div class="tracking-timeline">
                ${tracking.map(step => `
                    <div class="tracking-step ${step.completed ? 'completed' : ''}">
                        <div class="step-icon">${statusIcons[step.status]}</div>
                        <div class="step-content">
                            <div class="step-title">${step.status}</div>
                            <div class="step-date">${step.date || '진행 예정'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        trackingContainer.innerHTML = trackingHtml;
    }

    // 결제 정보 업데이트
    function updatePaymentInfo(payment, orderData) {
        document.getElementById('paymentMethod').textContent = payment.method;
        document.getElementById('paymentDate').textContent = payment.date;
        document.getElementById('approvalNumber').textContent = payment.approvalNumber;
        
        document.getElementById('productAmount').textContent = formatPrice(orderData.totalAmount);
        document.getElementById('shippingFee').textContent = orderData.shippingFee > 0 ? formatPrice(orderData.shippingFee) : '무료';
        document.getElementById('discountAmount').textContent = orderData.discountAmount > 0 ? `-${formatPrice(orderData.discountAmount)}` : '-0원';
        document.getElementById('totalAmount').textContent = formatPrice(orderData.finalAmount);
    }

    // 액션 버튼 표시/숨김 처리
    function updateActionButtons(status) {
        const returnExchangeBtn = document.getElementById('returnExchangeBtn');
        const reviewBtn = document.querySelector('button[onclick="writeReview()"]');
        
        // 모든 버튼 숨기기
        returnExchangeBtn.style.display = 'none';
        if (reviewBtn) reviewBtn.style.display = 'none';
        
        // 주문 상태에 따라 버튼 표시
        switch (status) {
            case 'completed':
                // 배송완료된 주문은 반품/교환/리뷰 가능
                returnExchangeBtn.style.display = 'inline-block';
                if (reviewBtn) reviewBtn.style.display = 'inline-block';
                break;
            case 'shipping':
                // 배송중인 주문은 반품/교환 가능
                returnExchangeBtn.style.display = 'inline-block';
                break;
            case 'preparing':
                // 준비중인 주문은 반품/교환 가능
                returnExchangeBtn.style.display = 'inline-block';
                break;
            case 'cancelled':
                // 취소된 주문은 반품/교환/리뷰 불필요
                break;
        }
    }

    // 액션 함수들
    window.goToProduct = function(productId) {
        // 상품 상세 페이지로 이동 (실제 구현 시 상품 상세 페이지 경로로 수정)
        alert(`${productId} 상품 상세 페이지로 이동합니다.`);
        // window.location.href = `/product-detail?id=${productId}`;
    };

    window.showReceipt = function() {
        const orderData = orderDetailsData[orderId];
        if (!orderData) {
            alert('주문 정보를 찾을 수 없습니다.');
            return;
        }
        
        generateReceiptContent(orderData);
        document.getElementById('receiptModal').style.display = 'block';
    };

    window.closeReceipt = function() {
        document.getElementById('receiptModal').style.display = 'none';
    };

    window.downloadReceipt = function() {
        const modalContent = document.querySelector('.receipt-modal-content');
        
        // 모달 스타일을 다운로드용으로 임시 조정
        const originalBorderRadius = modalContent.style.borderRadius;
        const originalBoxShadow = modalContent.style.boxShadow;
        
        modalContent.style.borderRadius = '0';
        modalContent.style.boxShadow = 'none';
        
        // html2canvas로 모달 내용 캡처
        html2canvas(modalContent, {
            backgroundColor: '#ffffff',
            scale: 3, // 더 높은 해상도
            useCORS: true,
            allowTaint: true,
            logging: false
        }).then(canvas => {
            // 원래 스타일 복원
            modalContent.style.borderRadius = originalBorderRadius;
            modalContent.style.boxShadow = originalBoxShadow;
            
            // 캔버스를 이미지로 변환
            const link = document.createElement('a');
            link.download = `receipt_${orderId}.png`;
            link.href = canvas.toDataURL('image/png', 1.0); // 최고 품질
            
            // 다운로드 실행
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('영수증이 다운로드되었습니다.');
        }).catch(error => {
            // 원래 스타일 복원
            modalContent.style.borderRadius = originalBorderRadius;
            modalContent.style.boxShadow = originalBoxShadow;
            
            console.error('영수증 다운로드 중 오류가 발생했습니다:', error);
            alert('영수증 다운로드 중 오류가 발생했습니다.');
        });
    };

    // 영수증 내용 생성
    function generateReceiptContent(orderData) {
        const receiptBody = document.getElementById('receiptBody');
        
        const receiptHtml = `
            <div class="receipt-info">
                <div class="receipt-title">영수증</div>
                
                <div class="receipt-section">
                    <h3>주문 정보</h3>
                    <div class="receipt-row">
                        <span class="receipt-label">주문번호</span>
                        <span class="receipt-value">${orderData.id}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">주문일시</span>
                        <span class="receipt-value">${orderData.payment.date}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">주문상태</span>
                        <span class="receipt-value">${statusLabels[orderData.status]}</span>
                    </div>
                </div>

                <div class="receipt-section">
                    <h3>주문 상품</h3>
                    ${orderData.items.map(item => `
                        <div class="receipt-row">
                            <span class="receipt-label">${item.name} (${item.quantity}${item.unit})</span>
                            <span class="receipt-value">${formatPrice(item.totalPrice)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="receipt-section">
                    <h3>배송 정보</h3>
                    <div class="receipt-row">
                        <span class="receipt-label">받는 분</span>
                        <span class="receipt-value">${orderData.delivery.recipientName}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">연락처</span>
                        <span class="receipt-value">${orderData.delivery.recipientPhone}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">배송 주소</span>
                        <span class="receipt-value">${orderData.delivery.address}</span>
                    </div>
                </div>

                <div class="receipt-section">
                    <h3>결제 정보</h3>
                    <div class="receipt-row">
                        <span class="receipt-label">결제 방법</span>
                        <span class="receipt-value">${orderData.payment.method}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">승인 번호</span>
                        <span class="receipt-value">${orderData.payment.approvalNumber}</span>
                    </div>
                </div>

                <div class="receipt-total">
                    <div class="receipt-row">
                        <span class="receipt-label">상품 금액</span>
                        <span class="receipt-value">${formatPrice(orderData.totalAmount)}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">배송비</span>
                        <span class="receipt-value">${orderData.shippingFee > 0 ? formatPrice(orderData.shippingFee) : '무료'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">할인 금액</span>
                        <span class="receipt-value">${orderData.discountAmount > 0 ? `-${formatPrice(orderData.discountAmount)}` : '-0원'}</span>
                    </div>
                    <div class="receipt-row">
                        <span class="receipt-label">총 결제 금액</span>
                        <span class="receipt-value">${formatPrice(orderData.finalAmount)}</span>
                    </div>
                </div>

                <div class="receipt-notes">
                    <p>본 영수증은 구매내역 확인용도로만 사용하실 수 있으며, 법적인 효력은 없습니다.</p>
                    <p>법적 증빙서류가 필요하신 경우는 현금영수증, 신용카드 전표에서 확인해주시기 바랍니다.</p>
                </div>
            </div>
        `;
        
        receiptBody.innerHTML = receiptHtml;
    }

    // 장바구니 데이터 관리 함수들
    function getCartItems() {
        const cartData = localStorage.getItem('shoppingCart');
        return cartData ? JSON.parse(cartData) : [];
    }

    function saveCartItems(items) {
        localStorage.setItem('shoppingCart', JSON.stringify(items));
    }

    function addToCart(product) {
        const cartItems = getCartItems();
        const existingItem = cartItems.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity;
            existingItem.total = existingItem.quantity * existingItem.price;
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                unit: product.unit,
                total: product.total,
                image: product.image || '/images/default-product.jpg'
            });
        }
        
        saveCartItems(cartItems);
        return cartItems;
    }

    window.reorder = function() {
        const orderData = orderDetailsData[orderId];
        if (!orderData) {
            alert('주문 정보를 찾을 수 없습니다.');
            return;
        }

        if (confirm('이 주문과 동일한 상품을 장바구니에 추가하시겠습니까?')) {
            let addedCount = 0;
            
            // 주문의 모든 상품을 장바구니에 추가
            orderData.items.forEach(item => {
                const product = {
                    id: item.id,
                    name: item.name,
                    price: item.unitPrice,
                    quantity: item.quantity,
                    unit: item.unit,
                    total: item.totalPrice,
                    image: item.image
                };
                
                addToCart(product);
                addedCount++;
            });
            
            if (addedCount > 0) {
                alert(`${addedCount}개 상품이 장바구니에 추가되었습니다.\n장바구니 페이지로 이동하시겠습니까?`);
                if (confirm('장바구니로 이동하시겠습니까?')) {
                    window.location.href = '/shoppinglist';
                }
            } else {
                alert('상품을 장바구니에 추가할 수 없습니다.');
            }
        }
    };

    window.writeReview = function() {
        // 리뷰 페이지로 바로 이동
        window.location.href = '/review';
    };

    window.requestReturnExchange = function() {
        const choice = confirm('반품/교환을 신청하시겠습니까?\n\n확인: 반품/교환 신청\n취소: 취소');
        if (choice) {
            alert('반품/교환 신청이 접수되었습니다.\n고객센터에서 1-2일 내에 연락드리겠습니다.');
        }
    };

    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
        const modal = document.getElementById('receiptModal');
        if (event.target === modal) {
            closeReceipt();
        }
    };

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeReceipt();
        }
    });

    // 페이지 로드 시 주문 상세 정보 로드
    loadOrderDetails();

    // 페이지 로드 완료 메시지
    console.log('주문 상세 페이지 초기화 완료');
});
