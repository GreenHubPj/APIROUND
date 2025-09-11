package com.apiround.greenhub.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class PasswordUtil {

    public static String encode(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }

    // 64자리 소문자 hex면 SHA-256 해시라고 간주
    public static boolean looksHashed(String value) {
        return value != null && value.matches("^[0-9a-f]{64}$");
    }

    public static boolean matches(String raw, String stored) {
        if (stored == null) return false;
        if (looksHashed(stored)) {
            return encode(raw).equals(stored);
        } else {
            // 혹시 과거 평문 저장된 데이터 대비
            return raw.equals(stored);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}