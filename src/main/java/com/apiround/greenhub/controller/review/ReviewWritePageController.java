package com.apiround.greenhub.controller.review;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.service.MyReviewService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Controller
@RequiredArgsConstructor
@RequestMapping("/reviews")
public class ReviewWritePageController {

    private final MyReviewService myReviewService;

    @GetMapping("/write")
    public String reviewWrite(@RequestParam(required = false) Integer orderItemId,
                              @RequestParam(required = false) Integer productId,
                              HttpSession session,
                              Model model) {

        // ✅ 여러 세션 키 중 어떤 걸로 들어와도 잡히도록
        Integer userId = resolveLoginUserId(session);

        if (userId == null) {
            model.addAttribute("errorMessage", "로그인이 필요합니다.");
            return "review-write"; // 템플릿 파일: src/main/resources/templates/review-write.html
        }

        var vm = myReviewService.buildWriteViewModel(userId, orderItemId, productId);
        if (!vm.isAllowed()) {
            model.addAttribute("errorMessage", vm.message());
            return "review-write";
        }

        model.addAttribute("orderItemId", vm.orderItemId());
        model.addAttribute("productId", vm.productId());
        model.addAttribute("productName", vm.productName());
        model.addAttribute("productImage", vm.productImage());
        model.addAttribute("storeName", vm.storeName());
        model.addAttribute("priceText", vm.priceText());
        model.addAttribute("deliveredAt", vm.deliveredAt());
        return "review-write";
    }

    /** 세션에 저장된 다양한 형태의 로그인 정보를 userId(Integer)로 추출 */
    private Integer resolveLoginUserId(HttpSession session) {
        // 가장 흔한 키들 우선 확인
        Object[] candidates = new Object[] {
                session.getAttribute("loginUserId"),
                session.getAttribute("userId"),
                session.getAttribute("LOGIN_USER_ID"),
                session.getAttribute("loginuserid"), // 소문자 키 사용 사례
                session.getAttribute("user"),
                session.getAttribute("LOGIN_USER")
        };

        for (Object v : candidates) {
            // 1) 바로 숫자/문자열 id 인 경우
            Integer n = toInt(v);
            if (n != null) return n;

            // 2) User 엔티티가 들어있는 경우
            if (v instanceof User u && u.getUserId() != null) {
                return u.getUserId();
            }

            // 3) 맵에 담긴 경우 (예: {"userId": 123})
            if (v instanceof Map<?,?> m) {
                Object maybe = m.get("userId");
                Integer fromMap = toInt(maybe);
                if (fromMap != null) return fromMap;
            }
        }
        return null;
    }

    private Integer toInt(Object v) {
        if (v == null) return null;
        if (v instanceof Integer i) return i;
        if (v instanceof Number num) return num.intValue();
        if (v instanceof String s) {
            try { return Integer.parseInt(s); } catch (NumberFormatException ignore) {}
        }
        return null;
    }
}
