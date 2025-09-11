package com.apiround.greenhub.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_step")
@Data
public class RecipeStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "step_id")
    private Long stepId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnore
    private Recipe recipe;

    // ★ 스키마: step_no int(11)
    @Column(name = "step_no")
    private Integer stepNo;

    // ★ 스키마: instruction text
    @Column(name = "instruction", columnDefinition = "TEXT")
    private String instruction;

    // ★ 스키마: step_image_url varchar(500)
    @Column(name = "step_image_url", length = 500)
    private String stepImageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
