package com.example.dosebuddy.config;

import com.example.dosebuddy.model.User;
import com.example.dosebuddy.model.UserRole;
import com.example.dosebuddy.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Seed Demo Caregiver
        if (!userRepository.existsByEmail("caregiver@dosebuddy.com")) {
            User caregiver = new User(
                    "usr_caregiver_1",
                    "caregiver@dosebuddy.com",
                    "caregiver_sarah",
                    "Sarah Jenkins (Caregiver)",
                    passwordEncoder.encode("password123"),
                    UserRole.CAREGIVER
            );
            userRepository.save(caregiver);
        }

        // 2. Seed Demo Patient
        if (!userRepository.existsByEmail("patient@dosebuddy.com")) {
            User patient = new User(
                    "usr_patient_1",
                    "patient@dosebuddy.com",
                    "patient_robert",
                    "Robert Jenkins (Senior)",
                    passwordEncoder.encode("password123"),
                    UserRole.PATIENT
            );
            userRepository.save(patient);
        }
    }
}
