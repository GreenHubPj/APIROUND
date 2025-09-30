package com.apiround.greenhub.controller.auth;

import com.apiround.greenhub.dto.SessionUser;
import com.apiround.greenhub.service.auth.SocialLoginService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Controller
@RequestMapping("/oauth")
@RequiredArgsConstructor
@Slf4j
public class SocialLoginController {

    private final SocialLoginService social;

    @Value("${oauth.kakao.client-id:}")      private String kakaoClientId;
    @Value("${oauth.kakao.client-secret:}")  private String kakaoClientSecret;
    @Value("${oauth.kakao.redirect-uri:}")   private String kakaoRedirectUri;
    @Value("${oauth.kakao.scope:}")          private String kakaoScope;

    @Value("${oauth.google.client-id:}")     private String googleClientId;
    @Value("${oauth.google.client-secret:}") private String googleClientSecret;
    @Value("${oauth.google.redirect-uri:}")  private String googleRedirectUri;
    @Value("${oauth.google.scope:}")         private String googleScope;

    private static final String REDIR_KEY = "OAUTH_REDIRECT_URL";

    // ===== Kakao =====
    @GetMapping("/kakao/start")
    public void kakaoStart(@RequestParam(required = false) String redirectURL,
                           HttpServletRequest req,
                           HttpServletResponse resp) throws Exception {
        if (StringUtils.hasText(redirectURL)) {
            req.getSession(true).setAttribute(REDIR_KEY, redirectURL);
        }
        if (!StringUtils.hasText(kakaoClientId) || !StringUtils.hasText(kakaoRedirectUri)) {
            resp.sendRedirect(buildLoginErrorUrl("카카오 설정이 없습니다(관리자 확인 필요)"));
            return;
        }
        String url = social.buildKakaoAuthorizeUrl(kakaoClientId, kakaoRedirectUri, kakaoScope, null);
        resp.sendRedirect(url);
    }

    @GetMapping("/kakao/callback")
    public String kakaoCallback(@RequestParam(required = false) String code,
                                @RequestParam(required = false) String error,
                                HttpServletRequest req) {
        if (!StringUtils.hasText(code) || StringUtils.hasText(error)) {
            return redirectWithError("카카오 로그인 실패");
        }
        try {
            SessionUser u = social.handleKakaoCallback(code, kakaoClientId, kakaoClientSecret, kakaoRedirectUri);
            doSessionLogin(req.getSession(true), u);
            return "redirect:" + popRedirect(req.getSession(), "/");
        } catch (Exception e) {
            log.warn("Kakao login failed", e);
            return redirectWithError("카카오 연동 실패");
        }
    }

    // ===== Google =====
    @GetMapping("/google/start")
    public void googleStart(@RequestParam(required = false) String redirectURL,
                            HttpServletRequest req,
                            HttpServletResponse resp) throws Exception {
        if (StringUtils.hasText(redirectURL)) {
            req.getSession(true).setAttribute(REDIR_KEY, redirectURL);
        }
        if (!StringUtils.hasText(googleClientId) || !StringUtils.hasText(googleRedirectUri)) {
            resp.sendRedirect(buildLoginErrorUrl("구글 설정이 없습니다(관리자 확인 필요)"));
            return;
        }
        String url = social.buildGoogleAuthorizeUrl(googleClientId, googleRedirectUri, googleScope, null);
        resp.sendRedirect(url);
    }

    @GetMapping("/google/callback")
    public String googleCallback(@RequestParam(required = false) String code,
                                 @RequestParam(required = false) String error,
                                 HttpServletRequest req) {
        if (!StringUtils.hasText(code) || StringUtils.hasText(error)) {
            return redirectWithError("구글 로그인 실패");
        }
        try {
            SessionUser u = social.handleGoogleCallback(code, googleClientId, googleClientSecret, googleRedirectUri);
            doSessionLogin(req.getSession(true), u);
            return "redirect:" + popRedirect(req.getSession(), "/");
        } catch (Exception e) {
            log.warn("Google login failed", e);
            return redirectWithError("구글 연동 실패");
        }
    }

    // ===== 공통 =====
    private void doSessionLogin(HttpSession session, SessionUser u) {
        session.setAttribute("user", u);
        session.setAttribute("loginUserId", u.getUserId());
    }

    private String popRedirect(HttpSession session, String def) {
        Object v = session.getAttribute(REDIR_KEY);
        session.removeAttribute(REDIR_KEY);
        if (v instanceof String s && StringUtils.hasText(s)) return s;
        return def;
    }

    private String redirectWithError(String msg) {
        String enc = URLEncoder.encode(msg, StandardCharsets.UTF_8);
        return "redirect:/login?error=" + enc;
    }

    private String buildLoginErrorUrl(String msg) {
        String enc = URLEncoder.encode(msg, StandardCharsets.UTF_8);
        return "/login?error=" + enc;
    }
}
