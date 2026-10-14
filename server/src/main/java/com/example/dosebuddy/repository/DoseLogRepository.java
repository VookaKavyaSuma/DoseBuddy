package com.example.dosebuddy.repository;

import com.example.dosebuddy.model.DoseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoseLogRepository extends JpaRepository<DoseLog, Long> {
    List<DoseLog> findByLogDateOrderByLoggedAtDesc(LocalDate logDate);
    List<DoseLog> findByUserIdAndLogDateOrderByLoggedAtDesc(String userId, LocalDate logDate);
    List<DoseLog> findTop20ByOrderByLoggedAtDesc();
}
