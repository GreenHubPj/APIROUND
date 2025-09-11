package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;

public interface AuthService {
    User signup(User user);
    User login(String loginId, String rawPassword);
}
