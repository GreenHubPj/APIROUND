package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.ProductListing;
import com.apiround.greenhub.entity.ProductListing.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductListingRepository extends JpaRepository<ProductListing, Long> {
    List<ProductListing> findByStatus(Status status);
}
