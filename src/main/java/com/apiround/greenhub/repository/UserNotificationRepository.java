package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification,Long> {

    List<UserNotification> findByUserId(Long userId);
}
