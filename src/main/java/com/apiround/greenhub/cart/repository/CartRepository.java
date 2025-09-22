package com.apiround.greenhub.cart.repository;

import com.apiround.greenhub.cart.entity.CartEntity;
import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.entity.item.ProductPriceOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartEntity,Integer> {

    List<CartEntity> findByUserAndIsDeletedFalse(User user);

    // 특정 유저 + 옵션으로 이미 담은 상품이 있는지 확인 (중복 방지)
    Optional<CartEntity> findByUserAndPriceOptionAndIsDeletedFalse(User user, ProductPriceOption priceOption);
}

