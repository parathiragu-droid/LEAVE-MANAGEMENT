package com.leavemanagement.controller;

import com.leavemanagement.dto.UpdateProfileRequest;
import com.leavemanagement.dto.UserProfileResponse;
import com.leavemanagement.exception.ResourceNotFoundException;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Slf4j
public class ProfileController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(Principal principal) {
        User user = findAuthenticatedUser(principal);
        return ResponseEntity.ok(mapToProfileResponse(user));
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Principal principal
    ) {
        User user = findAuthenticatedUser(principal);

        // Security: only name is updated. ID, email, role, and password remain immutable.
        user.setName(request.getName().trim());
        User updated = userRepository.save(user);

        log.info("Profile updated successfully for user {}", user.getEmail());
        return ResponseEntity.ok(mapToProfileResponse(updated));
    }

    private User findAuthenticatedUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        return userRepository.findByEmail(principal.getName().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        return UserProfileResponse.builder()
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
