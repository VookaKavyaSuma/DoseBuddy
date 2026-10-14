package com.example.dosebuddy.repository;

import com.example.dosebuddy.model.ChatMessageEntity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Long> {
    List<ChatMessageEntity> findByConversationIdOrderByTimestampAsc(String conversationId);
    void deleteByConversationId(String conversationId);
}
