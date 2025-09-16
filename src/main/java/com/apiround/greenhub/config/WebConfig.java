package com.apiround.greenhub.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 로그인 필요(보호) 경로
    private static final String[] PROTECTED_PATHS = {
            "/mypage/**",
            "/order/**",
            "/cart/**",
            "/profile/**",
            "/profile-edit",
            "/profile-edit-company",
            "/mypage-company"
    };

    // 정적/공용 리소스
    private static final String[] STATIC_OPEN_PATHS = {
            "/css/**","/js/**","/images/**","/webjars/**","/favicon.ico","/uploads/**","/upload-dir/**"
    };

    // 인증 없이 접근 가능한 공개 경로 (+로그아웃/에러 포함)
    private static final String[] PUBLIC_PATHS = {
            "/","/main","/popular","/seasonal","/region","/recipe","/event",
            // 로그인/회원가입 화면
            "/login","/signup",
            "/company/login","/company/signup",
            // 로그인/로그아웃 처리
            "/auth/login","/auth/signup","/auth/signup-company",
            "/auth/email/**",
            "/auth/logout", "/logout", "/company/logout",
            // 공개 API
            "/api/public/**",
            // 에러 페이지
            "/error"
    };

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1) 로그인 필요한 경로 보호
        registry.addInterceptor(new LoginRequiredInterceptor())
                .addPathPatterns(PROTECTED_PATHS)
                .excludePathPatterns(PUBLIC_PATHS)
                .excludePathPatterns(STATIC_OPEN_PATHS);

        // 2) 세션 사용자/업체 정보를 모든 뷰 모델에 주입 (GlobalModelAttributes 대체)
        registry.addInterceptor(new CurrentPrincipalInjectInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns(STATIC_OPEN_PATHS);
    }

    /**
     * 비로그인 사용자가 보호 경로 접근 시:
     * - API/JSON 요청: 401
     * - 페이지 요청: /login?redirectURL=... 로 이동
     */
    private static class LoginRequiredInterceptor implements HandlerInterceptor {
        private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            // 공개/정적 경로는 통과 (혹시 별도 등록 누락 대비)
            String uri = request.getRequestURI();
            if (isStatic(uri) || isPublic(uri)) return true;

            HttpSession session = request.getSession(false);
            Object user = (session != null) ? session.getAttribute("user") : null;
            Object company = (session != null) ? session.getAttribute("company") : null;

            if (user != null || company != null) return true; // 로그인 상태 OK

            // API/JSON 요청이면 401
            if (isApiRequest(request)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"success\":false,\"message\":\"AUTH_REQUIRED\"}");
                return false;
            }

            // 페이지 요청이면 /login 으로 리다이렉트
            String query = request.getQueryString();
            String target = request.getRequestURI() + (query != null ? "?" + query : "");
            String redirectURL = "/login?redirectURL=" + URLEncoder.encode(target, StandardCharsets.UTF_8);

            // POST 같은 경우는 그냥 로그인 페이지 자체로
            if (!SAFE_METHODS.contains(request.getMethod())) {
                redirectURL = "/login";
            }

            response.sendRedirect(redirectURL);
            return false;
        }

        private boolean isApiRequest(HttpServletRequest req) {
            String uri = req.getRequestURI();
            if (uri.startsWith("/api/")) return true;

            String accept = req.getHeader("Accept");
            if (accept != null && accept.contains("application/json")) return true;

            String xhr = req.getHeader("X-Requested-With");
            return "XMLHttpRequest".equalsIgnoreCase(xhr);
        }

        private boolean isPublic(String uri) {
            for (String p : PUBLIC_PATHS) {
                if (match(uri, p)) return true;
            }
            return false;
        }

        private boolean isStatic(String uri) {
            for (String p : STATIC_OPEN_PATHS) {
                if (match(uri, p)) return true;
            }
            return false;
        }

        private boolean match(String uri, String pattern) {
            if (pattern.endsWith("/**")) {
                String base = pattern.substring(0, pattern.length() - 3);
                return uri.startsWith(base);
            }
            return uri.equals(pattern);
        }
    }

    /**
     * 세션의 user/company 를 모든 뷰에 currentUser/currentCompany 로 주입
     */
    private static class CurrentPrincipalInjectInterceptor implements HandlerInterceptor {
        @Override
        public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView mav) {
            if (mav == null) return;
            String view = mav.getViewName();
            if (view != null && view.startsWith("redirect:")) return;

            HttpSession session = request.getSession(false);
            if (session == null) return;

            Object user = session.getAttribute("user");
            if (user == null) user = session.getAttribute("LOGIN_USER"); // 과거 호환
            if (user != null) mav.addObject("currentUser", user);

            Object company = session.getAttribute("company");
            if (company != null) mav.addObject("currentCompany", company);
        }
    }

    // 정적 리소스 매핑
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/css/**").addResourceLocations("classpath:/static/css/");
        registry.addResourceHandler("/js/**").addResourceLocations("classpath:/static/js/");
        registry.addResourceHandler("/images/**").addResourceLocations("classpath:/static/images/");
        registry.addResourceHandler("/uploads/**").addResourceLocations("file:/var/greenhub/uploads/");
        registry.addResourceHandler("/upload-dir/**").addResourceLocations("file:upload-dir/");
    }
}
