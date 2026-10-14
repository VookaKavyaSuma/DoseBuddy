package com.example.dosebuddy.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "medications")
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String dosage;

    @Column(length = 255)
    private String reason;

    @Column(length = 50)
    private String photo; // Emoji or image URL

    @Column(length = 30)
    private String category; // "current" or "past"

    private Integer remainingDoses;

    private Integer totalDays;

    @Column(length = 100)
    private String nextDose;

    @Column(length = 500)
    private String caregiverNote;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Scheduling and frequency fields for Morning, Afternoon, Night split
    @Column(length = 30)
    private String frequency; // e.g. "1-0-1", "1-0-0", "0-0-1", "1-1-1"

    private Boolean morningDose = false;
    private Boolean afternoonDose = false;
    private Boolean nightDose = false;

    @Column(length = 10)
    private String morningTime = "08:00";

    @Column(length = 10)
    private String afternoonTime = "13:00";

    @Column(length = 10)
    private String nightTime = "20:00";

    @Column(length = 255)
    private String mealInstruction; // e.g. "After food with water"

    @Column(length = 500)
    private String interactionWarning; // informational caution

    public Medication() {
        this.createdAt = LocalDateTime.now();
        this.photo = "💊";
        this.category = "current";
        this.remainingDoses = 30;
        this.totalDays = 30;
        this.frequency = "1-0-1";
        this.morningDose = true;
        this.afternoonDose = false;
        this.nightDose = true;
        this.morningTime = "08:00";
        this.afternoonTime = "13:00";
        this.nightTime = "20:00";
        this.mealInstruction = "Take after food with water";
    }

    public Medication(String name, String dosage, String reason, String photo, String category,
                      Integer remainingDoses, Integer totalDays, String nextDose, String caregiverNote, String userId) {
        this();
        this.name = name;
        this.dosage = dosage;
        this.reason = reason;
        this.photo = (photo != null && !photo.isBlank()) ? photo : "💊";
        this.category = (category != null && !category.isBlank()) ? category : "current";
        this.remainingDoses = remainingDoses != null ? remainingDoses : 30;
        this.totalDays = totalDays != null ? totalDays : 30;
        this.nextDose = nextDose;
        this.caregiverNote = caregiverNote;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getRemainingDoses() {
        return remainingDoses;
    }

    public void setRemainingDoses(Integer remainingDoses) {
        this.remainingDoses = remainingDoses;
    }

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public String getNextDose() {
        return nextDose;
    }

    public void setNextDose(String nextDose) {
        this.nextDose = nextDose;
    }

    public String getCaregiverNote() {
        return caregiverNote;
    }

    public void setCaregiverNote(String caregiverNote) {
        this.caregiverNote = caregiverNote;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public Boolean getMorningDose() {
        return morningDose;
    }

    public void setMorningDose(Boolean morningDose) {
        this.morningDose = morningDose;
    }

    public Boolean getAfternoonDose() {
        return afternoonDose;
    }

    public void setAfternoonDose(Boolean afternoonDose) {
        this.afternoonDose = afternoonDose;
    }

    public Boolean getNightDose() {
        return nightDose;
    }

    public void setNightDose(Boolean nightDose) {
        this.nightDose = nightDose;
    }

    public String getMorningTime() {
        return morningTime;
    }

    public void setMorningTime(String morningTime) {
        this.morningTime = morningTime;
    }

    public String getAfternoonTime() {
        return afternoonTime;
    }

    public void setAfternoonTime(String afternoonTime) {
        this.afternoonTime = afternoonTime;
    }

    public String getNightTime() {
        return nightTime;
    }

    public void setNightTime(String nightTime) {
        this.nightTime = nightTime;
    }

    public String getMealInstruction() {
        return mealInstruction;
    }

    public void setMealInstruction(String mealInstruction) {
        this.mealInstruction = mealInstruction;
    }

    public String getInteractionWarning() {
        return interactionWarning;
    }

    public void setInteractionWarning(String interactionWarning) {
        this.interactionWarning = interactionWarning;
    }
}
