package com.apiround.greenhub.service.auth;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.apiround.greenhub.dto.SessionUser;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SocialLoginService {

    private static final String KAKAO_AUTHORIZE = "https://kauth.kakao.com/oauth/authorize";
    private static final String KAKAO_TOKEN     = "https://kauth.kakao.com/oauth/token";
    private static final String KAKAO_ME        = "https://kapi.kakao.com/v2/user/me";

    private static final String GOOGLE_AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN     = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO  = "https://openidconnect.googleapis.com/v1/userinfo";

    private final RestTemplate http;

    public SocialLoginService() {
        // 타임아웃 세팅 (연결 5초, 읽기 10초)
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(5000);
        f.setReadTimeout(10000);
        this.http = new RestTemplate(f);
    }

    // ===== Kakao =====
    public String buildKakaoAuthorizeUrl(String clientId, String redirectUri, String scopeStr, String state) {
        List<String> scopes = normalizeScopes(scopeStr); // 공백/콤마 허용, 중복 제거
        UriComponentsBuilder b = UriComponentsBuilder
                .fromHttpUrl(KAKAO_AUTHORIZE)
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri);

        if (!scopes.isEmpty()) {
            // 카카오는 공백으로 합쳐 1개의 scope 파라미터로 전달
            b.queryParam("scope", String.join(" ", scopes));
        }
        if (state != null && !state.isBlank()) b.queryParam("state", state);

        // ★ 마지막에 인코딩 (공백 → %20 자동 처리)
        return b.encode(StandardCharsets.UTF_8).toUriString();
    }

    public SessionUser handleKakaoCallback(String code, String clientId, String clientSecret, String redirectUri) throws Exception {
        // 토큰 교환
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }
        form.add("redirect_uri", redirectUri);
        form.add("code", code);

        Map<String, Object> token = postForm(KAKAO_TOKEN, form);
        String accessToken = (String) token.get("access_token");

        // 사용자 정보
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<Map<String, Object>> r = http.exchange(
                KAKAO_ME,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                cast()
        );

        Map<String, Object> body = r.getBody();
        if (body == null) throw new IllegalStateException("kakao me empty");

        String id = String.valueOf(body.get("id"));

        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoAccount = (Map<String, Object>) body.get("kakao_account");
        String email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = kakaoAccount != null ? (Map<String, Object>) kakaoAccount.get("profile") : null;
        String nickname = profile != null ? (String) profile.get("nickname") : null;

        if (nickname == null || nickname.isBlank()) nickname = "KakaoUser-" + id;

        return new SessionUser(
                nickname,
                email,
                "kakao",
                id,
                null // TODO: DB 매핑 시 userId 세팅
        );
    }

    // ===== Google =====
    public String buildGoogleAuthorizeUrl(String clientId, String redirectUri, String scopeStr, String state) {
        List<String> scopes = normalizeScopes(scopeStr);
        UriComponentsBuilder b = UriComponentsBuilder
                .fromHttpUrl(GOOGLE_AUTHORIZE)
                .queryParam("response_type", "code")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                // 필요 시 refresh token 얻고 싶으면 "offline" 로 변경 + prompt=consent 추가
                .queryParam("access_type", "online")
                .queryParam("include_granted_scopes", "true");

        if (!scopes.isEmpty()) {
            // 구글도 공백으로 이어 1개의 scope 파라미터로 전달
            b.queryParam("scope", String.join(" ", scopes));
        }
        if (state != null && !state.isBlank()) b.queryParam("state", state);
        // 필요 시: b.queryParam("prompt", "consent");

        return b.encode(StandardCharsets.UTF_8).toUriString();
    }

    public SessionUser handleGoogleCallback(String code, String clientId, String clientSecret, String redirectUri) throws Exception {
        // 토큰 교환
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("code", code);

        Map<String, Object> token = postForm(GOOGLE_TOKEN, form);
        String accessToken = (String) token.get("access_token");

        // 사용자 정보 (OpenID UserInfo)
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<Map<String, Object>> r = http.exchange(
                GOOGLE_USERINFO,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                cast()
        );

        Map<String, Object> body = r.getBody();
        if (body == null) throw new IllegalStateException("google userinfo empty");

        String sub   = (String) body.get("sub");
        String email = (String) body.get("email");
        String name  = (String) body.get("name");
        if (name == null || name.isBlank()) name = "GoogleUser-" + (sub != null ? sub : "unknown");

        return new SessionUser(
                name,
                email,
                "google",
                sub,
                null // TODO: DB 매핑 시 userId 세팅
        );
    }

    // ===== 공통 유틸 =====
    private Map<String, Object> postForm(String url, MultiValueMap<String, String> form) throws Exception {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        h.setAccept(List.of(MediaType.APPLICATION_JSON));
        ResponseEntity<Map<String, Object>> r;
        try {
            r = http.exchange(url, HttpMethod.POST, new HttpEntity<>(form, h), cast());
        } catch (RestClientException e) {
            log.warn("POST {} failed: {}", url, e.toString());
            throw e;
        }
        if (!r.getStatusCode().is2xxSuccessful() || r.getBody() == null) {
            throw new IllegalStateException("Token endpoint failed: " + r.getStatusCode());
        }
        return r.getBody();
    }

    private List<String> normalizeScopes(String scopeStr) {
        if (scopeStr == null || scopeStr.isBlank()) return List.of();
        // 스페이스/콤마 모두 허용 → 중복 제거, 원래 순서 보존
        String[] parts = scopeStr.replace(',', ' ').trim().split("\\s+");
        Set<String> set = new LinkedHashSet<>();
        for (String p : parts) {
            if (!p.isBlank()) set.add(p);
        }
        return new ArrayList<>(set);
    }

    @SuppressWarnings("unchecked")
    private static Class<Map<String, Object>> cast() {
        return (Class<Map<String, Object>>) (Class<?>) Map.class;
    }
}
