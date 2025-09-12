package com.apiround.greenhub.controller.mypage;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MyPageController {

    @GetMapping("/mypage")
    public String mypage() {
        // templates/mypage.html 을 렌더링
        return "mypage";
    }
}
