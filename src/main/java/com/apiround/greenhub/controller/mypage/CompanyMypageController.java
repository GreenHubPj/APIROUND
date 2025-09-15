package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.entity.Company;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.HashMap;
import java.util.Map;

@Controller
public class CompanyMypageController {

    @GetMapping("/mypage-company")
    public String mypageCompany(HttpSession session, Model model) {
        Company comp = (Company) session.getAttribute("company");
        if (comp == null) {
            // 회사 로그인으로 보내고 돌아올 URL 지정
            return "redirect:/company/login?redirectURL=/mypage-company";
        }

        // 표시용 이름(접두어/괄호 제거)과 아이콘 이니셜 생성
        String displayName  = toDisplayName(comp.getCompanyName());
        String iconInitials = toIconInitials(displayName);

        model.addAttribute("comp", comp);
        model.addAttribute("compDisplayName", displayName);
        model.addAttribute("compIcon", iconInitials);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrders", 156);
        stats.put("completedDeliveries", 142);
        stats.put("pendingOrders", 14);
        stats.put("rating", comp.getRating() != null ? comp.getRating() : 4.8);
        model.addAttribute("stats", stats);

        return "mypage_company";
    }

    /** 회사명에서 (주)/㈜/주식회사, 괄호·대괄호·공백 등을 제거한 표시용 이름 */
    private String toDisplayName(String name) {
        if (name == null) return "업체명";
        String n = name.trim();

        // 앞쪽 접두어 제거 (한/영 괄호 포함 다양한 케이스)
        n = n.replaceFirst("^\\s*(\\(\\s*주\\s*\\)|㈜|주식회사|주\\)|\\(주\\)|\\[주\\]|\\{주\\})\\s*", "");

        // 남은 괄호·공백이 시작에 또 붙어있으면 한 번 더 정리
        n = n.replaceFirst("^[\\s\\(\\[\\{\\)\\]\\}]+", "").trim();

        // 너무 짧아지면 원본 사용
        if (n.isEmpty()) return name.trim();
        return n;
    }

    /** 아이콘에 넣을 앞 2~3글자. 한글/영문/숫자만 취해 보기 좋게 만듦 */
    private String toIconInitials(String displayName) {
        if (displayName == null || displayName.isBlank()) return "GH";
        // 특수문자 제거
        String clean = displayName.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}가-힣]", "");
        if (clean.isEmpty()) clean = displayName.trim();

        // 앞 3글자까지, 기본은 2글자
        int len = clean.length();
        int take = Math.min(len >= 3 ? 3 : 2, len);
        return clean.substring(0, take);
    }
}
