package com.example.dosebuddy.config;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
public class JwtConfig {

    // Pull the secret string from application.properties
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Bean
    public JwtDecoder jwtDecoder() {
        // Convert the string into a cryptographic key
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        
        // Build the decoder. Spring uses this automatically on incoming requests.
        return NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        // Convert the string into a cryptographic key
        SecretKeySpec secretKey = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        
        // Build the encoder. You will use this in your login controller.
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey.getEncoded()));
    }
}