package com.example.dosebuddy.repository;

import com.example.dosebuddy.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByCategory(String category);
    List<Medication> findByUserId(String userId);
    List<Medication> findAllByOrderByCreatedAtDesc();
}
