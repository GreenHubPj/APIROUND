package com.apiround.greenhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "reviews.scope")
public class ReviewScopeProperties {

    public enum Mode {
        AUTO,               // 자동감지 (실패시 빈 목록)
        PRODUCT,            // product.company_id
        COMPANY_PRODUCT,    // company_product(product_id, company_id)
        PRODUCT_LISTING_ITEM, // product_listing_item -> product_listing.company_id
        CUSTOM              // join + predicate 직접 지정
    }

    private boolean enabled = false;
    private Mode mode = Mode.AUTO;

    /** CUSTOM 모드에서만 사용: FROM 절 뒤에 붙일 JOIN 절 (예: "JOIN seller_product sp ON sp.product_id = pr.product_id") */
    private String join;

    /** CUSTOM 모드에서만 사용: 회사 제한 프레디컷 (예: "sp.seller_id = ?") */
    private String predicate;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Mode getMode() { return mode; }
    public void setMode(Mode mode) { this.mode = mode; }
    public String getJoin() { return join; }
    public void setJoin(String join) { this.join = join; }
    public String getPredicate() { return predicate; }
    public void setPredicate(String predicate) { this.predicate = predicate; }
}
