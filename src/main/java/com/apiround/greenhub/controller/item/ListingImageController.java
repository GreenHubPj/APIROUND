// src/main/java/com/apiround/greenhub/controller/image/ListingImageController.java
package com.apiround.greenhub.controller.item;

import com.apiround.greenhub.repository.ProductListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
public class ListingImageController {

    private final ProductListingRepository listingRepo;

    @GetMapping("/api/listings/{id}/thumbnail")
    public ResponseEntity<byte[]> getThumbnail(@PathVariable Integer id) {
        var listingOpt = listingRepo.findById(id);
        if (listingOpt.isEmpty()) return ResponseEntity.notFound().build();

        var listing = listingOpt.get();

        // 1) DB 바이트 우선
        if (listing.getThumbnailData() != null && listing.getThumbnailData().length > 0) {
            String mime = (listing.getThumbnailMime() == null || listing.getThumbnailMime().isBlank())
                    ? "image/jpeg" : listing.getThumbnailMime();
            return ResponseEntity.ok()
                    .header("Content-Type", mime)
                    .header("Cache-Control", "public, max-age=86400") // 1일 캐시
                    .body(listing.getThumbnailData());
        }

        // 2) 과거 URL이 있으면 302 리다이렉트(선택)
        if (listing.getThumbnailUrl() != null && !listing.getThumbnailUrl().isBlank()) {
            return ResponseEntity.status(302).header("Location", listing.getThumbnailUrl()).build();
        }

        // 3) 없으면 404
        return ResponseEntity.notFound().build();
    }
}
