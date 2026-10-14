package com.leavemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leavemanagement.dto.LoginRequest;
import com.leavemanagement.dto.RegisterRequest;
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

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

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

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // ==========================================
    // REGISTRATION TESTS
    // ==========================================

    @Test
    @DisplayName("Registration: Successful employee registration hashes password and defaults to EMPLOYEE role")
    void testSuccessfulRegistration() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Ragu")
                .email("RAGU@example.com")
                .password("StrongPassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", is("Registration successful")));

        // Verify normalized email in MongoDB
        User savedUser = userRepository.findByEmail("ragu@example.com").orElseThrow();
        assertEquals("Ragu", savedUser.getName());
        assertEquals("ragu@example.com", savedUser.getEmail());
        assertEquals(Role.EMPLOYEE, savedUser.getRole());

        // Verify BCrypt hashed password
        assertNotEquals("StrongPassword123", savedUser.getPassword());
        assertTrue(passwordEncoder.matches("StrongPassword123", savedUser.getPassword()));
    }

    @Test
    @DisplayName("Registration: Duplicate email is rejected with 409 Conflict")
    void testDuplicateEmailRejected() throws Exception {
        // Register initial user
        userRepository.save(User.builder()
                .name("Existing User")
                .email("ragu@example.com")
                .password(passwordEncoder.encode("Password123"))
                .role(Role.EMPLOYEE)
                .build());

        RegisterRequest duplicateRequest = RegisterRequest.builder()
                .name("New User")
                .email("RAGU@example.com") // Case-insensitive duplicate check
                .password("DifferentPassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Email already registered")));
    }

    @Test
    @DisplayName("Registration: Invalid registration inputs are rejected with 400 Bad Request")
    void testInvalidRegistrationRejected() throws Exception {
        // Empty name
        RegisterRequest emptyName = RegisterRequest.builder()
                .name("")
                .email("test@example.com")
                .password("Password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyName)))
                .andExpect(status().isBadRequest());

        // Invalid email format
        RegisterRequest invalidEmail = RegisterRequest.builder()
                .name("Test User")
                .email("not-an-email")
                .password("Password123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidEmail)))
                .andExpect(status().isBadRequest());

        // Password shorter than 8 chars
        RegisterRequest shortPassword = RegisterRequest.builder()
                .name("Test User")
                .email("valid@example.com")
                .password("short")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shortPassword)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Registration: Privilege escalation attempt via role field is prevented")
    void testRegistrationIgnoresRoleField() throws Exception {
        // Sending raw JSON containing "role": "ADMIN"
        String maliciousPayload = """
                {
                    "name": "Attacker",
                    "email": "attacker@example.com",
                    "password": "Password123",
                    "role": "ADMIN"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail("attacker@example.com").orElseThrow();
        // Role MUST remain EMPLOYEE
        assertEquals(Role.EMPLOYEE, user.getRole());
    }

    // ==========================================
    // LOGIN TESTS
    // ==========================================

    @Test
    @DisplayName("Login: Correct credentials succeed and return JWT with user profile")
    void testLoginSuccess() throws Exception {
        userRepository.save(User.builder()
                .name("Ragu")
                .email("ragu@example.com")
                .password(passwordEncoder.encode("StrongPassword123"))
                .role(Role.EMPLOYEE)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("RAGU@example.com")
                .password("StrongPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.name", is("Ragu")))
                .andExpect(jsonPath("$.user.email", is("ragu@example.com")))
                .andExpect(jsonPath("$.user.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    @DisplayName("Login: Wrong password fails with 401 and generic error message")
    void testLoginWrongPasswordFails() throws Exception {
        userRepository.save(User.builder()
                .name("Ragu")
                .email("ragu@example.com")
                .password(passwordEncoder.encode("CorrectPassword123"))
                .role(Role.EMPLOYEE)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("ragu@example.com")
                .password("WrongPassword123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    @DisplayName("Login: Nonexistent user fails with 401 and generic error message")
    void testLoginNonExistentUserFails() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .email("nonexistent@example.com")
                .password("Password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    // ==========================================
    // JWT & AUTHORIZATION TESTS
    // ==========================================

    @Test
    @DisplayName("Authorization: /api/auth/me succeeds with valid JWT Bearer token")
    void testGetCurrentUserWithValidJwt() throws Exception {
        User user = userRepository.save(User.builder()
                .name("Ragu")
                .email("ragu@example.com")
                .password(passwordEncoder.encode("Password123"))
                .role(Role.EMPLOYEE)
                .build());

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(user.getId())))
                .andExpect(jsonPath("$.name", is("Ragu")))
                .andExpect(jsonPath("$.email", is("ragu@example.com")))
                .andExpect(jsonPath("$.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("Authorization: /api/auth/me rejected with 401 when token is missing")
    void testGetCurrentUserWithoutJwtFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Authorization: /api/auth/me rejected with 401 when token is invalid")
    void testGetCurrentUserWithInvalidJwtFails() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.malformed.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Authorization: /api/auth/me rejected with 401 when token is expired")
    void testGetCurrentUserWithExpiredJwtFails() throws Exception {
        User user = userRepository.save(User.builder()
                .name("Ragu")
                .email("ragu@example.com")
                .password(passwordEncoder.encode("Password123"))
                .role(Role.EMPLOYEE)
                .build());

        // Token expired 1 second ago (-1000ms)
        String expiredToken = jwtService.generateTokenWithExpiration(user.getEmail(), user.getRole().name(), -1000);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    // ==========================================
    // ADMIN INITIALIZATION & ROLE AUTHORIZATION TESTS
    // ==========================================

    @Test
    @DisplayName("Admin: Admin login succeeds, resolves ADMIN role, and accesses protected /api/admin/**")
    void testAdminLoginAndAccess() throws Exception {
        userRepository.save(User.builder()
                .name("Parathi Ragu")
                .email("parathiragu@gmail.com")
                .password(passwordEncoder.encode("AdminPass123!"))
                .role(Role.ADMIN)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("parathiragu@gmail.com")
                .password("AdminPass123!")
                .build();

        // 1. Same login API returns ADMIN role
        String responseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("ADMIN")))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(responseBody).get("token").asText();

        // 2. /api/auth/me returns ADMIN role
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ADMIN")));

        // 3. /api/admin/overview succeeds for ADMIN token
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Admin access granted")));
    }

    @Test
    @DisplayName("Admin: EMPLOYEE token is strictly forbidden (403) from accessing /api/admin/**")
    void testEmployeeForbiddenFromAdminEndpoint() throws Exception {
        User employee = userRepository.save(User.builder()
                .name("Normal Employee")
                .email("worker@example.com")
                .password(passwordEncoder.encode("WorkerPass123"))
                .role(Role.EMPLOYEE)
                .build());

        String employeeToken = jwtService.generateToken(employee.getEmail(), employee.getRole().name());

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Access denied")));
    }

    @Test
    @DisplayName("Admin: Public registration cannot overwrite existing admin account")
    void testPublicRegistrationCannotOverwriteAdmin() throws Exception {
        userRepository.save(User.builder()
                .name("Initial Admin")
                .email("parathiragu@gmail.com")
                .password(passwordEncoder.encode("AdminSecret123"))
                .role(Role.ADMIN)
                .build());

        RegisterRequest attackPayload = RegisterRequest.builder()
                .name("Malicious User")
                .email("parathiragu@gmail.com")
                .password("NewPassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(attackPayload)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("This email is already registered. Please log in.")));

        User preservedAdmin = userRepository.findByEmail("parathiragu@gmail.com").orElseThrow();
        assertEquals(Role.ADMIN, preservedAdmin.getRole());
        assertEquals("Initial Admin", preservedAdmin.getName());
        assertTrue(passwordEncoder.matches("AdminSecret123", preservedAdmin.getPassword()));
    }

    @Test
    @DisplayName("Admin: Reserved Admin 1 email cannot be publicly registered (even before account exists)")
    void testReservedAdmin1CannotBeRegistered() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Attacker 1")
                .email("parathiragu@gmail.com")
                .password("SomePassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("This email is already registered. Please log in.")));

        assertTrue(userRepository.findByEmail("parathiragu@gmail.com").isEmpty());
    }

    @Test
    @DisplayName("Admin: Reserved Admin 2 email cannot be publicly registered (even before account exists)")
    void testReservedAdmin2CannotBeRegistered() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .name("Attacker 2")
                .email("kayalvezhi21@gmail.com")
                .password("SomePassword123")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("This email is already registered. Please log in.")));

        assertTrue(userRepository.findByEmail("kayalvezhi21@gmail.com").isEmpty());
    }

    @Test
    @DisplayName("Admin: Reconciles existing reserved-email EMPLOYEE account to ADMIN and replaces password")
    void testReconcileEmployeeToAdmin() {
        // Given an existing user with role EMPLOYEE for reserved admin email
        userRepository.save(User.builder()
                .name("Old Employee")
                .email("parathiragu@gmail.com")
                .password(passwordEncoder.encode("OldEmployeePassword"))
                .role(Role.EMPLOYEE)
                .build());

        com.leavemanagement.config.AdminAccountInitializer initializer =
                new com.leavemanagement.config.AdminAccountInitializer(userRepository, passwordEncoder);

        // Run initializer with admin credentials
        org.springframework.test.util.ReflectionTestUtils.setField(initializer, "admin1Email", "parathiragu@gmail.com");
        org.springframework.test.util.ReflectionTestUtils.setField(initializer, "admin1Password", "NewAdminSecretPass");
        org.springframework.test.util.ReflectionTestUtils.setField(initializer, "admin2Email", "kayalvezhi21@gmail.com");
        org.springframework.test.util.ReflectionTestUtils.setField(initializer, "admin2Password", "NewAdminSecretPass2");

        initializer.run();

        // Verify account converted to ADMIN and password replaced
        User reconciled = userRepository.findByEmail("parathiragu@gmail.com").orElseThrow();
        assertEquals(Role.ADMIN, reconciled.getRole());
        assertTrue(passwordEncoder.matches("NewAdminSecretPass", reconciled.getPassword()));
        org.junit.jupiter.api.Assertions.assertFalse(passwordEncoder.matches("OldEmployeePassword", reconciled.getPassword()));
    }

    @Test
    @DisplayName("Regression: Admin 1 email resolves to ADMIN on login and /api/auth/me")
    void testAdmin1EmailResolvesToAdmin() throws Exception {
        userRepository.save(User.builder()
                .name("Admin One")
                .email("parathiragu@gmail.com")
                .password(passwordEncoder.encode("AdminPass1!"))
                .role(Role.ADMIN)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("parathiragu@gmail.com")
                .password("AdminPass1!")
                .build();

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("ADMIN")))
                .andExpect(jsonPath("$.user.email", is("parathiragu@gmail.com")))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ADMIN")))
                .andExpect(jsonPath("$.email", is("parathiragu@gmail.com")));
    }

    @Test
    @DisplayName("Regression: Admin 2 email resolves to ADMIN on login and /api/auth/me")
    void testAdmin2EmailResolvesToAdmin() throws Exception {
        userRepository.save(User.builder()
                .name("Admin Two")
                .email("kayalvezhi21@gmail.com")
                .password(passwordEncoder.encode("AdminPass2!"))
                .role(Role.ADMIN)
                .build());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("kayalvezhi21@gmail.com")
                .password("AdminPass2!")
                .build();

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("ADMIN")))
                .andExpect(jsonPath("$.user.email", is("kayalvezhi21@gmail.com")))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ADMIN")))
                .andExpect(jsonPath("$.email", is("kayalvezhi21@gmail.com")));
    }

    @Test
    @DisplayName("Regression: Normal registration creates EMPLOYEE and resolves to EMPLOYEE")
    void testNormalRegistrationCreatesEmployee() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .name("Regular Employee")
                .email("employee.test@example.com")
                .password("EmployeePass123!")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginRequest = LoginRequest.builder()
                .email("employee.test@example.com")
                .password("EmployeePass123!")
                .build();

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role", is("EMPLOYEE")))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(response).get("token").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("EMPLOYEE")))
                .andExpect(jsonPath("$.email", is("employee.test@example.com")));
    }

    @Test
    @DisplayName("Regression: Employee cannot access Admin endpoints (403 Forbidden)")
    void testEmployeeCannotAccessAdminEndpoints() throws Exception {
        User employee = userRepository.save(User.builder()
                .name("Bob Employee")
                .email("bob@example.com")
                .password(passwordEncoder.encode("Pass123!"))
                .role(Role.EMPLOYEE)
                .build());

        String token = jwtService.generateToken(employee.getEmail(), employee.getRole().name());

        mockMvc.perform(get("/api/admin/leaves")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
