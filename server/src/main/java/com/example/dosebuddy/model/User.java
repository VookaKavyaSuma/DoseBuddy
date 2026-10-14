package com.example.dosebuddy.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(nullable = false, unique = true, length = 64)
    private String id;

    @Column(nullable = false, unique = true, length = 128)
    private String email;

    @Column(length = 64)
    private String username;

    @Column(nullable = false, length = 128)
    private String fullName;

    @Column(nullable = false, length = 255)
    private String password; // Encrypted with BCrypt

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private UserRole role;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public User() {
        this.createdAt = LocalDateTime.now();
    }

    public User(String id, String email, String username, String fullName, String password, UserRole role) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.fullName = fullName;
        this.password = password;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
