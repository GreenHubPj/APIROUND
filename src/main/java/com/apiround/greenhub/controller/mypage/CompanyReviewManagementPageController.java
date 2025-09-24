package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.web.support.SessionUtils;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 판매자 리뷰관리 화면 렌더 + companyId 주입
 * - SessionUtils.resolveCompanyId(...) 로 일관 처리
 * - model에 companyId 전달(템플릿에서 body data-company-id 로 박음)
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class CompanyReviewManagementPageController {

    private final JdbcTemplate jdbc;

    @GetMapping("/company/review-management")
    public String page(Model model, HttpSession session) {
        Integer companyId = SessionUtils.resolveCompanyId(null, session, jdbc);
        if (companyId != null) {
            // 세션 캐시 보강
            SessionUtils.cacheCompanyId(session, companyId);
            log.debug("[review-mgmt] resolved companyId={}", companyId);
        } else {
            log.warn("[review-mgmt] companyId not resolved (seller not logged in?)");
        }
        model.addAttribute("companyId", companyId); // null 가능
        return "review-management";
    }
}
