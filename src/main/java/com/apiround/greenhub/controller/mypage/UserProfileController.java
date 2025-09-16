package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.util.PasswordUtil;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
public class UserProfileController {

    private static final Logger log = LoggerFactory.getLogger(UserProfileController.class);
    private final UserRepository userRepository;

    public UserProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** 개인 정보수정 화면 */
    @GetMapping("/profile-edit")
    public String editUser(Model model, HttpSession session) {
        User sessionUser = (User) session.getAttribute("user");
        if (sessionUser == null) {
            // 개인 로그인으로 보내고, 돌아올 URL은 /profile-edit
            return "redirect:/login?redirectURL=/profile-edit";
        }

        // 세션 기준으로 최신 로드(안전)
        Optional<User> opt = userRepository.findById(sessionUser.getUserId());
        User user = opt.orElse(sessionUser);
        model.addAttribute("userEntity", user); // 필요 시 템플릿에서 사용
        return "profile-edit";
    }

    /** 개인 정보 업데이트 */
    @PostMapping("/user/profile/update")
    public String updateUser(@RequestParam String name,
                             @RequestParam(required = false) String newPassword,
                             // 이메일은 읽기전용이었으니 제외. 필요 시 파라미터 추가 가능
                             HttpSession session,
                             RedirectAttributes ra) {
        User sessionUser = (User) session.getAttribute("user");
        if (sessionUser == null) {
            ra.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/login?redirectURL=/profile-edit";
        }

        // 필수값
        if (name == null || name.isBlank()) {
            ra.addFlashAttribute("error", "이름을 입력해주세요.");
            return "redirect:/profile-edit";
        }

        User user = userRepository.findById(sessionUser.getUserId()).orElse(sessionUser);
        user.setName(name.trim());

        if (newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 6) {
                ra.addFlashAttribute("error", "새 비밀번호는 6자 이상이어야 합니다.");
                return "redirect:/profile-edit";
            }
            user.setPassword(PasswordUtil.encode(newPassword));
        }

        userRepository.save(user);

        // 세션 최신화
        session.setAttribute("user", user);
        session.setAttribute("LOGIN_USER", user); // 과거 호환

        ra.addFlashAttribute("success", "회원 정보가 저장되었습니다.");
        return "redirect:/profile-edit";
    }

    /** 개인 탈퇴 (소프트 삭제: deleted_at 찍고 로그아웃) */
    @PostMapping("/user/profile/delete")
    public String deleteUser(@RequestParam(required = false) String confirmPassword,
                             HttpSession session,
                             RedirectAttributes ra) {
        User sessionUser = (User) session.getAttribute("user");
        if (sessionUser == null) {
            ra.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/login?redirectURL=/mypage";
        }

        try {
            // (선택) 비번 재확인 – 폼에서 비밀번호를 받았을 때만 체크
            if (confirmPassword != null && !confirmPassword.isBlank()) {
                if (!PasswordUtil.matches(confirmPassword, sessionUser.getPassword())) {
                    ra.addFlashAttribute("error", "비밀번호가 일치하지 않습니다.");
                    return "redirect:/profile-edit";
                }
            }

            User user = userRepository.findById(sessionUser.getUserId()).orElse(sessionUser);
            user.setDeletedAt(LocalDateTime.now());
            userRepository.save(user);

            try { session.invalidate(); } catch (Exception ignored) {}
            ra.addFlashAttribute("success", "탈퇴가 완료되었습니다.");
            return "redirect:/";
        } catch (Exception e) {
            log.error("개인회원 탈퇴 실패", e);
            ra.addFlashAttribute("error", "탈퇴 처리 중 오류가 발생했습니다.");
            return "redirect:/profile-edit";
        }
    }
}
