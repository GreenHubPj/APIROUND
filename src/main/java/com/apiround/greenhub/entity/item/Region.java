package com.apiround.greenhub.entity.item;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "specialty_product")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // AUTO_INCREMENT
    @Column(name = "product_id")
    private Integer productId;

    @Column(name = "product_name", length = 120, nullable = false)
    private String productName;

    @Column(name = "product_type", length = 20)
    private String productType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "region_text", length = 120)
    private String regionText;

    @Column(name = "harvest_season", length = 60)
    private String harvestSeason;

    @Column(name = "external_ref", length = 50)
    private String externalRef;

    @Column(name = "is_deleted", length = 1)
    private String isDeleted;

    @OneToMany(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    @Builder.Default
    private List<ProductPriceOption> priceOptions = new ArrayList<>();

    // 업체 정보 (ProductListing을 통해 연결)
    @Transient
    private String companyName;
    
    @Transient
    private String companyEmail;
    
    @Transient
    private String companyPhone;

    @Transient
    private String title;   // product_listing.title or specialty_product.product_name

    @Transient
    private String status;  // ACTIVE or '' (빈 값)

}
