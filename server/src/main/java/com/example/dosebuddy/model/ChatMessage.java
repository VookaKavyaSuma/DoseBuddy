package com.example.dosebuddy.model;

import java.time.LocalDateTime;

public class ChatMessage {
    private String role; // "user" or "ai"
    private String content;
    private LocalDateTime timestamp;

    public ChatMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
        this.timestamp = LocalDateTime.now();
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
}
