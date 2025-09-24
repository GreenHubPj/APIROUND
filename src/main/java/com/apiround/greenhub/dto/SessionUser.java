package com.apiround.greenhub.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 세션에 넣어 쓰는 가벼운 로그인 사용자 정보 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionUser {
    private String name;
    private String email;
    private String provider;    // "kakao" | "google"
    private String providerId;  // 카카오 id, 구글 sub 등
    private Integer userId;     // (선택) DB와 연결하면 세팅
}
