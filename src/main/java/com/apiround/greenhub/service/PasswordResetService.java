package com.apiround.greenhub.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    public enum AccountType { PERSONAL, COMPANY }

    public static class ResetTicket {
        public AccountType type;
        public Integer userId;     // PERSONAL이면 사용
        public Integer companyId;  // COMPANY이면 사용
        public LocalDateTime expiresAt;
    }

    // token -> ticket
    private final Map<String, ResetTicket> store = new ConcurrentHashMap<>();

    public String issueForUser(Integer userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        ResetTicket t = new ResetTicket();
        t.type = AccountType.PERSONAL;
        t.userId = userId;
        t.expiresAt = LocalDateTime.now().plusMinutes(15);
        store.put(token, t);
        return token;
    }

    public String issueForCompany(Integer companyId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        ResetTicket t = new ResetTicket();
        t.type = AccountType.COMPANY;
        t.companyId = companyId;
        t.expiresAt = LocalDateTime.now().plusMinutes(15);
        store.put(token, t);
        return token;
    }

    public ResetTicket consume(String token) {
        if (token == null) return null;
        ResetTicket t = store.remove(token);
        if (t == null) return null;
        if (LocalDateTime.now().isAfter(t.expiresAt)) return null;
        return t;
    }

    public void revoke(String token) {
        if (token != null) store.remove(token);
    }
}
