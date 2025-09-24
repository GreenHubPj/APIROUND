package com.apiround.greenhub.cart.repository;

import com.apiround.greenhub.cart.entity.CartEntity;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartEntity,Integer> {

    List<CartEntity> findByUserAndIsDeletedFalse(User user);

    // 특정 유저 + 옵션으로 이미 담은 상품이 있는지 확인 (중복 방지)
    Optional<CartEntity> findByUserAndPriceOptionAndIsDeletedFalse(User user, ProductPriceOption priceOption);
    
    // 삭제된 아이템도 포함하여 조회 (복구용)
    Optional<CartEntity> findByUserAndPriceOption(User user, ProductPriceOption priceOption);
    
    // 방법 3: 동시성 제어 - 동일한 사용자-옵션 조합에 대한 동시 접근 방지
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM CartEntity c WHERE c.user = :user AND c.priceOption = :priceOption")
    Optional<CartEntity> findByUserAndPriceOptionWithLock(@Param("user") User user, @Param("priceOption") ProductPriceOption priceOption);
}

