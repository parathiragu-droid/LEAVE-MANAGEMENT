package com.leavemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leavemanagement.dto.AdminLeaveReviewRequest;
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

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminLeaveControllerTest {

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

    private User admin1;
    private User admin2;
    private User employee;
    private String tokenAdmin1;
    private String tokenAdmin2;
    private String tokenEmployee;

    @BeforeEach
    void setUp() {
        leaveRequestRepository.deleteAll();
        userRepository.deleteAll();

        admin1 = userRepository.save(User.builder()
                .name("Parathi Admin")
                .email("parathiragu@gmail.com")
                .password(passwordEncoder.encode("AdminPass1!"))
                .role(Role.ADMIN)
                .build());

        admin2 = userRepository.save(User.builder()
                .name("Kayal Admin")
                .email("kayalvezhi21@gmail.com")
                .password(passwordEncoder.encode("AdminPass2!"))
                .role(Role.ADMIN)
                .build());

        employee = userRepository.save(User.builder()
                .name("Alice Employee")
                .email("alice@example.com")
                .password(passwordEncoder.encode("Password123!"))
                .role(Role.EMPLOYEE)
                .build());

        tokenAdmin1 = jwtService.generateToken(admin1.getEmail(), admin1.getRole().name());
        tokenAdmin2 = jwtService.generateToken(admin2.getEmail(), admin2.getRole().name());
        tokenEmployee = jwtService.generateToken(employee.getEmail(), employee.getRole().name());
    }

    // ==========================================
    // DASHBOARD METRICS TESTS
    // ==========================================

    @Test
    @DisplayName("Admin Dashboard: Admin receives accurate real metrics matching MongoDB")
    void testAdminGetsDashboardMetrics() throws Exception {
        // Setup leave requests in various states
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.PENDING).leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R1").build());

        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.APPROVED).leaveType(LeaveType.SICK)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R2").build());

        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.REJECTED).leaveType(LeaveType.EARNED)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R3").build());

        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.CANCELLED).leaveType(LeaveType.EMERGENCY)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("R4").build());

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + tokenAdmin1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees", is(1))) // Only Alice, admins excluded
                .andExpect(jsonPath("$.totalRequests", is(4)))
                .andExpect(jsonPath("$.pending", is(1)))
                .andExpect(jsonPath("$.approved", is(1)))
                .andExpect(jsonPath("$.rejected", is(1)))
                .andExpect(jsonPath("$.cancelled", is(1)));
    }

    @Test
    @DisplayName("Security: EMPLOYEE cannot access admin dashboard (403 Forbidden)")
    void testEmployeeCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + tokenEmployee))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Access denied")));
    }

    // ==========================================
    // ALL LEAVE REQUESTS TESTS
    // ==========================================

    @Test
    @DisplayName("Admin Leaves: Admin retrieves all requests and can filter by status")
    void testAdminGetsAllLeavesAndFilters() throws Exception {
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.PENDING)
                .leaveType(LeaveType.CASUAL).reason("Pending 1")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.APPROVED)
                .leaveType(LeaveType.SICK).reason("Approved 1")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        // Get all leaves
        mockMvc.perform(get("/api/admin/leaves")
                        .header("Authorization", "Bearer " + tokenAdmin1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));

        // Filter by PENDING
        mockMvc.perform(get("/api/admin/leaves?status=PENDING")
                        .header("Authorization", "Bearer " + tokenAdmin1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].reason", is("Pending 1")))
                .andExpect(jsonPath("$[0].status", is("PENDING")));
    }

    @Test
    @DisplayName("Security: EMPLOYEE cannot access all leaves endpoint (403 Forbidden)")
    void testEmployeeCannotAccessAdminLeaves() throws Exception {
        mockMvc.perform(get("/api/admin/leaves")
                        .header("Authorization", "Bearer " + tokenEmployee))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // APPROVE LEAVE TESTS
    // ==========================================

    @Test
    @DisplayName("Admin Approval: Admin 1 approves pending leave, sets status APPROVED, reviewer identity, and timestamp")
    void testAdmin1ApprovesPendingLeave() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.PENDING).leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Vacation")
                .build());

        AdminLeaveReviewRequest reviewRequest = AdminLeaveReviewRequest.builder()
                .comment("Enjoy your vacation!")
                .build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.adminComment", is("Enjoy your vacation!")))
                .andExpect(jsonPath("$.reviewedBy", is("parathiragu@gmail.com")))
                .andExpect(jsonPath("$.reviewedByName", is("Parathi Admin")))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()));

        LeaveRequest updated = leaveRequestRepository.findById(leave.getId()).orElseThrow();
        assertEquals(LeaveStatus.APPROVED, updated.getStatus());
        assertEquals("parathiragu@gmail.com", updated.getReviewedBy());
        assertNotNull(updated.getReviewedAt());
    }

    // ==========================================
    // REJECT LEAVE TESTS
    // ==========================================

    @Test
    @DisplayName("Admin Rejection: Admin 2 rejects pending leave with mandatory comment")
    void testAdmin2RejectsPendingLeave() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.PENDING).leaveType(LeaveType.SICK)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Feeling unwell")
                .build());

        AdminLeaveReviewRequest reviewRequest = AdminLeaveReviewRequest.builder()
                .comment("Project delivery deadline during this duration.")
                .build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenAdmin2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("REJECTED")))
                .andExpect(jsonPath("$.adminComment", is("Project delivery deadline during this duration.")))
                .andExpect(jsonPath("$.reviewedBy", is("kayalvezhi21@gmail.com")))
                .andExpect(jsonPath("$.reviewedByName", is("Kayal Admin")))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()));

        LeaveRequest updated = leaveRequestRepository.findById(leave.getId()).orElseThrow();
        assertEquals(LeaveStatus.REJECTED, updated.getStatus());
        assertEquals("kayalvezhi21@gmail.com", updated.getReviewedBy());
    }

    @Test
    @DisplayName("Validation: Rejection with blank comment is rejected with 400 Bad Request")
    void testBlankRejectionCommentRejected() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.PENDING)
                .leaveType(LeaveType.CASUAL).reason("Vacation")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        AdminLeaveReviewRequest blankComment = AdminLeaveReviewRequest.builder()
                .comment("   ")
                .build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenAdmin1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankComment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Rejection reason is required")));
    }

    // ==========================================
    // STATE TRANSITION & CONFLICT TESTS
    // ==========================================

    @Test
    @DisplayName("State Transition: Cannot approve or reject already processed leaves (APPROVED, REJECTED, CANCELLED)")
    void testCannotProcessAlreadyProcessedLeaves() throws Exception {
        LeaveRequest approvedLeave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.APPROVED)
                .leaveType(LeaveType.CASUAL).reason("Approved")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        AdminLeaveReviewRequest reviewRequest = AdminLeaveReviewRequest.builder().comment("Re-process").build();

        // Cannot approve already approved leave
        mockMvc.perform(put("/api/admin/leaves/" + approvedLeave.getId() + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Only pending leave requests can be processed.")));

        // Cannot reject already approved leave
        mockMvc.perform(put("/api/admin/leaves/" + approvedLeave.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenAdmin1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Only pending leave requests can be processed.")));
    }

    @Test
    @DisplayName("Multi-Admin Conflict: Admin 1 approves Leave, then Admin 2 attempts rejection -> Second action rejected and Admin 1 review preserved")
    void testMultiAdminConflictResolution() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.PENDING).leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Trip")
                .build());

        // Step 1: Admin 1 approves
        AdminLeaveReviewRequest approveReq = AdminLeaveReviewRequest.builder()
                .comment("Approved by Admin 1")
                .build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/approve")
                        .header("Authorization", "Bearer " + tokenAdmin1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")));

        // Step 2: Admin 2 attempts to reject the now approved leave
        AdminLeaveReviewRequest rejectReq = AdminLeaveReviewRequest.builder()
                .comment("Rejected by Admin 2 conflicting review")
                .build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenAdmin2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Only pending leave requests can be processed.")));

        // Verify in DB that Admin 1's review is preserved intact
        LeaveRequest finalLeave = leaveRequestRepository.findById(leave.getId()).orElseThrow();
        assertEquals(LeaveStatus.APPROVED, finalLeave.getStatus());
        assertEquals("parathiragu@gmail.com", finalLeave.getReviewedBy());
        assertEquals("Approved by Admin 1", finalLeave.getAdminComment());
    }

    // ==========================================
    // EMPLOYEE PRIVILEGE ESCALATION TESTS
    // ==========================================

    @Test
    @DisplayName("Security: EMPLOYEE cannot approve or reject leaves (403 Forbidden)")
    void testEmployeeCannotApproveOrRejectLeaves() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.PENDING)
                .leaveType(LeaveType.CASUAL).reason("Trip")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        AdminLeaveReviewRequest reviewRequest = AdminLeaveReviewRequest.builder().comment("Self approve").build();

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/approve")
                        .header("Authorization", "Bearer " + tokenEmployee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/admin/leaves/" + leave.getId() + "/reject")
                        .header("Authorization", "Bearer " + tokenEmployee)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewRequest)))
                .andExpect(status().isForbidden());
    }

    // ==========================================
    // ADMIN EMPLOYEES LIST TESTS
    // ==========================================

    @Test
    @DisplayName("Admin Employees: Admin retrieves list of employees with leave metrics; admins are excluded")
    void testAdminGetsEmployeeList() throws Exception {
        leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).status(LeaveStatus.APPROVED)
                .leaveType(LeaveType.CASUAL).reason("R1")
                .startDate(LocalDate.now()).endDate(LocalDate.now()).build());

        mockMvc.perform(get("/api/admin/employees")
                        .header("Authorization", "Bearer " + tokenAdmin1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].email", is("alice@example.com")))
                .andExpect(jsonPath("$[0].name", is("Alice Employee")))
                .andExpect(jsonPath("$[0].totalRequests", is(1)))
                .andExpect(jsonPath("$[0].approved", is(1)))
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    @Test
    @DisplayName("Admin Audit: GET /api/admin/leaves/{id} provides full auditing info (reviewedBy, reviewedByName, reviewedAt, adminComment)")
    void testAdminRetrievesFullAuditInformation() throws Exception {
        LeaveRequest leave = leaveRequestRepository.save(LeaveRequest.builder()
                .employeeId(employee.getId()).employeeName(employee.getName()).employeeEmail(employee.getEmail())
                .status(LeaveStatus.APPROVED).leaveType(LeaveType.SICK)
                .startDate(LocalDate.now()).endDate(LocalDate.now()).reason("Surgery")
                .adminComment("Approved by HR")
                .reviewedAt(Instant.now())
                .reviewedBy(admin1.getEmail())
                .reviewedByName(admin1.getName())
                .build());

        mockMvc.perform(get("/api/admin/leaves/" + leave.getId())
                        .header("Authorization", "Bearer " + tokenAdmin1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(leave.getId())))
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.adminComment", is("Approved by HR")))
                .andExpect(jsonPath("$.reviewedBy", is("parathiragu@gmail.com")))
                .andExpect(jsonPath("$.reviewedByName", is("Parathi Admin")))
                .andExpect(jsonPath("$.reviewedAt", notNullValue()));
    }
}
