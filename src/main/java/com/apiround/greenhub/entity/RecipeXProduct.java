package com.apiround.greenhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "recipe_x_product")
@Data
public class RecipeXProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rxp_id")
    private Integer rxpId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_type", columnDefinition = "ENUM('MAIN','SUB','OPTIONAL')")
    private RelationType relationType;

    public enum RelationType { MAIN, SUB, OPTIONAL }
}
