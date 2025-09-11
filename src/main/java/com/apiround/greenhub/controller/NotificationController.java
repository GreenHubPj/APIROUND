package com.apiround.greenhub.controller;

import com.apiround.greenhub.dto.NotificationDto;
import com.apiround.greenhub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@RestController
public class NotificationController {
    private final NotificationService notificationService;


    @GetMapping("/user/{userId}/view")
    public String viewUserNotifications(@PathVariable Long userId, Model model) {
        List<NotificationDto> notifications = notificationService.getNotificationsByUserId(userId);
        model.addAttribute("notifications", notifications);
        return "notifications"; // src/main/resources/templates/notifications.html
    }

}
