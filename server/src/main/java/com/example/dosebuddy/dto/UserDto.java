package com.example.dosebuddy.dto;

import com.example.dosebuddy.model.User;
import com.example.dosebuddy.model.UserRole;

public class UserDto {
    private String id;
    private String email;
    private String username;
    private String fullName;
    private UserRole role;

    public UserDto() {
    }

    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.username = user.getUsername();
        this.fullName = user.getFullName();
        this.role = user.getRole();
    }

    public UserDto(String id, String email, String username, String fullName, UserRole role) {
        this.id = id;
        this.email = email;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
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

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
