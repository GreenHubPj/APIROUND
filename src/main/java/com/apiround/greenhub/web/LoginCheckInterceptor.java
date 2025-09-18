package com.apiround.greenhub.web;

import com.apiround.greenhub.web.session.LoginUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class LoginCheckInterceptor implements HandlerInterceptor {

    public static final String SESSION_KEY = "SESSION_USER";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        LoginUser loginUser = (LoginUser) (request.getSession(false) != null
                ? request.getSession(false).getAttribute(SESSION_KEY)
                : null);

        if (loginUser != null) {
            return true; // 로그인됨 → 통과
        }

        // 미로그인 처리
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
        return accept != null && accept.contains(MediaType.APPLICATION_JSON_VALUE);
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
