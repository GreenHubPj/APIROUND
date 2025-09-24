package com.apiround.greenhub.config;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String[] PROTECTED_PATHS = {
            "/mypage/**",
            "/order/**",
            "/orders/**",
            "/cart/**",
            "/profile/**",
            "/profile-edit",
            "/profile-edit-company",
            "/mypage-company",
            "/user/profile/**",
            "/company/profile/**",
            "/seller/**"
    };

    private static final String[] STATIC_OPEN_PATHS = {
            "/css/**","/js/**","/images/**","/videos/**","/webjars/**","/favicon.ico","/uploads/**","/upload-dir/**"
    };

    /** 공개 경로(뷰 + 공개 API + OAuth) */
    private static final String[] PUBLIC_PATHS = {
            "/","/main","/popular","/seasonal","/region","/recipe","/event",
            "/login","/signup",
            "/company/login","/company/signup",
            "/auth/login","/auth/signup","/auth/signup-company",
            "/auth/email/**",
            "/auth/logout", "/logout", "/company/logout",
            "/api/public/**",
            "/api/account/**",
            "/api/random-recipe",
            "/api/related-products",
            "/api/product-prices/**",
            "/error",
            "/products/**",
            // ★ 소셜 로그인 공개 경로
            "/oauth/**"
    };

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginRequiredInterceptor())
                .addPathPatterns(PROTECTED_PATHS)
                .excludePathPatterns(PUBLIC_PATHS)
                .excludePathPatterns(STATIC_OPEN_PATHS);

        registry.addInterceptor(new CurrentPrincipalInjectInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns(STATIC_OPEN_PATHS);

        registry.addInterceptor(new ApiGuardInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns(STATIC_OPEN_PATHS)
                .excludePathPatterns("/api/products/*/thumbnail"); // 썸네일 API 제외
    }

    private static class LoginRequiredInterceptor implements HandlerInterceptor {
        private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String uri = request.getRequestURI();
            if (isStatic(uri) || isPublic(uri)) return true;

            HttpSession session = request.getSession(false);
            Object user = (session != null) ? session.getAttribute("user") : null;
            Object company = (session != null) ? session.getAttribute("company") : null;
            if (user != null || company != null) return true;

            // 미로그인
            if (isApiRequest(request)) {
                String query = request.getQueryString();
                String target = request.getRequestURI() + (query != null ? "?" + query : "");
                String loginUrl = "/login?redirectURL=" + URLEncoder.encode(target, StandardCharsets.UTF_8);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"login\":false,\"redirectUrl\":\"" + loginUrl + "\"}");
                return false;
            }

            String query = request.getQueryString();
            String target = request.getRequestURI() + (query != null ? "?" + query : "");
            String redirectURL = "/login?redirectURL=" + URLEncoder.encode(target, StandardCharsets.UTF_8);
            if (!SAFE_METHODS.contains(request.getMethod())) redirectURL = "/login";
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
            for (String p : PUBLIC_PATHS) if (match(uri, p)) return true;
            return false;
        }
        private boolean isStatic(String uri) {
            for (String p : STATIC_OPEN_PATHS) if (match(uri, p)) return true;
            return false;
        }
        private boolean match(String uri, String pattern) {
            if (pattern.endsWith("/**")) return uri.startsWith(pattern.substring(0, pattern.length() - 3));
            return uri.equals(pattern);
        }
    }

    private static class ApiGuardInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            final String uri = request.getRequestURI();
            final String method = request.getMethod();

            if (isStatic(uri)) return true;

            // 공개 GET API
            if ("GET".equalsIgnoreCase(method) && isPublicReviewGetApi(uri)) return true;
            if ("GET".equalsIgnoreCase(method) && "/api/random-recipe".equals(uri)) return true;
            if ("GET".equalsIgnoreCase(method) && uri.startsWith("/api/related-products")) return true;
            if ("GET".equalsIgnoreCase(method) && uri.startsWith("/api/product-prices/")) return true;

            // ✅ 상품 썸네일 이미지 API 공개
            if ("GET".equalsIgnoreCase(method) && uri.matches("/api/products/\\d+/thumbnail")) {
                return true;
            }

            HttpSession session = request.getSession(false);
            boolean authed = session != null && (session.getAttribute("user") != null || session.getAttribute("company") != null);
            if (authed) return true;

            String query = request.getQueryString();
            String target = request.getRequestURI() + (query != null ? "?" + query : "");
            String loginUrl = "/login?redirectURL=" + URLEncoder.encode(target, StandardCharsets.UTF_8);

            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"login\":false,\"redirectUrl\":\"" + loginUrl + "\"}");
            return false;
        }

        private boolean isPublicReviewGetApi(String uri) {
            if (!uri.startsWith("/api/products/")) return false;
            return uri.endsWith("/reviews") || uri.endsWith("/reviews/") || uri.endsWith("/reviews/summary");
        }

        private boolean isStatic(String uri) {
            for (String p : STATIC_OPEN_PATHS) if (match(uri, p)) return true;
            return false;
        }
        private boolean match(String uri, String pattern) {
            if (pattern.endsWith("/**")) return uri.startsWith(pattern.substring(0, pattern.length() - 3));
            return uri.equals(pattern);
        }
    }

    private static class CurrentPrincipalInjectInterceptor implements HandlerInterceptor {
        @Override
        public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView mav) {
            if (mav == null) return;
            String view = mav.getViewName();
            if (view != null && view.startsWith("redirect:")) return;

            HttpSession session = request.getSession(false);
            if (session == null) return;

            Object user = session.getAttribute("user");
            if (user == null) user = session.getAttribute("LOGIN_USER");
            if (user != null) mav.addObject("currentUser", user);

            Object company = session.getAttribute("company");
            if (company != null) mav.addObject("currentCompany", company);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/css/**").addResourceLocations("classpath:/static/css/");
        registry.addResourceHandler("/js/**").addResourceLocations("classpath:/static/js/");
        registry.addResourceHandler("/images/**").addResourceLocations("classpath:/static/images/");
        registry.addResourceHandler("/videos/**").addResourceLocations("classpath:/static/videos/");
        registry.addResourceHandler("/uploads/**").addResourceLocations("classpath:/static/uploads/");
        registry.addResourceHandler("/upload-dir/**").addResourceLocations("file:upload-dir/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:8000", "https://apiround.store") // 배포도 허용 시 추가
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
