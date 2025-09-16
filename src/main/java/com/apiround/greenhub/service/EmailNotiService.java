package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotiService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.mail.from:GreenHub <no-reply@local>}")
    private String fromAddress;

    public void sendNotification(String to, String subject, String message) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(fromAddress);
        mail.setTo(to);
        mail.setSubject(subject);
        mail.setText(message);

        mailSender.send(mail);
    }

    /**
     * SMS 동의한 사용자들에게 일괄 메일 발송
     */
    @Async
    public CompletableFuture<Integer> sendBulkNotification(String subject, String message) {
        List<User> smsConsentUsers = userRepository.findBySmsConsentTrueAndDeletedAtIsNull();
        
        int successCount = 0;
        int failCount = 0;

        log.info("SMS 동의 사용자 {}명에게 메일 발송 시작", smsConsentUsers.size());

        for (User user : smsConsentUsers) {
            try {
                String personalizedMessage = personalizeMessage(message, user);
                sendNotification(user.getEmail(), subject, personalizedMessage);
                successCount++;
                log.debug("메일 발송 성공: {}", user.getEmail());
            } catch (Exception e) {
                failCount++;
                log.error("메일 발송 실패: {} - {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("메일 발송 완료 - 성공: {}건, 실패: {}건", successCount, failCount);
        return CompletableFuture.completedFuture(successCount);
    }

    /**
     * SMS 동의한 사용자 목록 조회
     */
    public List<User> getSmsConsentUsers() {
        return userRepository.findBySmsConsentTrueAndDeletedAtIsNull();
    }

    /**
     * 개인화된 메시지 생성
     */
    private String personalizeMessage(String template, User user) {
        return template.replace("{name}", user.getName())
                      .replace("{email}", user.getEmail());
    }
}
