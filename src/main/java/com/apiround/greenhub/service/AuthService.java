package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;

public interface AuthService {
    User register(User user);                 // 회원가입
    User login(String loginId, String password); // 로그인
}
