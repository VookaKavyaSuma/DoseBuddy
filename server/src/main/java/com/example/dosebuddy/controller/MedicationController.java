package com.example.dosebuddy.controller;

import com.example.dosebuddy.model.DoseLog;
import com.example.dosebuddy.model.Medication;
import com.example.dosebuddy.model.NotificationRecord;
import com.example.dosebuddy.repository.DoseLogRepository;
import com.example.dosebuddy.repository.MedicationRepository;
import com.example.dosebuddy.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medications")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"})
public class MedicationController {

    private final MedicationRepository medicationRepository;
    private final DoseLogRepository doseLogRepository;
    private final NotificationRepository notificationRepository;

    public MedicationController(MedicationRepository medicationRepository,
                                DoseLogRepository doseLogRepository,
                                NotificationRepository notificationRepository) {
        this.medicationRepository = medicationRepository;
        this.doseLogRepository = doseLogRepository;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<Medication>> getAllMedications(@RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(medicationRepository.findByCategory(category));
        }
        return ResponseEntity.ok(medicationRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMedicationById(@PathVariable Long id) {
        return medicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createMedication(@RequestBody Medication medication) {
        try {
            if (medication.getName() == null || medication.getName().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Medicine name is required."));
            }
            if (medication.getPhoto() == null || medication.getPhoto().isBlank()) {
                medication.setPhoto("💊");
            }
            if (medication.getCategory() == null || medication.getCategory().isBlank()) {
                medication.setCategory("current");
            }
            if (medication.getRemainingDoses() == null) {
                medication.setRemainingDoses(medication.getTotalDays() != null ? medication.getTotalDays() : 30);
            }
            if (medication.getTotalDays() == null) {
                medication.setTotalDays(30);
            }

            Medication saved = medicationRepository.save(medication);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save medication: " + e.getMessage()));
        }
    }

    @PostMapping("/batch")
    public ResponseEntity<?> createMedicationsBatch(@RequestBody List<Medication> medications) {
        try {
            List<Medication> savedList = new ArrayList<>();
            for (Medication med : medications) {
                if (med.getName() != null && !med.getName().isBlank()) {
                    if (med.getPhoto() == null) med.setPhoto("💊");
                    if (med.getCategory() == null) med.setCategory("current");
                    if (med.getRemainingDoses() == null) med.setRemainingDoses(med.getTotalDays() != null ? med.getTotalDays() : 30);
                    if (med.getTotalDays() == null) med.setTotalDays(30);
                    savedList.add(medicationRepository.save(med));
                }
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(savedList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save batch medications: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedication(@PathVariable Long id, @RequestBody Medication details) {
        return medicationRepository.findById(id)
                .map(med -> {
                    // Track changes for notification summary
                    List<String> changes = new ArrayList<>();
                    if (details.getName() != null && !details.getName().equals(med.getName())) {
                        changes.add("Name changed from '" + med.getName() + "' to '" + details.getName() + "'");
                        med.setName(details.getName());
                    }
                    if (details.getDosage() != null && !details.getDosage().equals(med.getDosage())) {
                        changes.add("Dosage updated from '" + med.getDosage() + "' to '" + details.getDosage() + "'");
                        med.setDosage(details.getDosage());
                    }
                    if (details.getFrequency() != null && !details.getFrequency().equals(med.getFrequency())) {
                        changes.add("Frequency updated from '" + med.getFrequency() + "' to '" + details.getFrequency() + "'");
                        med.setFrequency(details.getFrequency());
                    }
                    if (details.getMealInstruction() != null && !details.getMealInstruction().equals(med.getMealInstruction())) {
                        changes.add("Meal instructions updated to '" + details.getMealInstruction() + "'");
                        med.setMealInstruction(details.getMealInstruction());
                    }
                    if (details.getReason() != null) med.setReason(details.getReason());
                    if (details.getCategory() != null) med.setCategory(details.getCategory());
                    if (details.getRemainingDoses() != null) med.setRemainingDoses(details.getRemainingDoses());
                    if (details.getTotalDays() != null) med.setTotalDays(details.getTotalDays());
                    if (details.getNextDose() != null) med.setNextDose(details.getNextDose());
                    if (details.getCaregiverNote() != null) med.setCaregiverNote(details.getCaregiverNote());
                    if (details.getMorningDose() != null) med.setMorningDose(details.getMorningDose());
                    if (details.getAfternoonDose() != null) med.setAfternoonDose(details.getAfternoonDose());
                    if (details.getNightDose() != null) med.setNightDose(details.getNightDose());
                    if (details.getMorningTime() != null) med.setMorningTime(details.getMorningTime());
                    if (details.getAfternoonTime() != null) med.setAfternoonTime(details.getAfternoonTime());
                    if (details.getNightTime() != null) med.setNightTime(details.getNightTime());
                    if (details.getInteractionWarning() != null) med.setInteractionWarning(details.getInteractionWarning());

                    Medication updated = medicationRepository.save(med);

                    String summary = changes.isEmpty()
                            ? "Medication details updated: " + updated.getName() + " (" + updated.getDosage() + ", " + updated.getFrequency() + ")"
                            : String.join("; ", changes);

                    // 1. Dispatch Notification to PATIENT
                    NotificationRecord patientNotification = new NotificationRecord(
                            "PATIENT",
                            "Robert Jenkins (Senior)",
                            "Sarah Jenkins (Caregiver)",
                            updated.getId(),
                            updated.getName(),
                            "🔔 Prescription Updated by Caregiver",
                            "Your caregiver Sarah Jenkins updated your " + updated.getName() + " regimen. " + summary + ". Your reminder schedule is updated.",
                            summary
                    );
                    notificationRepository.save(patientNotification);

                    // 2. Dispatch Confirmation Notification to CAREGIVER
                    NotificationRecord caregiverNotification = new NotificationRecord(
                            "CAREGIVER",
                            "Sarah Jenkins (Caregiver)",
                            "Caregiver System",
                            updated.getId(),
                            updated.getName(),
                            "📲 Medication Update Synced & Patient Notified",
                            "Changes to " + updated.getName() + " were successfully saved. Patient Robert Jenkins was notified of the schedule change: " + summary,
                            summary
                    );
                    notificationRepository.save(caregiverNotification);

                    return ResponseEntity.ok(Map.of(
                            "medication", updated,
                            "patientNotification", patientNotification,
                            "caregiverNotification", caregiverNotification,
                            "message", "Medication updated. Notifications sent to both Caregiver and Patient."
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/take")
    public ResponseEntity<?> takeDose(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        return medicationRepository.findById(id)
                .map(med -> {
                    if (med.getRemainingDoses() != null && med.getRemainingDoses() > 0) {
                        med.setRemainingDoses(med.getRemainingDoses() - 1);
                        if (med.getRemainingDoses() == 0) {
                            med.setCategory("past");
                            med.setNextDose("Course Completed");
                        }
                    }
                    Medication updated = medicationRepository.save(med);

                    // Record dose log for today's adherence
                    String timeSlot = (payload != null && payload.containsKey("timeSlot")) ? payload.get("timeSlot") : "TODAY";
                    String scheduledTime = (payload != null && payload.containsKey("scheduledTime")) ? payload.get("scheduledTime") : med.getNextDose();
                    DoseLog log = new DoseLog(
                            med.getId(),
                            med.getName(),
                            med.getDosage(),
                            timeSlot,
                            scheduledTime,
                            "TAKEN",
                            "Dose taken as scheduled",
                            med.getUserId()
                    );
                    doseLogRepository.save(log);

                    return ResponseEntity.ok(Map.of(
                            "medication", updated,
                            "doseLog", log,
                            "message", "Dose successfully logged as taken!"
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/skip")
    public ResponseEntity<?> skipDose(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return medicationRepository.findById(id)
                .map(med -> {
                    String reason = payload != null && payload.containsKey("reason")
                            ? payload.get("reason")
                            : "Patient skipped dose";
                    String timeSlot = payload != null && payload.containsKey("timeSlot")
                            ? payload.get("timeSlot")
                            : "TODAY";
                    String scheduledTime = payload != null && payload.containsKey("scheduledTime")
                            ? payload.get("scheduledTime")
                            : med.getNextDose();

                    DoseLog log = new DoseLog(
                            med.getId(),
                            med.getName(),
                            med.getDosage(),
                            timeSlot,
                            scheduledTime,
                            "SKIPPED",
                            reason,
                            med.getUserId()
                    );
                    DoseLog savedLog = doseLogRepository.save(log);

                    // Create caregiver notification for skipped dose
                    NotificationRecord notif = new NotificationRecord(
                            "CAREGIVER",
                            "Sarah Jenkins (Caregiver)",
                            "Robert Jenkins (Senior)",
                            med.getId(),
                            med.getName(),
                            "🚨 Patient Skipped Dose Alert",
                            "Robert Jenkins skipped " + med.getName() + " (" + timeSlot + "). Reason: " + reason,
                            "Skipped: " + reason
                    );
                    notificationRepository.save(notif);

                    return ResponseEntity.ok(Map.of(
                            "medication", med,
                            "doseLog", savedLog,
                            "message", "Dose skipped. Reason recorded."
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/logs")
    public ResponseEntity<List<DoseLog>> getDoseLogs(@RequestParam(required = false) String date) {
        LocalDate targetDate = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        List<DoseLog> logs = doseLogRepository.findByLogDateOrderByLoggedAtDesc(targetDate);
        if (logs.isEmpty()) {
            logs = doseLogRepository.findTop20ByOrderByLoggedAtDesc();
        }
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/logs")
    public ResponseEntity<DoseLog> createDoseLog(@RequestBody DoseLog log) {
        if (log.getLogDate() == null) log.setLogDate(LocalDate.now());
        DoseLog saved = doseLogRepository.save(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationRecord>> getNotifications(@RequestParam(required = false) String role) {
        if (role != null && !role.isBlank()) {
            return ResponseEntity.ok(notificationRepository.findByRecipientRoleOrderByCreatedAtDesc(role.toUpperCase()));
        }
        return ResponseEntity.ok(notificationRepository.findTop30ByOrderByCreatedAtDesc());
    }

    @PostMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationRead(@PathVariable Long id) {
        return notificationRepository.findById(id)
                .map(n -> {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                    return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedication(@PathVariable Long id) {
        return medicationRepository.findById(id).map(med -> {
            String medName = med.getName();
            medicationRepository.delete(med);

            // Record Dual Notification for Deletion / Removal
            try {
                // 1. Patient Notification
                NotificationRecord patientNotif = new NotificationRecord(
                        "PATIENT",
                        "Robert Jenkins (Senior)",
                        "Sarah Jenkins (Caregiver)",
                        id,
                        medName,
                        "🗑️ Medication Removed from Schedule",
                        "Your caregiver Sarah Jenkins removed " + medName + " from your active medication schedule. Reminders have been discontinued.",
                        "Medication removed and discontinued"
                );
                notificationRepository.save(patientNotif);

                // 2. Caregiver Confirmation Notification
                NotificationRecord caregiverNotif = new NotificationRecord(
                        "CAREGIVER",
                        "Sarah Jenkins (Caregiver)",
                        "Caregiver System",
                        id,
                        medName,
                        "🗑️ Medication Removed & Schedule Updated",
                        "You removed " + medName + " from Robert's daily schedule. Patient notified and reminders stopped.",
                        "Medication removed and discontinued"
                );
                notificationRepository.save(caregiverNotif);
            } catch (Exception e) {
                System.err.println("Failed to record delete notifications: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Medication deleted successfully",
                    "id", id,
                    "medicationName", medName
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}
