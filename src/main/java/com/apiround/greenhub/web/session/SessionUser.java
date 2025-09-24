package com.apiround.greenhub.web.session;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** 세션에 넣어서 쓰는 최소 정보(Thymeleaf에서 currentUser.name 등으로 사용) */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionUser {
    private Integer userId;   // 기존 코드 호환: Integer
    private String  name;
    private String  email;
    private String  provider; // kakao / google
    private String  providerUserId;
    private String  pictureUrl;
}
