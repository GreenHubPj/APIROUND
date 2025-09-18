package com.apiround.greenhub.web.session;

import java.io.Serializable;

public class LoginUser implements Serializable {
    private final Integer userId;
    private final String name;
    private final String loginId;

    public LoginUser(Integer userId, String name, String loginId) {
        this.userId = userId;
        this.name = name;
        this.loginId = loginId;
    }

    public Integer getUserId() { return userId; }
    public String getName() { return name; }
    public String getLoginId() { return loginId; }
}
