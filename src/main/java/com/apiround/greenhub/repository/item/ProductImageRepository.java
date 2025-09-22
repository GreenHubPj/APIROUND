package com.apiround.greenhub.repository.item;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.apiround.greenhub.entity.item.ProductImage;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    
    /**
     * 상품 ID로 이미지 목록 조회 (정렬 순서대로)
     */
    List<ProductImage> findByProductIdOrderBySortOrderAsc(Integer productId);
    
    /**
     * 상품 ID로 썸네일 이미지 조회
     */
    ProductImage findByProductIdAndIsThumbnailTrue(Integer productId);
    
    /**
     * 상품 ID로 모든 이미지 삭제
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.productId = :productId")
    void deleteByProductId(@Param("productId") Integer productId);
    
    /**
     * 상품 ID와 이미지 ID로 이미지 삭제
     */
    @Modifying
    @Query("DELETE FROM ProductImage pi WHERE pi.productId = :productId AND pi.imageId = :imageId")
    void deleteByProductIdAndImageId(@Param("productId") Integer productId, @Param("imageId") Integer imageId);
}
