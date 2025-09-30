package com.apiround.greenhub.web.entity;

import com.apiround.greenhub.entity.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_item")
@Getter @Setter
@ToString(exclude = "order")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_item_id")
    private Integer orderItemId;

    // FK: orders.order_id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "listing_id")
    private Integer listingId;

    @Column(name = "option_id")
    private Integer optionId;

    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "product_name_snap", length = 200)
    private String productNameSnap;

    @Column(name = "option_label_snap", length = 80)
    private String optionLabelSnap;

    @Column(name = "unit_code_snap", length = 20)
    private String unitCodeSnap;

    @Column(name = "unit_price_snap", precision = 12, scale = 2)
    private BigDecimal unitPriceSnap;

    @Column(name = "quantity", precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(name = "line_amount", precision = 12, scale = 2)
    private BigDecimal lineAmount;

    // enum 문자열 저장
    @Column(name = "item_status", length = 40)
    private String itemStatus;

    @Column(name = "courier_name", length = 80)
    private String courierName;

    @Column(name = "tracking_number", length = 80)
    private String trackingNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean isDeleted;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
