package com.example.dosebuddy.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false, length = 100)
    private String conversationId;

    @Column(nullable = false, length = 20)
    private String role; // "user" or "ai"

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at")
    private LocalDateTime timestamp;

    public ChatMessageEntity() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessageEntity(String conversationId, String role, String content) {
        this.conversationId = conversationId;
        this.role = role;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public ChatMessage toDto() {
        ChatMessage dto = new ChatMessage(this.role, this.content);
        dto.setTimestamp(this.timestamp);
        return dto;
    }
}
