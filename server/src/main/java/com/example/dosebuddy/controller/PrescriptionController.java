package com.example.dosebuddy.controller;

import com.example.dosebuddy.dto.PrescriptionScanResult;
import com.example.dosebuddy.service.PrescriptionScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "https://dose-buddy.vercel.app"})
public class PrescriptionController {

    private final PrescriptionScanService prescriptionScanService;

    public PrescriptionController(PrescriptionScanService prescriptionScanService) {
        this.prescriptionScanService = prescriptionScanService;
    }

    @PostMapping("/scan")
    public ResponseEntity<PrescriptionScanResult> scanPrescription(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "presetId", required = false) String presetId) {
        
        PrescriptionScanResult result = prescriptionScanService.scanAndExtract(file, presetId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/samples")
    public ResponseEntity<List<Map<String, String>>> getSamplePresets() {
        return ResponseEntity.ok(List.of(
            Map.of(
                "id", "sample_messy_rx_1",
                "title", "Messy Rx #1: Senior Cardiac & Diabetes Regimen",
                "doctor", "Dr. Arvind Sharma (Internal Medicine)",
                "medications", "Metformin (1-0-1), Amlodipine (0-0-1), Atorvastatin (0-0-1)",
                "type", "Cursive Doctor Shorthand"
            ),
            Map.of(
                "id", "sample_messy_rx_2",
                "title", "Messy Rx #2: Post-Op Antibiotic & Pain Regimen",
                "doctor", "Dr. Eleanor Vance (Orthopedics)",
                "medications", "Amoxicillin (1-1-1), Pantoprazole (1-0-0 AC), Paracetamol (1-0-1 SOS)",
                "type", "Rapid Surgical Script"
            ),
            Map.of(
                "id", "sample_messy_rx_3",
                "title", "Messy Rx #3: Respiratory & Allergy Regimen",
                "doctor", "Dr. Marcus Brody (Pulmonology)",
                "medications", "Montelukast+Levocetirizine (0-0-1), Vitamin D3 (1-0-0)",
                "type", "Clinic Hand Note"
            )
        ));
    }
}
