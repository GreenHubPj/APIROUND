package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.entity.Company;
import com.apiround.greenhub.repository.CompanyRepository;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
public class CompanyProfileController {

    private static final Logger log = LoggerFactory.getLogger(CompanyProfileController.class);
    private final CompanyRepository companyRepository;

    public CompanyProfileController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    /** 정보수정 화면 */
    @GetMapping("/profile-edit-company")
    public String editCompany(Model model, HttpSession session) {
        Company sessionCompany = (Company) session.getAttribute("company");
        if (sessionCompany == null) {
            // 회사 로그인으로 보내고 돌아올 URL 지정
            return "redirect:/company/login?redirectURL=/profile-edit-company";
        }

        // 세션에 있는 ID 기준으로 최신 엔티티 로드(안전)
        Optional<Company> opt = companyRepository.findById(sessionCompany.getCompanyId());
        Company comp = opt.orElse(sessionCompany);
        model.addAttribute("comp", comp);
        return "profile-edit-company";
    }

    /** 정보 업데이트 */
    @PostMapping("/company/profile/update")
    public String updateCompany(@RequestParam String companyName,
                                @RequestParam(required = false) String newPassword,
                                @RequestParam String managerName,
                                @RequestParam String managerPhone,
                                @RequestParam(required = false) String address,
                                HttpSession session,
                                RedirectAttributes ra) {
        Company sessionCompany = (Company) session.getAttribute("company");
        if (sessionCompany == null) {
            ra.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/company/login?redirectURL=/profile-edit-company";
        }

        Company comp = companyRepository.findById(sessionCompany.getCompanyId())
                .orElse(sessionCompany);

        // 필수값 검증
        if (companyName == null || companyName.isBlank()) {
            ra.addFlashAttribute("error", "기업명을 입력해주세요.");
            return "redirect:/profile-edit-company";
        }
        if (managerName == null || managerName.isBlank()) {
            ra.addFlashAttribute("error", "담당자명을 입력해주세요.");
            return "redirect:/profile-edit-company";
        }
        if (managerPhone == null || managerPhone.isBlank()) {
            ra.addFlashAttribute("error", "담당자 번호를 입력해주세요.");
            return "redirect:/profile-edit-company";
        }

        // 업데이트
        comp.setCompanyName(companyName.trim());
        comp.setManagerName(managerName.trim());
        comp.setManagerPhone(managerPhone.trim());
        comp.setAddress(address != null ? address.trim() : null);

        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                ra.addFlashAttribute("error", "새 비밀번호는 6자 이상이어야 합니다.");
                return "redirect:/profile-edit-company";
            }
            comp.setPassword(PasswordUtil.encode(newPassword));
        }

        companyRepository.save(comp);

        // 세션에도 최신 반영
        session.setAttribute("company", comp);

        ra.addFlashAttribute("success", "업체 정보가 저장되었습니다.");
        return "redirect:/profile-edit-company";
    }

    /** 탈퇴 */
    @PostMapping("/company/profile/delete")
    public String deleteCompany(HttpSession session, RedirectAttributes ra) {
        Company sessionCompany = (Company) session.getAttribute("company");
        if (sessionCompany == null) {
            ra.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/company/login?redirectURL=/mypage-company";
        }

        try {
            Company comp = companyRepository.findById(sessionCompany.getCompanyId())
                    .orElse(sessionCompany);
            comp.setDeletedAt(LocalDateTime.now());
            companyRepository.save(comp);

            // 세션 만료 후 홈으로
            try { session.invalidate(); } catch (Exception ignored) {}
            ra.addFlashAttribute("success", "탈퇴가 완료되었습니다.");
            return "redirect:/";
        } catch (Exception e) {
            log.error("업체 탈퇴 실패", e);
            ra.addFlashAttribute("error", "탈퇴 처리 중 오류가 발생했습니다.");
            return "redirect:/profile-edit-company";
        }
    }
}
