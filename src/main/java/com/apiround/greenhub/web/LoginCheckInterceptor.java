// src/main/java/com/apiround/greenhub/web/LoginCheckInterceptor.java
package com.apiround.greenhub.web;

import com.apiround.greenhub.web.session.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class LoginCheckInterceptor implements HandlerInterceptor {

    public static final String SESSION_KEY = "SESSION_USER";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        LoginUser sessionUser = session == null ? null : (LoginUser) session.getAttribute(SESSION_KEY);
        Integer loginUserId   = session == null ? null : (Integer) session.getAttribute("loginUserId");
        Integer loginCompanyId= session == null ? null : (Integer) session.getAttribute("loginCompanyId");

        // ✅ 어떤 키로든 로그인되어 있으면 통과
        if (sessionUser != null || loginUserId != null || loginCompanyId != null) {
            return true;
        }

        // ✅ /api/** 는 JSON 401로만 응답 (리다이렉트 금지)
        String uri = request.getRequestURI();
        if (uri != null && uri.startsWith("/api/")) {
            write401Json(response, request);
            return false;
        }

        // 그 외: JSON 원하면 401 JSON, 아니면 로그인 페이지로 리다이렉트
        if (wantsJson(request)) {
            write401Json(response, request);
        } else {
            String redirect = "/login?redirect=" + urlEncode(getFullURL(request));
            response.sendRedirect(redirect);
        }
        return false;
    }

    private boolean wantsJson(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        String xhr    = request.getHeader("X-Requested-With");
        return (accept != null && accept.contains(MediaType.APPLICATION_JSON_VALUE))
                || "XMLHttpRequest".equalsIgnoreCase(xhr);
    }

    private void write401Json(HttpServletResponse response, HttpServletRequest request) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String redirectUrl = "/login?redirect=" + urlEncode(getFullURL(request));
        String body = "{\"login\":false,\"redirectUrl\":\"" + redirectUrl + "\"}";
        response.getWriter().write(body);
    }

    private String getFullURL(HttpServletRequest request) {
        String query = request.getQueryString();
        return request.getRequestURI() + (query != null ? "?" + query : "");
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
