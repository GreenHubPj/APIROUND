package com.apiround.greenhub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home() {
        return "main";
    }
    
    @GetMapping("/index")
    public String index() {
        return "main";
    }
    
    @GetMapping("/seasonal")
    public String seasonal() {
        return "seasonal";
    }
}
