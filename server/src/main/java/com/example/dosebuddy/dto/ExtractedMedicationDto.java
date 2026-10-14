package com.example.dosebuddy.dto;

public class ExtractedMedicationDto {
    private String name;
    private String dosage;
    private String frequency; // e.g. "1-0-1", "1-0-0", "0-0-1", "1-1-1"
    private boolean morning;
    private boolean afternoon;
    private boolean night;
    private String morningTime = "08:00";
    private String afternoonTime = "13:00";
    private String nightTime = "20:00";
    private String mealInstruction; // e.g. "After food with water"
    private String reason; // e.g. "Blood Pressure Control"
    private Integer durationDays = 30;
    private String interactionWarning;
    private String notes;

    public ExtractedMedicationDto() {
    }

    public ExtractedMedicationDto(String name, String dosage, String frequency,
                                  boolean morning, boolean afternoon, boolean night,
                                  String mealInstruction, String reason, Integer durationDays,
                                  String interactionWarning) {
        this.name = name;
        this.dosage = dosage;
        this.frequency = frequency;
        this.morning = morning;
        this.afternoon = afternoon;
        this.night = night;
        this.mealInstruction = mealInstruction;
        this.reason = reason;
        this.durationDays = durationDays != null ? durationDays : 30;
        this.interactionWarning = interactionWarning;
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

    public String getFrequency() {
        return frequency;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public boolean isMorning() {
        return morning;
    }

    public void setMorning(boolean morning) {
        this.morning = morning;
    }

    public boolean isAfternoon() {
        return afternoon;
    }

    public void setAfternoon(boolean afternoon) {
        this.afternoon = afternoon;
    }

    public boolean isNight() {
        return night;
    }

    public void setNight(boolean night) {
        this.night = night;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getDurationDays() {
        return durationDays;
    }

    public void setDurationDays(Integer durationDays) {
        this.durationDays = durationDays;
    }

    public String getInteractionWarning() {
        return interactionWarning;
    }

    public void setInteractionWarning(String interactionWarning) {
        this.interactionWarning = interactionWarning;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
