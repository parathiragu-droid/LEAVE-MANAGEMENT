package com.leavemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leavemanagement.dto.CreateLeaveRequest;
import com.leavemanagement.dto.UpdateLeaveRequest;
import com.leavemanagement.model.LeaveRequest;
import com.leavemanagement.model.LeaveStatus;
import com.leavemanagement.model.LeaveType;
import com.leavemanagement.model.Role;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.LeaveRequestRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class LeaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User employeeA;
    private User employeeB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        leaveRequestRepository.deleteAll();
        userRepository.deleteAll();

        employeeA = userRepository.save(User.builder()
                .name("Alice Employee")
                .email("alice@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.EMPLOYEE)
                .build());

        employeeB = userRepository.save(User.builder()
                .name("Bob Employee")
                .email("bob@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.EMPLOYEE)
                .build());

        tokenA = jwtService.generateToken(employeeA.getEmail(), employeeA.getRole().name());
        tokenB = jwtService.generateToken(employeeB.getEmail(), employeeB.getRole().name());
    }

    @Test
    @DisplayName("Create Leave: Valid request succeeds with status 201, status PENDING, and authenticated employee info")
    void testCreateValidLeaveSuccess() throws Exception {
        CreateLeaveRequest request = CreateLeaveRequest.builder()
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Seasonal fever and doctor consultation")
                .build();

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.employeeId", is(employeeA.getId())))
                .andExpect(jsonPath("$.employeeName", is("Alice Employee")))
                .andExpect(jsonPath("$.employeeEmail", is("alice@example.com")))
                .andExpect(jsonPath("$.leaveType", is("SICK")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.reason", is("Seasonal fever and doctor consultation")));

        List<LeaveRequest> allLeaves = leaveRequestRepository.findAll();
        assertEquals(1, allLeaves.size());
        LeaveRequest saved = allLeaves.get(0);
        assertEquals(employeeA.getId(), saved.getEmployeeId());
        assertEquals("alice@example.com", saved.getEmployeeEmail());
        assertEquals(LeaveStatus.PENDING, saved.getStatus());
    }

    @Test
    @DisplayName("Security: Client attempts to tamper with employeeId, employeeEmail, and status are overridden")
    void testCreateLeaveIgnoresInjectedIdentityAndStatus() throws Exception {
        String maliciousPayload = """
                {
                    "leaveType": "CASUAL",
                    "startDate": "2026-10-25",
                    "endDate": "2026-10-26",
                    "reason": "Personal errands",
                    "employeeId": "tampered-id-123",
                    "employeeEmail": "admin@example.com",
                    "employeeName": "Fake Admin",
                    "status": "APPROVED"
                }
                """;

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(maliciousPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId", is(employeeA.getId())))
                .andExpect(jsonPath("$.employeeEmail", is("alice@example.com")))
                .andExpect(jsonPath("$.employeeName", is("Alice Employee")))
                .andExpect(jsonPath("$.status", is("PENDING")));

        LeaveRequest saved = leaveRequestRepository.findAll().get(0);
        assertEquals(employeeA.getId(), saved.getEmployeeId());
        assertEquals(LeaveStatus.PENDING, saved.getStatus());
    }

    @Test
    @DisplayName("Validation: End date before start date is rejected with 400 Bad Request")
    void testEndDateBeforeStartDateRejected() throws Exception {
        CreateLeaveRequest request = CreateLeaveRequest.builder()
                .leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 10, 25))
                .endDate(LocalDate.of(2026, 10, 20)) // Invalid: before start date
                .reason("Valid reason")
                .build();

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("End date cannot be before start date")));
    }

    @Test
    @DisplayName("Validation: Missing leave type is rejected with 400 Bad Request")
    void testMissingLeaveTypeRejected() throws Exception {
        String invalidJson = """
                {
                    "startDate": "2026-10-20",
                    "endDate": "2026-10-22",
                    "reason": "Some reason"
                }
                """;

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Leave type is required")));
    }

    @Test
    @DisplayName("Validation: Missing or blank reason is rejected with 400 Bad Request")
    void testMissingOrBlankReasonRejected() throws Exception {
        CreateLeaveRequest blankReason = CreateLeaveRequest.builder()
                .leaveType(LeaveType.EARNED)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("   ")
                .build();

        mockMvc.perform(post("/api/leaves")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankReason)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Reason is required")));
    }

    @Test
    @DisplayName("Get My Leaves: Returns only authenticated employee's records sorted newest first")
    void testGetMyLeavesOnlyReturnsOwnRecords() throws Exception {
        // Leave for Alice
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 11, 2))
                .reason("Alice vacation 1")
                .status(LeaveStatus.PENDING)
                .createdAt(Instant.now().minusSeconds(3600))
                .build());

        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 11, 5))
                .endDate(LocalDate.of(2026, 11, 6))
                .reason("Alice vacation 2 (newer)")
                .status(LeaveStatus.PENDING)
                .createdAt(Instant.now())
                .build());

        // Leave for Bob
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeB.getId())
                .employeeName(employeeB.getName())
                .employeeEmail(employeeB.getEmail())
                .leaveType(LeaveType.EARNED)
                .startDate(LocalDate.of(2026, 12, 1))
                .endDate(LocalDate.of(2026, 12, 5))
                .reason("Bob vacation")
                .status(LeaveStatus.PENDING)
                .createdAt(Instant.now())
                .build());

        // Alice fetches her leaves
        mockMvc.perform(get("/api/leaves/my")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].reason", is("Alice vacation 2 (newer)")))
                .andExpect(jsonPath("$[1].reason", is("Alice vacation 1")));
    }

    @Test
    @DisplayName("Isolation: Employee B cannot access Employee A's leave (returns 404)")
    void testEmployeeBCannotAccessEmployeeALeave() throws Exception {
        LeaveRequest aliceLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Alice's confidential sick leave")
                .status(LeaveStatus.PENDING)
                .build());

        // Alice can access her own leave
        mockMvc.perform(get("/api/leaves/" + aliceLeave.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(aliceLeave.getId())));

        // Bob receives 404 Not Found (safe, prevents leaking whether the leave exists)
        mockMvc.perform(get("/api/leaves/" + aliceLeave.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Leave request not found")));
    }

    @Test
    @DisplayName("Isolation: Employee B cannot update Employee A's leave (returns 404)")
    void testEmployeeBCannotUpdateEmployeeALeave() throws Exception {
        LeaveRequest aliceLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Alice original reason")
                .status(LeaveStatus.PENDING)
                .build());

        UpdateLeaveRequest updateRequest = UpdateLeaveRequest.builder()
                .leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.of(2026, 10, 21))
                .endDate(LocalDate.of(2026, 10, 23))
                .reason("Bob maliciously modifying Alice leave")
                .build();

        mockMvc.perform(put("/api/leaves/" + aliceLeave.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Leave request not found")));

        // Verify leave in MongoDB remained completely untouched
        LeaveRequest unchanged = leaveRequestRepository.findById(aliceLeave.getId()).orElseThrow();
        assertEquals(LeaveType.SICK, unchanged.getLeaveType());
        assertEquals("Alice original reason", unchanged.getReason());
    }

    @Test
    @DisplayName("Isolation: Employee B cannot cancel Employee A's leave (returns 404)")
    void testEmployeeBCannotCancelEmployeeALeave() throws Exception {
        LeaveRequest aliceLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Alice leave")
                .status(LeaveStatus.PENDING)
                .build());

        mockMvc.perform(put("/api/leaves/" + aliceLeave.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Leave request not found")));

        // Status is still PENDING
        LeaveRequest unchanged = leaveRequestRepository.findById(aliceLeave.getId()).orElseThrow();
        assertEquals(LeaveStatus.PENDING, unchanged.getStatus());
    }

    @Test
    @DisplayName("Update Leave: Updating own pending leave succeeds and updates editable fields only")
    void testUpdateOwnPendingLeaveSuccess() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Original reason")
                .status(LeaveStatus.PENDING)
                .build());

        UpdateLeaveRequest updateRequest = UpdateLeaveRequest.builder()
                .leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.of(2026, 10, 21))
                .endDate(LocalDate.of(2026, 10, 23))
                .reason("Updated urgent reason")
                .build();

        mockMvc.perform(put("/api/leaves/" + leave.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leaveType", is("EMERGENCY")))
                .andExpect(jsonPath("$.startDate", is("2026-10-21")))
                .andExpect(jsonPath("$.endDate", is("2026-10-23")))
                .andExpect(jsonPath("$.reason", is("Updated urgent reason")))
                .andExpect(jsonPath("$.status", is("PENDING")));

        LeaveRequest updated = leaveRequestRepository.findById(leave.getId()).orElseThrow();
        assertEquals(LeaveType.EMERGENCY, updated.getLeaveType());
        assertEquals("Updated urgent reason", updated.getReason());
    }

    @Test
    @DisplayName("Update Leave: Cannot update processed leave (e.g. APPROVED, REJECTED, CANCELLED)")
    void testCannotUpdateProcessedLeave() throws Exception {
        LeaveRequest approvedLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("Reason")
                .status(LeaveStatus.APPROVED)
                .build());

        UpdateLeaveRequest updateRequest = UpdateLeaveRequest.builder()
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 10, 21))
                .endDate(LocalDate.of(2026, 10, 23))
                .reason("New reason")
                .build();

        mockMvc.perform(put("/api/leaves/" + approvedLeave.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Only pending leave requests can be updated")));
    }

    @Test
    @DisplayName("Cancel Leave: Cancelling pending leave updates status to CANCELLED and preserves document in DB")
    void testCancelPendingLeaveSuccess() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.OTHER)
                .startDate(LocalDate.of(2026, 10, 20))
                .endDate(LocalDate.of(2026, 10, 22))
                .reason("No longer needed")
                .status(LeaveStatus.PENDING)
                .build());

        mockMvc.perform(put("/api/leaves/" + leave.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")));

        // Verify document is still present in MongoDB and marked CANCELLED (not deleted)
        assertTrue(leaveRequestRepository.findById(leave.getId()).isPresent());
        LeaveRequest persisted = leaveRequestRepository.findById(leave.getId()).get();
        assertEquals(LeaveStatus.CANCELLED, persisted.getStatus());

        // Repeating cancel on already cancelled leave returns 400
        mockMvc.perform(put("/api/leaves/" + leave.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Only pending leave requests can be cancelled")));
    }

    @Test
    @DisplayName("Dashboard Summary: Correctly counts total, pending, approved, rejected, and cancelled requests for current employee only")
    void testDashboardSummaryCountsOnlyAuthenticatedEmployee() throws Exception {
        // Alice leaves
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId()).status(LeaveStatus.PENDING)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R1").build());
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId()).status(LeaveStatus.PENDING)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R2").build());
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId()).status(LeaveStatus.APPROVED)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R3").build());
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId()).status(LeaveStatus.REJECTED)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R4").build());
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId()).status(LeaveStatus.CANCELLED)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R5").build());

        // Bob leaves (should not affect Alice's summary)
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeB.getId()).status(LeaveStatus.APPROVED)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Bob 1").build());
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeB.getId()).status(LeaveStatus.PENDING)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Bob 2").build());

        mockMvc.perform(get("/api/leaves/summary")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(5)))
                .andExpect(jsonPath("$.pending", is(2)))
                .andExpect(jsonPath("$.approved", is(1)))
                .andExpect(jsonPath("$.rejected", is(1)))
                .andExpect(jsonPath("$.cancelled", is(1)));

        // Verify Bob's summary has only Bob's 2 leaves
        mockMvc.perform(get("/api/leaves/summary")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(2)))
                .andExpect(jsonPath("$.pending", is(1)))
                .andExpect(jsonPath("$.approved", is(1)))
                .andExpect(jsonPath("$.rejected", is(0)))
                .andExpect(jsonPath("$.cancelled", is(0)));
    }

    @Test
    @DisplayName("Security: Unauthenticated request to leave API returns 401 Unauthorized")
    void testUnauthenticatedLeaveRequestFails() throws Exception {
        mockMvc.perform(get("/api/leaves/my"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/leaves")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/leaves/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Privacy & Security: Reviewed leave response to employee never leaks admin email, account ID, or reviewedBy; provides reviewerDisplayName='Administrator'")
    void testEmployeeLeaveResponseNeverLeaksAdminIdentity() throws Exception {
        LeaveRequest reviewedLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employeeA.getId())
                .employeeName(employeeA.getName())
                .employeeEmail(employeeA.getEmail())
                .leaveType(LeaveType.SICK)
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 11, 3))
                .reason("Medical checkup")
                .status(LeaveStatus.APPROVED)
                .adminComment("Approved. Take care.")
                .reviewedAt(Instant.now())
                .reviewedBy("superadmin@company.com")
                .reviewedByName("John SuperAdmin")
                .build());

        // 1. Employee calls GET /api/leaves/{id}
        mockMvc.perform(get("/api/leaves/" + reviewedLeave.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(reviewedLeave.getId())))
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.adminComment", is("Approved. Take care.")))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()))
                .andExpect(jsonPath("$.reviewerDisplayName", is("Administrator")))
                // Strictly ensure no private admin fields are leaked to the employee
                .andExpect(jsonPath("$.reviewedBy").doesNotExist())
                .andExpect(jsonPath("$.reviewedByName").doesNotExist())
                .andExpect(jsonPath("$..superadmin@company.com").doesNotExist());

        // 2. Employee calls GET /api/leaves/my
        mockMvc.perform(get("/api/leaves/my")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reviewedBy").doesNotExist())
                .andExpect(jsonPath("$[0].reviewedByName").doesNotExist())
                .andExpect(jsonPath("$[0].reviewerDisplayName", is("Administrator")));
    }
}
