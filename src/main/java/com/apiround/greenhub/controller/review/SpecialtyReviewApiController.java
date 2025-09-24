package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.dto.review.ReviewDtos.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewResponse;
import com.apiround.greenhub.dto.review.ReviewDtos.ReviewSummaryResponse;
import com.apiround.greenhub.service.SpecialtyReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/specialties/{specialtyId}/reviews")
public class SpecialtyReviewApiController {

    private final SpecialtyReviewService specialtyReviewService;

    @GetMapping
    public ResponseEntity<PageResponse<ReviewResponse>> list(
            @PathVariable Integer specialtyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort
    ) {
        return ResponseEntity.ok(specialtyReviewService.getReviewsBySpecialty(specialtyId, page, size, sort));
    }

    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryResponse> summary(@PathVariable Integer specialtyId) {
        return ResponseEntity.ok(specialtyReviewService.getSummaryBySpecialty(specialtyId));
    }
}
