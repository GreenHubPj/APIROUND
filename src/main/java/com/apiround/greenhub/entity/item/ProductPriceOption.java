// com.apiround.greenhub.entity.item.ProductPriceOption
package com.apiround.greenhub.entity.item;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_price_option")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductPriceOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "option_id")
    private Long optionId;

    @Column(name = "product_id", nullable = false) // FK (int)
    private Integer productId;

    @Column(name = "option_label", length = 50)    // 예: “100g”
    private String optionLabel;

    @Column(name = "quantity")
    private Integer quantity;                      // 100

    @Column(name = "unit", length = 20)            // g, kg, 개…
    private String unit;

    @Column(name = "price", nullable = false)
    private Integer price;                         // 9000
}
