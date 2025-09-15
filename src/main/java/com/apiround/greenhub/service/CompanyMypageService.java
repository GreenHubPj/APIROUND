package com.apiround.greenhub.service;

import com.apiround.greenhub.dto.CompanyStats;
import com.apiround.greenhub.entity.Company;
import org.springframework.stereotype.Service;

@Service
public class CompanyMypageService {

    private final CompanyStatsService statsService;

    public CompanyMypageService(CompanyStatsService statsService) {
        this.statsService = statsService;
    }

    /** 회사명에서 (주)/㈜/주식회사 등 접두어와 불필요 괄호 제거 */
    public String toDisplayName(String name) {
        if (name == null) return "업체명";
        String n = name.trim();
        n = n.replaceFirst("^\\s*(\\(\\s*주\\s*\\)|㈜|주식회사|주\\)|\\(주\\)|\\[주\\]|\\{주\\})\\s*", "");
        n = n.replaceFirst("^[\\s\\(\\[\\{\\)\\]\\}]+", "").trim();
        return n.isEmpty() ? name.trim() : n;
    }

    /** 아이콘 이니셜(앞 2~3글자) */
    public String toIconInitials(String displayName) {
        if (displayName == null || displayName.isBlank()) return "GH";
        String clean = displayName.replaceAll("[^\\p{IsAlphabetic}\\p{IsDigit}가-힣]", "");
        if (clean.isEmpty()) clean = displayName.trim();
        int len = clean.length();
        int take = Math.min(len >= 3 ? 3 : 2, len);
        return clean.substring(0, take);
    }

    /** 업체 통계 */
    public CompanyStats getStats(Company comp) {
        return statsService.buildStatsForCompany(comp.getCompanyId());
    }
}
