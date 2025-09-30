package com.apiround.greenhub.service.review;

import com.apiround.greenhub.config.ReviewScopeProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewManagementQueryService {

    private final JdbcTemplate jdbc;
    private final ReviewScopeProperties scopeProps;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private volatile Scope cachedScope;
    private volatile NameSource cachedNameSource;

    // ───────────────────────── 목록 조회 ─────────────────────────
    public com.apiround.greenhub.dto.review.PageResponse<com.apiround.greenhub.dto.review.ReviewRowResponse> findReviewPage(
            Integer companyId,
            String keyword,
            String type,
            Integer rating,
            String status,
            String photo,
            String dateRange,
            String start,
            String end,
            int page,
            int size,
            String sort
    ) {
        if (companyId == null) {
            return new com.apiround.greenhub.dto.review.PageResponse<>(List.of(), 0, 1);
        }

        Scope scope = resolveScope();
        if (scope == null) {
            log.error("[ReviewMgmt] 회사 스키마 경로를 찾지 못해 빈 목록을 반환합니다. 프로퍼티 reviews.scope.* 설정을 확인하세요.");
            return new com.apiround.greenhub.dto.review.PageResponse<>(List.of(), 0, 1);
        }
        NameSource nameSrc = resolveNameSrcSafe();

        final String from = buildFrom(scope, nameSrc);
        StringBuilder where = new StringBuilder(" WHERE ").append(scope.companyPredicate).append(" ");
        List<Object> args = new ArrayList<>(List.of(companyId));

        if (!"삭제".equals(status)) where.append(" AND (pr.is_deleted IS NULL OR pr.is_deleted = 0) ");
        else where.append(" AND pr.is_deleted = 1 ");

        if (rating != null) {
            where.append(" AND pr.rating >= ? ");
            args.add(rating);
        }

        if (StringUtils.hasText(keyword)) {
            switch (type == null ? "content" : type) {
                case "productName" -> {
                    if (nameSrc != null && nameSrc.hasNameColumn) {
                        where.append(" AND ").append(nameSrc.alias).append(".").append(nameSrc.nameColumn).append(" LIKE ? ");
                        args.add("%" + keyword + "%");
                    }
                }
                case "author" -> {
                    where.append(" AND CAST(pr.user_id AS CHAR) LIKE ? ");
                    args.add("%" + keyword + "%");
                }
                case "orderNumber" -> where.append(" AND 1=1 ");
                default -> {
                    where.append(" AND pr.content LIKE ? ");
                    args.add("%" + keyword + "%");
                }
            }
        }

        if (StringUtils.hasText(start)) { where.append(" AND pr.created_at >= ? "); args.add(start + " 00:00:00"); }
        if (StringUtils.hasText(end))   { where.append(" AND pr.created_at <= ? "); args.add(end   + " 23:59:59"); }

        final String orderBy = resolveSort(sort);

        String countSql = "SELECT COUNT(*) " + from + where;
        long total = Optional.ofNullable(jdbc.queryForObject(countSql, Long.class, args.toArray())).orElse(0L);

        int limit = Math.max(size, 1);
        int offset = Math.max(page, 0) * limit;

        String listSql =
                "SELECT pr.review_id, pr.created_at, pr.product_id, pr.user_id, pr.rating, pr.content, pr.is_deleted"
                        + (nameSrc != null && nameSrc.hasNameColumn
                        ? ("," + nameSrc.alias + "." + nameSrc.nameColumn + " AS product_name")
                        : "")
                        + from + where + " " + orderBy + " LIMIT ? OFFSET ?";

        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(limit);
        listArgs.add(offset);

        List<com.apiround.greenhub.dto.review.ReviewRowResponse> rows = jdbc.query(
                listSql,
                (rs, i) -> mapRow(rs, nameSrc != null && nameSrc.hasNameColumn),
                listArgs.toArray()
        );

        int totalPages = (int) Math.ceil((double) total / (double) limit);
        return new com.apiround.greenhub.dto.review.PageResponse<>(rows, total, Math.max(totalPages, 1));
    }

    // ───────────────────────── 상세 조회 ─────────────────────────
    public com.apiround.greenhub.dto.review.ReviewDetailResponse findReviewDetail(Integer companyId, Integer reviewId) {
        if (companyId == null || reviewId == null) return null;

        Scope scope = resolveScope();
        if (scope == null) {
            log.error("[ReviewMgmt] 회사 스키마 경로를 찾지 못해 상세 조회를 건너뜁니다.");
            return null;
        }
        NameSource nameSrc = resolveNameSrcSafe();

        final String from = buildFrom(scope, nameSrc);
        String sql =
                "SELECT pr.review_id, pr.created_at, pr.product_id, pr.user_id, pr.rating, pr.content, pr.is_deleted"
                        + (nameSrc != null && nameSrc.hasNameColumn
                        ? ("," + nameSrc.alias + "." + nameSrc.nameColumn + " AS product_name")
                        : "")
                        + from + " WHERE " + scope.companyPredicate + " AND pr.review_id = ? LIMIT 1";

        List<com.apiround.greenhub.dto.review.ReviewDetailResponse> list = jdbc.query(
                sql,
                (rs, i) -> {
                    String status = (rs.getObject("is_deleted") != null && rs.getInt("is_deleted") == 1) ? "삭제" : "게시";
                    String productName = (nameSrc != null && nameSrc.hasNameColumn) ? nvl(rs.getString("product_name"), "-") : "-";
                    return new com.apiround.greenhub.dto.review.ReviewDetailResponse(
                            rs.getInt("review_id"),
                            tryFormat(rs.getTimestamp("created_at")),
                            null, // ipAddress
                            null, // userAgent
                            null, // orderNumber
                            productName,
                            "사용자 " + rs.getInt("user_id"),
                            rs.getInt("rating"),
                            nvl(rs.getString("content"), ""),
                            List.of(), // photoUrls
                            null, // adminMemo
                            List.of(), // history
                            null, // reply
                            status
                    );
                },
                companyId, reviewId
        );

        return list.isEmpty() ? null : list.get(0);
    }

    // ───────────────────────── 스코프 결정 ─────────────────────────
    private Scope resolveScope() {
        // 1) properties 우선
        if (scopeProps != null && scopeProps.isEnabled()) {
            ReviewScopeProperties.Mode m = scopeProps.getMode();
            if (m == null) m = ReviewScopeProperties.Mode.AUTO;

            Scope s = switch (m) {
                case PRODUCT -> new Scope("JOIN product p ON p.product_id = pr.product_id", "p.company_id = ?", "product.company_id");
                case COMPANY_PRODUCT -> new Scope("JOIN company_product cp ON cp.product_id = pr.product_id", "cp.company_id = ?", "company_product.company_id");
                case PRODUCT_LISTING_ITEM -> new Scope(
                        "JOIN product_listing_item pli ON pli.product_id = pr.product_id " +
                                "JOIN product_listing pl ON pl.listing_id = pli.listing_id",
                        "pl.company_id = ?",
                        "product_listing.company_id");
                case CUSTOM -> {
                    String join = trimToNull(scopeProps.getJoin());
                    String predicate = trimToNull(scopeProps.getPredicate());
                    if (join != null && predicate != null) {
                        yield new Scope(join, predicate, "custom");
                    } else {
                        log.warn("[ReviewMgmt] reviews.scope.mode=CUSTOM 이지만 join/predicate 가 비었습니다. AUTO로 진행합니다.");
                        yield null;
                    }
                }
                default -> null; // AUTO
            };

            if (s != null) {
                log.debug("[ReviewMgmt] 회사 스코프: properties mode={} 적용 ({})", m, s.debugName);
                return cachedScope = s;
            } else {
                log.warn("[ReviewMgmt] properties가 설정되었지만 유효한 스코프를 만들지 못했습니다. AUTO로 진행합니다.");
            }
        }

        // 2) AUTO (테이블/컬럼 존재여부로 탐색)
        try {
            Scope s = cachedScope;
            if (s != null) return s;

            if (hasColumn("product_review", "company_id")) {
                s = new Scope("", "pr.company_id = ?", "product_review.company_id");
                return cachedScope = s;
            }
            if (hasTable("specialty_product")
                    && hasColumn("specialty_product", "product_id")
                    && hasColumn("specialty_product", "company_id")) {
                s = new Scope("JOIN specialty_product spf ON spf.product_id = pr.product_id",
                        "spf.company_id = ?", "specialty_product.company_id");
                return cachedScope = s;
            }
            if (hasTable("product")
                    && hasColumn("product", "product_id")
                    && hasColumn("product", "company_id")) {
                s = new Scope("JOIN product p ON p.product_id = pr.product_id",
                        "p.company_id = ?", "product.company_id");
                return cachedScope = s;
            }
            if (hasTable("product_listing")
                    && hasColumn("product_listing", "product_id")
                    && hasColumn("product_listing", "company_id")) {
                s = new Scope("JOIN product_listing pl ON pl.product_id = pr.product_id",
                        "pl.company_id = ?", "product_listing.company_id");
                return cachedScope = s;
            }

            log.error("[ReviewMgmt] 자동감지 실패: 회사 제한 경로를 찾지 못했습니다.");
            return null;
        } catch (Exception e) {
            log.error("[ReviewMgmt] resolveScope 실패", e);
            return null;
        }
    }

    /** 상품명 소스 감지 */
    private NameSource resolveNameSrcSafe() {
        try {
            NameSource ns = cachedNameSource;
            if (ns != null) return ns;

            if (hasTable("specialty_product")
                    && hasColumn("specialty_product", "product_id")
                    && hasColumn("specialty_product", "product_name")) {
                ns = new NameSource(true, "specialty_product", "spn", "product_name",
                        "LEFT JOIN specialty_product spn ON spn.product_id = pr.product_id");
                return cachedNameSource = ns;
            }
            if (hasTable("product")
                    && hasColumn("product", "product_id")
                    && hasColumn("product", "product_name")) {
                ns = new NameSource(true, "product", "pn", "product_name",
                        "LEFT JOIN product pn ON pn.product_id = pr.product_id");
                return cachedNameSource = ns;
            }
            ns = new NameSource(false, null, null, null, "");
            return cachedNameSource = ns;
        } catch (Exception e) {
            log.warn("[ReviewMgmt] resolveNameSrcSafe 실패", e);
            return null;
        }
    }

    private String buildFrom(Scope scope, NameSource nameSrc) {
        if (scope == null) return " FROM product_review pr ";
        String nameJoin = (nameSrc != null && nameSrc.leftJoinClause != null) ? (" " + nameSrc.leftJoinClause) : "";
        String scopeJoins = scope.joins;
        if (scopeJoins != null && !scopeJoins.isBlank() && !scopeJoins.trim().toUpperCase().startsWith("JOIN")) {
            // 방어: CUSTOM에서 "JOIN ..."이 아니라면 붙이기
            scopeJoins = " " + scopeJoins.trim() + " ";
        } else if (scopeJoins != null) {
            scopeJoins = " " + scopeJoins.trim() + " ";
        }
        return " FROM product_review pr " + (scopeJoins == null ? "" : scopeJoins) + nameJoin + " ";
    }

    // ───────────────────────── 기타 헬퍼 ─────────────────────────
    private com.apiround.greenhub.dto.review.ReviewRowResponse mapRow(ResultSet rs, boolean hasNameColumn) throws SQLException {
        int reviewId = rs.getInt("review_id");
        String createdAt = tryFormat(rs.getTimestamp("created_at"));
        String productName = hasNameColumn ? nvl(rs.getString("product_name"), "-") : "-";
        String author = "사용자 " + rs.getInt("user_id");
        int rating = rs.getInt("rating");
        String content = nvl(rs.getString("content"), "");
        String status = (rs.getObject("is_deleted") != null && rs.getInt("is_deleted") == 1) ? "삭제" : "게시";

        return new com.apiround.greenhub.dto.review.ReviewRowResponse(
                reviewId, createdAt, null, productName, author, rating, content,
                List.of(), status, 0, "-"
        );
    }

    private String resolveSort(String sort) {
        String col = "date";
        String dir = "desc";
        if (StringUtils.hasText(sort)) {
            String[] p = sort.split(",");
            if (p.length >= 1 && StringUtils.hasText(p[0])) col = p[0].trim();
            if (p.length >= 2 && StringUtils.hasText(p[1])) dir = p[1].trim();
        }
        String column;
        switch (col) {
            case "rating" -> column = "pr.rating";
            case "author" -> column = "pr.user_id";
            case "product" -> {
                NameSource ns = resolveNameSrcSafe();
                column = (ns != null && ns.hasNameColumn) ? (ns.alias + "." + ns.nameColumn) : "pr.created_at";
            }
            default -> column = "pr.created_at";
        }
        String direction = "asc".equalsIgnoreCase(dir) ? "ASC" : "DESC";
        return " ORDER BY " + column + " " + direction + " ";
    }

    private String tryFormat(java.sql.Timestamp ts) {
        if (ts == null) return null;
        return ts.toLocalDateTime().format(DT);
    }
    private String nvl(String s, String def) { return (s == null || s.isBlank()) ? def : s; }

    private boolean hasTable(String table) {
        try {
            Integer n = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
                    Integer.class, table
            );
            return n != null && n > 0;
        } catch (Exception e) { return false; }
    }
    private boolean hasColumn(String table, String column) {
        try {
            Integer n = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
                    Integer.class, table, column
            );
            return n != null && n > 0;
        } catch (Exception e) { return false; }
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    /** 회사 제한 스코프 */
    private static final class Scope {
        final String joins;             // "JOIN ... ON ..." 또는 CUSTOM join 원문
        final String companyPredicate;  // "XXX.company_id = ?" 또는 CUSTOM predicate
        final String debugName;
        Scope(String joins, String companyPredicate, String debugName) {
            this.joins = joins;
            this.companyPredicate = companyPredicate;
            this.debugName = debugName;
        }
    }

    /** 상품명 소스 */
    private static final class NameSource {
        final boolean hasNameColumn;
        final String table;
        final String alias;
        final String nameColumn;
        final String leftJoinClause;
        NameSource(boolean hasNameColumn, String table, String alias, String nameColumn, String leftJoinClause) {
            this.hasNameColumn = hasNameColumn;
            this.table = table;
            this.alias = alias;
            this.nameColumn = nameColumn;
            this.leftJoinClause = (leftJoinClause == null) ? "" : leftJoinClause;
        }
    }
}
