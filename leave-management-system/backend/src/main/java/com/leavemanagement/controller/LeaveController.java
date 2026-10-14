package com.leavemanagement.controller;

import com.leavemanagement.dto.CreateLeaveRequest;
import com.leavemanagement.dto.EmployeeLeaveResponse;
import com.leavemanagement.dto.LeaveSummaryResponse;
import com.leavemanagement.dto.UpdateLeaveRequest;
import com.leavemanagement.service.LeaveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLOYEE')")
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping
    public ResponseEntity<EmployeeLeaveResponse> createLeave(
            @Valid @RequestBody CreateLeaveRequest request,
            Principal principal
    ) {
        EmployeeLeaveResponse response = leaveService.createLeave(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<EmployeeLeaveResponse>> getMyLeaves(Principal principal) {
        List<EmployeeLeaveResponse> responses = leaveService.getMyLeaves(principal.getName());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/summary")
    public ResponseEntity<LeaveSummaryResponse> getLeaveSummary(Principal principal) {
        LeaveSummaryResponse summary = leaveService.getLeaveSummary(principal.getName());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeLeaveResponse> getLeaveById(
            @PathVariable String id,
            Principal principal
    ) {
        EmployeeLeaveResponse response = leaveService.getLeaveById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeLeaveResponse> updateLeave(
            @PathVariable String id,
            @Valid @RequestBody UpdateLeaveRequest request,
            Principal principal
    ) {
        EmployeeLeaveResponse response = leaveService.updateLeave(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/{id}/cancel", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<EmployeeLeaveResponse> cancelLeave(
            @PathVariable String id,
            Principal principal
    ) {
        EmployeeLeaveResponse response = leaveService.cancelLeave(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<EmployeeLeaveResponse> deleteLeave(
            @PathVariable String id,
            Principal principal
    ) {
        // Preferred behavior: soft cancel without deleting record
        EmployeeLeaveResponse response = leaveService.cancelLeave(id, principal.getName());
        return ResponseEntity.ok(response);
    }
}
