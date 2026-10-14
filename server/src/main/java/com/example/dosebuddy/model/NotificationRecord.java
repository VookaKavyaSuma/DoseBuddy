package com.example.dosebuddy.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_records")
public class NotificationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String recipientRole; // "PATIENT", "CAREGIVER", "BOTH"

    @Column(nullable = false, length = 100)
    private String recipientName; // e.g. "Robert Jenkins (Senior)"

    @Column(length = 100)
    private String senderName; // e.g. "Sarah Jenkins (Caregiver)"

    private Long medicationId;

    @Column(nullable = false, length = 150)
    private String medicationName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(length = 500)
    private String changeSummary;

    private Boolean isRead = false;

    private LocalDateTime createdAt;

    public NotificationRecord() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public NotificationRecord(String recipientRole, String recipientName, String senderName,
                              Long medicationId, String medicationName, String title,
                              String message, String changeSummary) {
        this.recipientRole = recipientRole;
        this.recipientName = recipientName;
        this.senderName = senderName;
        this.medicationId = medicationId;
        this.medicationName = medicationName;
        this.title = title;
        this.message = message;
        this.changeSummary = changeSummary;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRecipientRole() {
        return recipientRole;
    }

    public void setRecipientRole(String recipientRole) {
        this.recipientRole = recipientRole;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public Long getMedicationId() {
        return medicationId;
    }

    public void setMedicationId(Long medicationId) {
        this.medicationId = medicationId;
    }

    public String getMedicationName() {
        return medicationName;
    }

    public void setMedicationName(String medicationName) {
        this.medicationName = medicationName;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getChangeSummary() {
        return changeSummary;
    }

    public void setChangeSummary(String changeSummary) {
        this.changeSummary = changeSummary;
    }

    public Boolean getIsRead() {
        return isRead;
    }

    public void setIsRead(Boolean isRead) {
        this.isRead = isRead;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
