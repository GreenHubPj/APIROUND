package com.apiround.greenhub.repository;

import com.apiround.greenhub.entity.UserNotification;
import com.apiround.greenhub.entity.UserNotificationPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationPreferencesRepository extends JpaRepository<UserNotificationPreferences, Long> {
    Optional<UserNotificationPreferences> findByUserId(Long userId);
}
