package com.apiround.greenhub.web.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "orders")
public class UserOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "order_number", length = 30, nullable = false, unique = true)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30, nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "subtotal_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotalAmount;

    @Column(name = "shipping_fee", precision = 12, scale = 2, nullable = false)
    private BigDecimal shippingFee;

    @Column(name = "discount_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "receiver_name", length = 100)
    private String receiverName;

    @Column(name = "receiver_phone", length = 30)
    private String receiverPhone;

    @Column(name = "zipcode", length = 10)
    private String zipcode;

    @Column(name = "address1", length = 255)
    private String address1;

    @Column(name = "address2", length = 255)
    private String address2;

    @Column(name = "order_memo", length = 255)
    private String orderMemo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted")
    private Boolean deleted;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserOrderItem> items = new ArrayList<>();

    public void addItem(UserOrderItem item) {
        item.setOrder(this);
        this.items.add(item);
    }

    public enum OrderStatus {
        PENDING, PAID, PREPARING, SHIPPED, DELIVERED,
        CANCEL_REQUESTED, CANCELLED, REFUND_REQUESTED, REFUNDED
    }

    public enum PaymentMethod {
        CARD, BANK_TRANSFER, VIRTUAL_ACCOUNT, MOBILE, CASH
    }
}
