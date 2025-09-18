package com.apiround.greenhub.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.ProductListing.Status;

public interface ProductListingRepository extends JpaRepository<ProductListing, Integer> {
    List<ProductListing> findByStatus(Status status);
    List<ProductListing> findBySeller_CompanyIdOrderByListingIdAsc(Integer companyId);
    List<ProductListing> findBySellerCompanyIdOrderByListingIdAsc(Integer companyId);
    List<ProductListing> findBySellerCompanyIdAndIsDeleted(Integer companyId, String isDeleted);


}
