package com.apiround.greenhub.delivery.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class OrderStatusHistoryJdbc {

    private final NamedParameterJdbcTemplate jdbc;

    public void insert(Integer orderId, Integer orderItemId, String fromStatus, String toStatus, String note) {
        String sql = """
            insert into order_status_history
                  (order_id, order_item_id, from_status, to_status, note, created_at)
            values (:orderId, :orderItemId, :fromStatus, :toStatus, :note, :createdAt)
        """;
        var params = new MapSqlParameterSource()
                .addValue("orderId", orderId)
                .addValue("orderItemId", orderItemId)
                .addValue("fromStatus", fromStatus)
                .addValue("toStatus", toStatus)
                .addValue("note", note)
                .addValue("createdAt", LocalDateTime.now());
        jdbc.update(sql, params);
    }
}
