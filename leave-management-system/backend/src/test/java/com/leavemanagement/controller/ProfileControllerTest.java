package com.leavemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leavemanagement.dto.UpdateProfileRequest;
import com.leavemanagement.model.Role;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.UserRepository;
import com.leavemanagement.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private String userToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = User.builder()
                .name("Alice Smith")
                .email("alice.profile@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.EMPLOYEE)
                .build();
        testUser = userRepository.save(testUser);

        userToken = jwtService.generateToken(testUser.getEmail(), testUser.getRole().name());
    }

    @Test
    @DisplayName("GET /api/profile returns authenticated user profile and hides private credentials")
    void testGetProfileSuccess() throws Exception {
        mockMvc.perform(get("/api/profile")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Alice Smith")))
                .andExpect(jsonPath("$.email", is("alice.profile@example.com")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.id").doesNotExist());
    }

    @Test
    @DisplayName("PUT /api/profile safely updates user name")
    void testUpdateProfileSuccess() throws Exception {
        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .name("Alice Johnson")
                .build();

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Alice Johnson")))
                .andExpect(jsonPath("$.email", is("alice.profile@example.com")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")));

        User updatedUser = userRepository.findByEmail("alice.profile@example.com").orElseThrow();
        assertEquals("Alice Johnson", updatedUser.getName());
        assertEquals(Role.EMPLOYEE, updatedUser.getRole());
    }

    @Test
    @DisplayName("PUT /api/profile ignores attempts to alter role, email, or id")
    void testUpdateProfileCannotAlterRoleOrEmail() throws Exception {
        UpdateProfileRequest maliciousRequest = UpdateProfileRequest.builder()
                .name("Alice Admin Attempt")
                .role("ADMIN")
                .email("hacked@example.com")
                .id("some-random-id")
                .build();

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Alice Admin Attempt")))
                .andExpect(jsonPath("$.email", is("alice.profile@example.com")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")));

        User persistentUser = userRepository.findByEmail("alice.profile@example.com").orElseThrow();
        assertEquals("Alice Admin Attempt", persistentUser.getName());
        assertEquals("alice.profile@example.com", persistentUser.getEmail());
        assertEquals(Role.EMPLOYEE, persistentUser.getRole());
        assertEquals(testUser.getId(), persistentUser.getId());
    }

    @Test
    @DisplayName("GET /api/profile without token returns 401 Unauthorized")
    void testProfileUnauthorized() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PUT /api/profile with blank name returns 400 Bad Request")
    void testUpdateProfileValidationFailure() throws Exception {
        UpdateProfileRequest invalidRequest = UpdateProfileRequest.builder()
                .name("")
                .build();

        mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
