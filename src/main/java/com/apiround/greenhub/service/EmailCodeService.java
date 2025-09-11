package com.apiround.greenhub.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailCodeService {

    private static final Logger log = LoggerFactory.getLogger(EmailCodeService.class);

    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    @Value("${app.mail.from:GreenHub <no-reply@local>}")
    private String fromAddress;

    private static class Entry {
        String code;
        LocalDateTime expiresAt;
        boolean verified;
    }

    // key: email
    private final Map<String, Entry> store = new ConcurrentHashMap<>();

    public EmailCodeService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** 새 코드 생성 + 메일 발송 */
    public void sendCode(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));

        Entry e = new Entry();
        e.code = code;
        e.expiresAt = LocalDateTime.now().plusMinutes(5);
        e.verified = false;
        store.put(email, e);

        sendMail(email, code);
        log.info("[이메일 인증] {} 로 인증코드 전송 완료", email);
    }

    /** 과거 코드 호환: 컨트롤러가 send(...)를 부를 수도 있어요 */
    public void send(String email) {
        sendCode(email);
    }

    /** 코드 검증 */
    public boolean verifyCode(String email, String code) {
        Entry e = store.get(email);
        if (e == null) return false;
        if (LocalDateTime.now().isAfter(e.expiresAt)) {
            store.remove(email);
            return false;
        }
        if (!e.code.equals(code)) return false;
        e.verified = true;
        return true;
    }

    /** 과거 코드 호환: 컨트롤러가 verify(...)를 부를 수도 있어요 */
    public boolean verify(String email, String code) {
        return verifyCode(email, code);
    }

    public boolean isVerified(String email) {
        Entry e = store.get(email);
        return e != null && e.verified && LocalDateTime.now().isBefore(e.expiresAt);
    }

    public void clear(String email) {
        store.remove(email);
    }

    private void sendMail(String to, String code) {
        String subject = "GreenHub 이메일 인증코드";
        String text =
                "안녕하세요, GreenHub 입니다.\n\n" +
                        "아래 인증번호를 5분 내에 입력해 주세요.\n\n" +
                        "인증번호: " + code + "\n\n" +
                        "만약 본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.\n" +
                        "- GreenHub 드림";

        SimpleMailMessage message = new SimpleMailMessage();
        // setFrom 에는 주소 형태가 안전합니다. (표시명+주소를 문자열로 넣는 것도 대부분 허용)
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        mailSender.send(message);
    }
}
