// src/main/java/com/apiround/greenhub/delivery/push/OrderStatusBroadcaster.java
package com.apiround.greenhub.delivery.push;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class OrderStatusBroadcaster {

    private final Map<Integer, List<SseEmitter>> emittersByCompany = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Integer companyId) {
        SseEmitter emitter = new SseEmitter(Duration.ofMinutes(30).toMillis());
        emittersByCompany.computeIfAbsent(companyId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> remove(companyId, emitter));
        emitter.onTimeout(() -> remove(companyId, emitter));
        emitter.onError(e -> remove(companyId, emitter));

        // 초기 핑
        try {
            emitter.send(SseEmitter.event()
                    .name("ping")
                    .data("ok")
                    .reconnectTime(3000));
        } catch (IOException ignored) {}

        return emitter;
    }

    public void send(Integer companyId, OrderStatusPush payload) {
        List<SseEmitter> list = emittersByCompany.get(companyId);
        if (list == null || list.isEmpty()) return;

        for (SseEmitter em : List.copyOf(list)) {
            try {
                em.send(SseEmitter.event()
                        .name("order-status")
                        .data(payload, MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                remove(companyId, em);
            }
        }
    }

    private void remove(Integer companyId, SseEmitter emitter) {
        List<SseEmitter> list = emittersByCompany.get(companyId);
        if (list != null) list.remove(emitter);
    }
}
