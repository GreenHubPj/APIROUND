// 지역 특산품 관리 JavaScript
class RegionalProductManager {
    constructor() {
        this.selectedProducts = new Set();
        this.init();
    }

    init() {
        this.loadRegions();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const regionSelect = document.getElementById('regionSelect');
        if (regionSelect) {
            regionSelect.addEventListener('change', (e) => {
                this.onRegionChange(e.target.value);
            });
        }
    }

    async loadRegions() {
        try {
            const response = await fetch('/api/regional-products/regions');
            if (response.ok) {
                const regions = await response.json();
                this.populateRegionSelect(regions);
            } else {
                console.error('지역 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('지역 목록 로드 중 오류:', error);
        }
    }

    populateRegionSelect(regions) {
        const regionSelect = document.getElementById('regionSelect');
        if (!regionSelect) return;

        // 기존 옵션 제거 (첫 번째 옵션 제외)
        while (regionSelect.children.length > 1) {
            regionSelect.removeChild(regionSelect.lastChild);
        }

        // 새 옵션 추가
        regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });
    }

    async onRegionChange(selectedRegion) {
        const regionalProductsDiv = document.getElementById('regionalProducts');
        const productListDiv = document.getElementById('productList');

        if (!selectedRegion) {
            regionalProductsDiv.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/api/regional-products/products?region=${encodeURIComponent(selectedRegion)}`);
            if (response.ok) {
                const products = await response.json();
                this.displayProducts(products);
                regionalProductsDiv.style.display = 'block';
            } else {
                console.error('특산품 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('특산품 목록 로드 중 오류:', error);
        }
    }

    displayProducts(products) {
        const productListDiv = document.getElementById('productList');
        if (!productListDiv) return;

        productListDiv.innerHTML = '';

        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.dataset.productId = product.productId;

            // 선택된 상품인지 확인
            if (this.selectedProducts.has(product.productId)) {
                productItem.classList.add('selected');
            }

            productItem.innerHTML = `
                <img src="/images/default-product.jpg" alt="${product.productName}" onerror="this.src='/images/default-product.jpg'">
                <div class="product-item-info">
                    <div class="product-item-name">${product.productName}</div>
                    <div class="product-item-region">${product.regionText}</div>
                </div>
            `;

            productItem.addEventListener('click', () => {
                this.toggleProductSelection(product, productItem);
            });

            productListDiv.appendChild(productItem);
        });
    }

    toggleProductSelection(product, productItem) {
        const productId = product.productId;

        if (this.selectedProducts.has(productId)) {
            // 선택 해제
            this.selectedProducts.delete(productId);
            productItem.classList.remove('selected');
            this.removeSelectedProductTag(productId);
        } else {
            // 선택 추가
            this.selectedProducts.add(productId);
            productItem.classList.add('selected');
            this.addSelectedProductTag(product);
        }
    }

    addSelectedProductTag(product) {
        const selectedProductList = document.getElementById('selectedProductList');
        if (!selectedProductList) return;

        const tag = document.createElement('div');
        tag.className = 'selected-product-tag';
        tag.dataset.productId = product.productId;
        tag.innerHTML = `
            ${product.productName}
            <button class="remove-product" type="button">×</button>
        `;

        const removeBtn = tag.querySelector('.remove-product');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeProductSelection(product.productId);
        });

        selectedProductList.appendChild(tag);
    }

    removeSelectedProductTag(productId) {
        const selectedProductList = document.getElementById('selectedProductList');
        if (!selectedProductList) return;

        const tag = selectedProductList.querySelector(`[data-product-id="${productId}"]`);
        if (tag) {
            tag.remove();
        }
    }

    removeProductSelection(productId) {
        // 선택된 상품에서 제거
        this.selectedProducts.delete(productId);
        
        // 태그 제거
        this.removeSelectedProductTag(productId);
        
        // 상품 목록에서 선택 표시 제거
        const productItem = document.querySelector(`.product-item[data-product-id="${productId}"]`);
        if (productItem) {
            productItem.classList.remove('selected');
        }
    }

    getSelectedProductIds() {
        return Array.from(this.selectedProducts);
    }

    // 폼 제출 시 선택된 특산품 데이터를 hidden input으로 추가
    addSelectedProductsToForm(form) {
        // 기존 hidden input 제거
        const existingInputs = form.querySelectorAll('input[name="selectedProducts"]');
        existingInputs.forEach(input => input.remove());

        // 선택된 상품들을 hidden input으로 추가
        this.getSelectedProductIds().forEach(productId => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'selectedProducts';
            input.value = productId;
            form.appendChild(input);
        });
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    window.regionalProductManager = new RegionalProductManager();
    
    // 폼 제출 시 선택된 특산품 데이터 추가
    const recipeForm = document.querySelector('form');
    if (recipeForm) {
        recipeForm.addEventListener('submit', function(e) {
            window.regionalProductManager.addSelectedProductsToForm(this);
        });
    }
});
