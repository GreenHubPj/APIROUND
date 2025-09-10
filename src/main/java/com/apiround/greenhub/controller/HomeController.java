package com.apiround.greenhub.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() { return "main"; }

    @GetMapping("/main")
    public String main() { return "main"; }

    @GetMapping("/seasonal")
    public String seasonal() { return "seasonal"; }

    @GetMapping("/login")
    public String login() { return "login"; }

    @GetMapping("/signup")
    public String signup() { return "signup"; }

    // ⚠️ /region 제거
    // @GetMapping("/region") public String region() { return "region"; }

    @GetMapping("/popular")
    public String popular() { return "popular"; }

    // ⚠️ /region-detail 제거
    // @GetMapping("/region-detail")
    // public String regionDetail(@RequestParam(required = false) String id) { return "region-detail"; }

    @GetMapping("/find-id")
    public String findId() { return "find-id"; }

    @GetMapping("/find-password")
    public String findPassword() { return "find-password"; }

    @GetMapping("/mypage")
    public String mypage() { return "mypage"; }

    @GetMapping("/mypage-company")
    public String mypageCompany() { return "mypage_company"; }

    @GetMapping("/myrecipe")
    public String myrecipe() { return "myrecipe"; }

    @GetMapping("/myrecipe-detail")
    public String myrecipeDetail(@RequestParam(required = false) String id,
                                 @RequestParam(required = false) String name,
                                 @RequestParam(required = false) String mode) {
        return "myrecipe-detail";
    }

    @GetMapping("/newrecipe")
    public String newrecipe() { return "newrecipe"; }

    @GetMapping("/orderhistory")
    public String orderhistory() { return "orderhistory"; }

    @GetMapping("/shoppinglist")
    public String shoppinglist() { return "shoppinglist"; }

    @GetMapping("/orderdetails")
    public String orderdetails(@RequestParam(required = false) String id) { return "orderdetails"; }

    @GetMapping("/review")
    public String review() { return "review"; }

    @GetMapping("/review-write")
    public String reviewWrite() { return "review-write"; }

    @GetMapping("/event")
    public String event() { return "event"; }

    @GetMapping("/profile-edit")
    public String profileEdit() { return "profile-edit"; }

    @GetMapping("/profile-edit-company")
    public String profileEditCompany() { return "profile-edit-company"; }

    @GetMapping("/refund")
    public String refund() { return "refund"; }

    @GetMapping("/buying")
    public String buying() { return "buying"; }

    @GetMapping("/reviewlist")
    public String reviewlist() { return "reviewlist"; }

    @GetMapping("/item-management")
    public String itemManagement() { return "item-management"; }

    @GetMapping("/review-management")
    public String reviewManagement() { return "review-management"; }

    @GetMapping("/sellerDelivery")
    public String sellerDelivery() { return "sellerDelivery"; }

    @GetMapping("/customerOrder")
    public String customerOrder() { return "customerOrder"; }
}
