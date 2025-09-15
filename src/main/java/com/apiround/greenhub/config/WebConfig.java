package com.apiround.greenhub.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1) 로그인 필요 페이지 보호
        registry.addInterceptor(new LoginRequiredInterceptor())
                .addPathPatterns(
                        "/mypage/**",
                        "/order/**",
                        "/cart/**",
                        "/profile/**",
                        "/profile-edit",
                        "/profile-edit-company",
                        "/mypage-company"            // 업체 마이페이지도 보호
                )
                .excludePathPatterns(
                        "/login", "/signup",
                        "/css/**","/js/**","/images/**","/webjars/**","/favicon.ico","/uploads/**"
                );

        // 2) 세션 사용자/업체 → 모델 주입
        registry.addInterceptor(new CurrentPrincipalInjectInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns("/css/**","/js/**","/images/**","/webjars/**","/favicon.ico","/uploads/**");
    }

    // 비로그인 → 로그인 페이지로
    private static class LoginRequiredInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            HttpSession session = request.getSession(false);
            Object user = (session != null) ? session.getAttribute("user") : null;
            Object company = (session != null) ? session.getAttribute("company") : null;

            if (user == null && company == null) {
                String q = request.getQueryString();
                String target = request.getRequestURI() + (q != null ? "?" + q : "");
                String redirect = "/login?redirectURL=" + java.net.URLEncoder.encode(target, java.nio.charset.StandardCharsets.UTF_8);
                response.sendRedirect(redirect);
                return false;
            }
            return true;
        }
    }

    // 세션의 'user' / 'company' (과거 'LOGIN_USER') → 모델
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
        registry.addResourceHandler("/uploads/**").addResourceLocations("file:/var/greenhub/uploads/"); // 환경에 맞게
    }
}
