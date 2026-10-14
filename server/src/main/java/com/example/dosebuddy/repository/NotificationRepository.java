package com.example.dosebuddy.repository;

import com.example.dosebuddy.model.NotificationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationRecord, Long> {
    List<NotificationRecord> findByRecipientRoleOrderByCreatedAtDesc(String recipientRole);
    List<NotificationRecord> findAllByOrderByCreatedAtDesc();
    List<NotificationRecord> findTop30ByOrderByCreatedAtDesc();
}
