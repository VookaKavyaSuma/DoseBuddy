package com.example.dosebuddy.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dose_logs")
public class DoseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long medicationId;

    @Column(nullable = false, length = 150)
    private String medicationName;

    @Column(length = 100)
    private String dosage;

    @Column(length = 30)
    private String timeSlot; // "MORNING", "AFTERNOON", "NIGHT"

    @Column(length = 20)
    private String scheduledTime; // e.g. "08:00 AM"

    @Column(nullable = false, length = 20)
    private String status; // "TAKEN", "SKIPPED"

    @Column(length = 255)
    private String reason; // If skipped, reason provided

    @Column(length = 64)
    private String userId;

    private LocalDate logDate;

    private LocalDateTime loggedAt;

    public DoseLog() {
        this.logDate = LocalDate.now();
        this.loggedAt = LocalDateTime.now();
    }

    public DoseLog(Long medicationId, String medicationName, String dosage, String timeSlot,
                   String scheduledTime, String status, String reason, String userId) {
        this.medicationId = medicationId;
        this.medicationName = medicationName;
        this.dosage = dosage;
        this.timeSlot = timeSlot;
        this.scheduledTime = scheduledTime;
        this.status = status;
        this.reason = reason;
        this.userId = userId;
        this.logDate = LocalDate.now();
        this.loggedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(String timeSlot) {
        this.timeSlot = timeSlot;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDate getLogDate() {
        return logDate;
    }

    public void setLogDate(LocalDate logDate) {
        this.logDate = logDate;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }
}
