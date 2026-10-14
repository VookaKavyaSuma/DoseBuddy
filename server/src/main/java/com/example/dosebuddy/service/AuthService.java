package com.example.dosebuddy.service;

import com.example.dosebuddy.dto.AuthResponse;
import com.example.dosebuddy.dto.LoginRequest;
import com.example.dosebuddy.dto.RegisterRequest;
import com.example.dosebuddy.dto.UserDto;
import com.example.dosebuddy.model.User;
import com.example.dosebuddy.model.UserRole;
import com.example.dosebuddy.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtEncoder jwtEncoder,
                       JwtDecoder jwtDecoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long.");
        }
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            username = request.getEmail().split("@")[0];
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String userId = "usr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        User user = new User(
                userId,
                request.getEmail().trim().toLowerCase(),
                username.trim(),
                request.getFullName() != null ? request.getFullName().trim() : "User",
                encodedPassword,
                request.getRole() != null ? request.getRole() : UserRole.CAREGIVER
        );

        userRepository.save(user);

        String token = generateJwtToken(user);
        return new AuthResponse(token, new UserDto(user), "Account created successfully!");
    }

    public AuthResponse login(LoginRequest request) {
        if (request.getUsernameOrEmail() == null || request.getUsernameOrEmail().isBlank()) {
            throw new IllegalArgumentException("Please enter your email or username.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Please enter your password.");
        }

        User user = userRepository.findByEmailOrUsername(request.getUsernameOrEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email/username or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email/username or password.");
        }

        String token = generateJwtToken(user);
        return new AuthResponse(token, new UserDto(user), "Logged in successfully!");
    }

    public AuthResponse demoLogin(UserRole role) {
        String email = (role == UserRole.PATIENT) ? "patient@dosebuddy.com" : "caregiver@dosebuddy.com";
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Demo user not found: " + email));

        String token = generateJwtToken(user);
        return new AuthResponse(token, new UserDto(user), "Logged in with demo " + role + " account!");
    }

    public UserDto getCurrentUser(String tokenHeader) {
        if (tokenHeader == null || !tokenHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }

        String token = tokenHeader.substring(7);
        try {
            Jwt jwt = jwtDecoder.decode(token);
            String userId = jwt.getSubject();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            return new UserDto(user);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid or expired session token");
        }
    }

    private String generateJwtToken(User user) {
        Instant now = Instant.now();
        long expiresInSeconds = 86400; // 24 Hours

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("dosebuddy-api")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expiresInSeconds))
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("fullName", user.getFullName())
                .build();

        // Crucial fix: Specify JwsHeader with MacAlgorithm.HS256 for symmetric key signing
        JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }
}
