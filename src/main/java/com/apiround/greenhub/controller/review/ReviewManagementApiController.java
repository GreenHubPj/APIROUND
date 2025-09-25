package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.dto.review.PageResponse;
import com.apiround.greenhub.dto.review.ReviewDetailResponse;
import com.apiround.greenhub.dto.review.ReviewRowResponse;
import com.apiround.greenhub.service.review.ReviewManagementQueryService;
import com.apiround.greenhub.web.support.SessionUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/reviews")
public class ReviewManagementApiController {

    private final ReviewManagementQueryService reviewService;
    private final JdbcTemplate jdbcTemplate;

    /** ✅ 프론트의 companyId 주입 보조용 */
    @GetMapping("/_whoami")
    public Map<String, Object> whoami(HttpSession session) {
        Integer cid = SessionUtils.getCompanyIdFromSession(session);
        if (cid == null) {
            cid = SessionUtils.resolveCompanyId(null, session, jdbcTemplate);
        }
        return Map.of("companyId", cid);
    }

    /** 목록 조회 */
    @GetMapping
    public ResponseEntity<PageResponse<ReviewRowResponse>> list(
            @RequestParam(value = "companyId", required = false) Integer companyIdParam,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "rating", required = false) Integer rating,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "photo", required = false) String photo,
            @RequestParam(value = "dateRange", required = false) String dateRange,
            @RequestParam(value = "start", required = false) String start,
            @RequestParam(value = "end", required = false) String end,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "date,desc") String sort,
            HttpSession session
    ) {
        Integer companyId = SessionUtils.resolveCompanyId(companyIdParam, session, jdbcTemplate);
        PageResponse<ReviewRowResponse> result = reviewService.findReviewPage(
                companyId, keyword, type, rating, status, photo, dateRange, start, end, page, size, sort
        );
        return ResponseEntity.ok(result);
    }

    /** 상세 조회 */
    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDetailResponse> detail(
            @PathVariable Integer reviewId,
            @RequestParam(value = "companyId", required = false) Integer companyIdParam,
            HttpSession session
    ) {
        Integer companyId = SessionUtils.resolveCompanyId(companyIdParam, session, jdbcTemplate);
        ReviewDetailResponse detail = reviewService.findReviewDetail(companyId, reviewId);
        if (detail == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(detail);
    }

    /** 상태/메모/신고 등 PATCH – (스텁) */
    @PatchMapping("/{reviewId}")
    public ResponseEntity<Void> patch(@PathVariable Integer reviewId, @RequestBody(required = false) Object body) {
        return ResponseEntity.noContent().build();
    }

    /** 답글 (스텁) */
    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<Void> createReply(@PathVariable Integer reviewId, @RequestBody(required = false) Object body) {
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{reviewId}/reply")
    public ResponseEntity<Void> updateReply(@PathVariable Integer reviewId, @RequestBody(required = false) Object body) {
        return ResponseEntity.noContent().build();
    }
    @DeleteMapping("/{reviewId}/reply")
    public ResponseEntity<Void> deleteReply(@PathVariable Integer reviewId) {
        return ResponseEntity.noContent().build();
    }
}
