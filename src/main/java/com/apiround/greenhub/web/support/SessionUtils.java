package com.apiround.greenhub.web.support;

import jakarta.servlet.http.HttpSession;
import org.springframework.jdbc.core.JdbcTemplate;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

public final class SessionUtils {
    private SessionUtils() {}

    // 세션/요청 파라미터/DB를 총동원해서 companyId를 해석
    public static Integer resolveCompanyId(Integer companyIdParam, HttpSession session, JdbcTemplate jdbc) {
        // 1) 쿼리스트링 우선
        if (companyIdParam != null) {
            cacheCompanyId(session, companyIdParam);
            return companyIdParam;
        }

        // 2) 세션 캐시 (여러 키 탐색)
        Integer fromSession = getCompanyIdFromSession(session);
        if (fromSession != null) return fromSession;

        // 3) 세션의 로그인 유저로부터 userId 추출(여러 키/게터/필드 지원)
        Object loginUser = getAny(session,
                "loginUser","LOGIN_USER","user","USER","authUser","AUTH_USER","login","LOGIN");
        Integer userId = extractInt(loginUser, "userId","id","user_id","memberId","member_id");
        if (userId == null) return null;

        // 4) DB에서 companyId 조회 (예: company.user_id = ?)
        try {
            Integer cid = jdbc.queryForObject(
                    "SELECT company_id FROM company WHERE user_id = ? LIMIT 1",
                    Integer.class, userId
            );
            if (cid != null) {
                cacheCompanyId(session, cid);
                return cid;
            }
        } catch (Exception ignored) {}

        // 스키마가 다르면 여기서 필요한 쿼리를 추가해서 더 시도 가능
        // 예: owner_user_id, seller_user_id 등의 컬럼명
        try {
            Integer cid = jdbc.queryForObject(
                    "SELECT company_id FROM company WHERE owner_user_id = ? LIMIT 1",
                    Integer.class, userId
            );
            if (cid != null) {
                cacheCompanyId(session, cid);
                return cid;
            }
        } catch (Exception ignored) {}

        return null;
    }

    public static Integer getCompanyIdFromSession(HttpSession session) {
        if (session == null) return null;
        Object v = getAny(session,
                "COMPANY_ID","companyId","loginCompanyId","sellerCompanyId","company_id");
        return toInt(v);
    }

    public static void cacheCompanyId(HttpSession session, Integer companyId) {
        if (session != null && companyId != null) {
            session.setAttribute("COMPANY_ID", companyId);
            // 호환용 키도 같이 넣어줌
            session.setAttribute("companyId", companyId);
        }
    }

    // ─────────────── helpers ───────────────
    private static Object getAny(HttpSession s, String... keys) {
        if (s == null) return null;
        for (String k : keys) {
            Object v = s.getAttribute(k);
            if (v != null) return v;
        }
        return null;
    }

    private static Integer extractInt(Object obj, String... names) {
        Integer v = tryGetByGetter(obj, names);
        if (v != null) return v;
        return tryGetByField(obj, names);
    }

    private static Integer tryGetByGetter(Object obj, String... names) {
        if (obj == null) return null;
        Class<?> c = obj.getClass();
        List<String> prefixes = Arrays.asList("get", "is");
        for (String n : names) {
            String base = upperFirst(n.replaceAll("_", ""));
            for (String p : prefixes) {
                try {
                    Method m = c.getMethod(p + base);
                    Object val = m.invoke(obj);
                    Integer i = toInt(val);
                    if (i != null) return i;
                } catch (Exception ignored) {}
            }
        }
        return null;
    }

    private static Integer tryGetByField(Object obj, String... names) {
        if (obj == null) return null;
        Class<?> c = obj.getClass();
        for (String n : names) {
            try {
                Field f = c.getDeclaredField(n);
                f.setAccessible(true);
                Object val = f.get(obj);
                Integer i = toInt(val);
                if (i != null) return i;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private static Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Long l) return l.intValue();
        if (val instanceof String s && !s.isBlank()) {
            try { return Integer.parseInt(s.trim()); } catch (Exception ignored) {}
        }
        return null;
    }

    private static String upperFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
