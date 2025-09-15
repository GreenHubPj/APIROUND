package com.apiround.greenhub.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "recipe")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recipe_id")
    private Integer recipeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name="user_id", insertable = false, updatable = false)
    private Integer userId;

    public Integer getUserId() {
        return user != null ? user.getUserId() : null;
    }

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "summary", length = 400)
    private String summary;

    @Column(name = "badge_text", length = 50)
    private String badgeText;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", columnDefinition = "ENUM('EASY','MEDIUM','HARD')")
    private Difficulty difficulty;

    @Column(name = "cook_minutes")
    private Integer cookMinutes;

    @Column(name = "total_minutes")
    private Integer totalMinutes;

    @Column(name = "servings", length = 40)
    private String servings;

    // ✅ 긴 URL 대비 (DB 스키마를 MEDIUMTEXT로 변경했다면 columnDefinition 맞추기)
    @Column(name = "hero_image_url", columnDefinition = "MEDIUMTEXT")
    private String heroImageUrl;

    @Column(name = "status", length = 20)
    private String status = "PUBLISHED";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 관계 매핑
    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RecipeIngredient> ingredients;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RecipeStep> steps;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RecipeXProduct> recipeProducts;

    public enum Difficulty { EASY, MEDIUM, HARD }
}
