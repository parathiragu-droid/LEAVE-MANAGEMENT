package com.leavemanagement.service.impl;

import com.leavemanagement.dto.AuthResponse;
import com.leavemanagement.dto.LoginRequest;
import com.leavemanagement.dto.MessageResponse;
import com.leavemanagement.dto.RegisterRequest;
import com.leavemanagement.dto.UserResponse;
import com.leavemanagement.exception.DuplicateEmailException;
import com.leavemanagement.exception.InvalidCredentialsException;
import com.leavemanagement.model.Role;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.UserRepository;
import com.leavemanagement.security.JwtService;
import com.leavemanagement.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${admin1.email:${ADMIN1_EMAIL:parathiragu@gmail.com}}")
    private String admin1Email;

    @Value("${admin2.email:${ADMIN2_EMAIL:kayalvezhi21@gmail.com}}")
    private String admin2Email;

    private boolean isReservedAdminEmail(String email) {
        if (email == null) return false;
        String normalized = email.trim().toLowerCase();
        boolean matchesAdmin1 = admin1Email != null && normalized.equalsIgnoreCase(admin1Email.trim());
        boolean matchesAdmin2 = admin2Email != null && normalized.equalsIgnoreCase(admin2Email.trim());
        return matchesAdmin1 || matchesAdmin2 || "parathiragu@gmail.com".equalsIgnoreCase(normalized) || "kayalvezhi21@gmail.com".equalsIgnoreCase(normalized);
    }

    @Override
    public MessageResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // Reject reserved administrator emails from public employee self-registration
        if (isReservedAdminEmail(normalizedEmail)) {
            throw new DuplicateEmailException("This email is already registered. Please log in.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("Email already registered");
        }

        // Hash password before saving
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Strictly assign EMPLOYEE role for public registration (Privilege escalation prevention)
        User user = User.builder()
                .name(request.getName().trim())
                .email(normalizedEmail)
                .password(hashedPassword)
                .role(Role.EMPLOYEE)
                .build();

        userRepository.save(user);

        return new MessageResponse("Registration successful");
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();

        return new AuthResponse(token, userResponse);
    }

    @Override
    public UserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new InvalidCredentialsException("Unauthorized");
        }

        String email = authentication.getName().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
