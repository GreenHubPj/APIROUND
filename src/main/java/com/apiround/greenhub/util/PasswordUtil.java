package com.apiround.greenhub.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class PasswordUtil {

    /** 평문을 SHA-256으로 해싱 */
    public static String encode(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }

    /** 주어진 문자열이 이미 SHA-256 해시 형태(64자리 소문자 hex)인지 검사 */
    public static boolean isEncoded(String value) {
        return value != null && value.matches("^[0-9a-f]{64}$");
    }

    /** looksHashed → isEncoded와 동일 의미 (호환성 위해 유지) */
    public static boolean looksHashed(String value) {
        return isEncoded(value);
    }

    /** 입력값과 저장된 해시값 비교 */
    public static boolean matches(String raw, String stored) {
        if (stored == null) return false;
        if (isEncoded(stored)) {
            return encode(raw).equals(stored);
        } else {
            // 과거 평문 저장된 데이터 대비
            return raw.equals(stored);
        }
    }

    /** 비밀번호 정책: 8자 이상, 영문/숫자/특수문자 각각 1개 이상 포함 */
    public static boolean isStrong(String raw) {
        if (raw == null) return false;
        String s = raw.trim();
        if (s.length() < 8) return false;
        boolean hasLetter  = s.matches(".*[A-Za-z].*");
        boolean hasDigit   = s.matches(".*\\d.*");
        boolean hasSpecial = s.matches(".*[~!@#$%^&*()_+\\-=`\\[\\]{}|;':\",.<>/?].*");
        return hasLetter && hasDigit && hasSpecial;
    }

    /** 정책 안내 메시지(단일 출처) */
    public static String policyMessage() {
        return "비밀번호는 8자 이상이며, 영문/숫자/특수문자를 각각 1자 이상 포함해야 합니다.";
    }

    /** 바이트 배열 → 16진수 문자열 변환 */
    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
