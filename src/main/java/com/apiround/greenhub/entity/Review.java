package com.apiround.greenhub.entity;

import com.apiround.greenhub.entity.item.Region;
import jakarta.persistence.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="product_review")
@Data
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer reviewId;

    // 상품(= specialty_product) FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Region product;

    // 사용자 FK (User.user_id INT). User 엔티티 매핑 없이 정수만 보관
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(nullable = false)
    private int rating; // 1~5

    @Lob
    @Column(nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }


}
