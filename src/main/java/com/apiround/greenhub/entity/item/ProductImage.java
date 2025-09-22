package com.apiround.greenhub.entity.item;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_image")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id")
    private Integer imageId;
    
    @Column(name = "product_id", nullable = false)
    private Integer productId;
    
    @Column(name = "image_url", length = 1000)
    private String imageUrl;
    
    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData; // Base64 인코딩된 이미지 데이터
    
    @Column(name = "original_filename", length = 255)
    private String originalFilename;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "mime_type", length = 100)
    private String mimeType;
    
    @Column(name = "is_thumbnail")
    private Boolean isThumbnail;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
