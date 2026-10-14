package com.leavemanagement.controller;

import com.leavemanagement.dto.AdminDashboardResponse;
import com.leavemanagement.dto.AdminEmployeeResponse;
import com.leavemanagement.dto.AdminLeaveResponse;
import com.leavemanagement.dto.AdminLeaveReviewRequest;
import com.leavemanagement.model.LeaveStatus;
import com.leavemanagement.service.AdminLeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLeaveController {

    private final AdminLeaveService adminLeaveService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboardMetrics() {
        AdminDashboardResponse response = adminLeaveService.getDashboardMetrics();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/leaves")
    public ResponseEntity<List<AdminLeaveResponse>> getAllLeaves(
            @RequestParam(required = false) LeaveStatus status
    ) {
        List<AdminLeaveResponse> leaves = adminLeaveService.getAllLeaves(status);
        return ResponseEntity.ok(leaves);
    }

    @GetMapping("/leaves/{id}")
    public ResponseEntity<AdminLeaveResponse> getLeaveById(@PathVariable String id) {
        AdminLeaveResponse response = adminLeaveService.getLeaveById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/leaves/{id}/approve")
    public ResponseEntity<AdminLeaveResponse> approveLeave(
            @PathVariable String id,
            @RequestBody(required = false) AdminLeaveReviewRequest request,
            Principal principal
    ) {
        AdminLeaveResponse response = adminLeaveService.approveLeave(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/leaves/{id}/reject")
    public ResponseEntity<AdminLeaveResponse> rejectLeave(
            @PathVariable String id,
            @RequestBody(required = false) AdminLeaveReviewRequest request,
            Principal principal
    ) {
        AdminLeaveResponse response = adminLeaveService.rejectLeave(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employees")
    public ResponseEntity<List<AdminEmployeeResponse>> getEmployees() {
        List<AdminEmployeeResponse> employees = adminLeaveService.getEmployees();
        return ResponseEntity.ok(employees);
    }

    @GetMapping("/employees/{id}/leaves")
    public ResponseEntity<List<AdminLeaveResponse>> getEmployeeLeaves(@PathVariable String id) {
        List<AdminLeaveResponse> leaves = adminLeaveService.getEmployeeLeaves(id);
        return ResponseEntity.ok(leaves);
    }
}
