package com.apiround.greenhub.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "order_item")
public class UserOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private UserOrder order;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "listing_id")
    private Integer listingId;

    @Column(name = "option_id")
    private Integer optionId;

    @Column(name = "company_id")
    private Integer companyId;

    // 스냅샷 컬럼들
    @Column(name = "product_name_snap", length = 200)
    private String productNameSnap;

    @Column(name = "option_label_snap", length = 80)
    private String optionLabelSnap;

    @Column(name = "unit_code_snap", length = 20)
    private String unitCodeSnap;

    @Column(name = "unit_price_snap", precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPriceSnap;

    @Column(name = "quantity", precision = 12, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "line_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal lineAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status", length = 30)
    private ItemStatus itemStatus;

    @Column(name = "courier_name", length = 80)
    private String courierName;

    @Column(name = "tracking_number", length = 80)
    private String trackingNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean deleted;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public enum ItemStatus {
        PENDING, PAID, PREPARING, SHIPPED, DELIVERED,
        CANCEL_REQUESTED, CANCELLED, REFUND_REQUESTED, REFUNDED
    }
}
