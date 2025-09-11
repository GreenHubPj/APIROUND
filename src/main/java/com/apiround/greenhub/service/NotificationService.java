package com.apiround.greenhub.service;

import com.apiround.greenhub.dto.NotificationDto;
import com.apiround.greenhub.entity.Notification;
import com.apiround.greenhub.repository.NotificationRepository;
import com.apiround.greenhub.repository.UserNotificationPreferencesRepository;
import com.apiround.greenhub.repository.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserNotificationRepository userNotificationRepository;
    private final UserNotificationPreferencesRepository preferencesRepository;

    // 예: 특정 유저 알림 리스트 조회
    public List<NotificationDto> getNotificationsByUserId(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        // 엔티티 → DTO 변환 (수동 or 매퍼 라이브러리 이용)
        return notifications.stream()
                .map(this::toNotificationDto)
                .collect(Collectors.toList());
    }

    // DTO 변환 메서드 예시
    private NotificationDto toNotificationDto(Notification entity) {
        return NotificationDto.builder()
                .notificationId(entity.getNotificationId())
                .companyId(entity.getCompanyId())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .targetType(entity.getTargetType().name())
                .channel(entity.getChannel().name())
                .status(entity.getStatus().name())
                .scheduledAt(entity.getScheduledAt())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .sendType(entity.getSendType().name())
                .build();
    }

}
