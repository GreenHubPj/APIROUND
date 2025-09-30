package com.apiround.greenhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_ingredient")
@Data
@NoArgsConstructor(force = true)
@AllArgsConstructor
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ingredient_row_id")
    private Integer ingredientRowId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;

    @Column(name = "line_no")
    private Integer lineNo;

    @Column(name = "name_text", length = 200)
    private String nameText;

    // ★ decimal(10,2) → BigDecimal 권장
    @Column(name = "qty_value", precision = 10, scale = 2)
    private BigDecimal qtyValue;

    @Column(name = "unit_code", length = 20)
    private String unitCode;

    @Column(name = "note", length = 200)
    private String note;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
