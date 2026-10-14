package com.example.dosebuddy.dto;

import java.util.ArrayList;
import java.util.List;

public class PrescriptionScanResult {
    private boolean success;
    private String doctorName;
    private String clinicName;
    private String patientName;
    private String handwritingClarity; // e.g. "Messy Cursive Decoded", "Handwritten Prescription"
    private int confidenceScore; // e.g. 95%
    private String analysisNotes;
    private List<ExtractedMedicationDto> medications = new ArrayList<>();
    private List<String> drugInteractionWarnings = new ArrayList<>();
    private String medicalDisclaimer = "Important: DoseBuddy AI extracts medication details to assist adherence. Always confirm dosage and timing with your doctor or pharmacist.";

    public PrescriptionScanResult() {
        this.success = true;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getDoctorName() {
        return doctorName;
    }

    public void setDoctorName(String doctorName) {
        this.doctorName = doctorName;
    }

    public String getClinicName() {
        return clinicName;
    }

    public void setClinicName(String clinicName) {
        this.clinicName = clinicName;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getHandwritingClarity() {
        return handwritingClarity;
    }

    public void setHandwritingClarity(String handwritingClarity) {
        this.handwritingClarity = handwritingClarity;
    }

    public int getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(int confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getAnalysisNotes() {
        return analysisNotes;
    }

    public void setAnalysisNotes(String analysisNotes) {
        this.analysisNotes = analysisNotes;
    }

    public List<ExtractedMedicationDto> getMedications() {
        return medications;
    }

    public void setMedications(List<ExtractedMedicationDto> medications) {
        this.medications = medications;
    }

    public List<String> getDrugInteractionWarnings() {
        return drugInteractionWarnings;
    }

    public void setDrugInteractionWarnings(List<String> drugInteractionWarnings) {
        this.drugInteractionWarnings = drugInteractionWarnings;
    }

    public String getMedicalDisclaimer() {
        return medicalDisclaimer;
    }

    public void setMedicalDisclaimer(String medicalDisclaimer) {
        this.medicalDisclaimer = medicalDisclaimer;
    }
}
