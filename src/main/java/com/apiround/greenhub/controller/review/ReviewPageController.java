// src/main/java/com/apiround/greenhub/controller/review/ReviewPageController.java
package com.apiround.greenhub.controller.review;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ReviewPageController {

    @GetMapping("/review")
    public String reviews(Model model, HttpServletRequest req) {
        Object currentUser = req.getSession().getAttribute("currentUser");
        model.addAttribute("currentUser", currentUser);
        return "review"; // templates/review.html
    }
}
