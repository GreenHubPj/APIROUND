package com.apiround.greenhub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home() {
        return "main";
    }
    
    @GetMapping("/main")
    public String main() {
        return "main";
    }
    
    @GetMapping("/seasonal")
    public String seasonal() {
        return "seasonal";
    }
    
    @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    @GetMapping("/signup")
    public String signup() {
        return "signup";
    }

    @GetMapping("/region")
    public String region() {
        return "region";
    }

    @GetMapping("/popular")
    public String popular() {
        return "popular";
    }

    @GetMapping("/recipe")
    public String recipe() {
        return "recipe";
    }

    @GetMapping("/recipe-detail")
    public String recipeDetail() {
        return "recipe-detail";
    }

    @GetMapping("/find-id")
    public String findId() {
        return "find-id";
    }

    @GetMapping("/find-password")
    public String findPassword() {
        return "find-password";
    }

    @GetMapping("/mypage")
    public String mypage() {
        return "mypage";
    }

    @GetMapping("/mypage-company")
    public String mypageCompany() {
        return "mypage_company";
    }

    @GetMapping("/recipe-detail")
    public String recipeDetail() {
        return "recipe-detail";
    }

    @GetMapping("/shoppinglist")
    public String shoppinglist() {
        return "shoppinglist";
    }

    @GetMapping("/event")
    public String event() {
        return "event";
    }

    @GetMapping("/profile-edit")
    public String profileEdit() {
        return "profile-edit";
    }

    @GetMapping("/shoppinglist")
    public String shoppinglist() {
        return "shoppinglist";
    }
}
