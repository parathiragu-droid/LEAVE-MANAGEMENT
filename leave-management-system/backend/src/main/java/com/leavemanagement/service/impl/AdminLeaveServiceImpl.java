package com.leavemanagement.service.impl;

import com.leavemanagement.dto.AdminDashboardResponse;
import com.leavemanagement.dto.AdminEmployeeResponse;
import com.leavemanagement.dto.AdminLeaveResponse;
import com.leavemanagement.dto.AdminLeaveReviewRequest;
import com.leavemanagement.exception.InvalidLeaveOperationException;
import com.leavemanagement.exception.ResourceNotFoundException;
import com.leavemanagement.model.LeaveRequest;
import com.leavemanagement.model.LeaveStatus;
import com.leavemanagement.model.Role;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.LeaveRequestRepository;
import com.leavemanagement.repository.UserRepository;
import com.leavemanagement.service.AdminLeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminLeaveServiceImpl implements AdminLeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedAdmin(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated admin user not found"));
    }

    @Override
    public AdminDashboardResponse getDashboardMetrics() {
        long totalEmployees = userRepository.countByRole(Role.EMPLOYEE);
        long totalRequests = leaveRequestRepository.count();
        long pending = leaveRequestRepository.countByStatus(LeaveStatus.PENDING);
        long approved = leaveRequestRepository.countByStatus(LeaveStatus.APPROVED);
        long rejected = leaveRequestRepository.countByStatus(LeaveStatus.REJECTED);
        long cancelled = leaveRequestRepository.countByStatus(LeaveStatus.CANCELLED);

        return AdminDashboardResponse.builder()
                .totalEmployees(totalEmployees)
                .totalRequests(totalRequests)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .cancelled(cancelled)
                .build();
    }

    @Override
    public List<AdminLeaveResponse> getAllLeaves(LeaveStatus status) {
        List<LeaveRequest> list;
        if (status != null) {
            list = leaveRequestRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = leaveRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return list.stream()
                .map(AdminLeaveResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public AdminLeaveResponse getLeaveById(String id) {
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        return AdminLeaveResponse.fromEntity(leave);
    }

    @Override
    public AdminLeaveResponse approveLeave(String id, AdminLeaveReviewRequest request, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new InvalidLeaveOperationException("Only pending leave requests can be processed.");
        }

        String comment = (request != null && request.getComment() != null && !request.getComment().trim().isEmpty())
                ? request.getComment().trim()
                : "Approved.";

        // Set review fields securely from backend authenticated context
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setAdminComment(comment);
        leave.setReviewedAt(Instant.now());
        leave.setReviewedBy(admin.getEmail());
        leave.setReviewedByName(admin.getName());
        leave.setUpdatedAt(Instant.now());

        LeaveRequest saved = leaveRequestRepository.save(leave);
        log.info("Leave request id {} APPROVED by admin {}", saved.getId(), admin.getEmail());
        return AdminLeaveResponse.fromEntity(saved);
    }

    @Override
    public AdminLeaveResponse rejectLeave(String id, AdminLeaveReviewRequest request, String adminEmail) {
        User admin = getAuthenticatedAdmin(adminEmail);
        LeaveRequest leave = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new InvalidLeaveOperationException("Only pending leave requests can be processed.");
        }

        // Rejection comment is strictly mandatory
        if (request == null || request.getComment() == null || request.getComment().trim().isEmpty()) {
            throw new InvalidLeaveOperationException("Rejection reason is required");
        }

        // Set review fields securely from backend authenticated context
        leave.setStatus(LeaveStatus.REJECTED);
        leave.setAdminComment(request.getComment().trim());
        leave.setReviewedAt(Instant.now());
        leave.setReviewedBy(admin.getEmail());
        leave.setReviewedByName(admin.getName());
        leave.setUpdatedAt(Instant.now());

        LeaveRequest saved = leaveRequestRepository.save(leave);
        log.info("Leave request id {} REJECTED by admin {}", saved.getId(), admin.getEmail());
        return AdminLeaveResponse.fromEntity(saved);
    }

    @Override
    public List<AdminEmployeeResponse> getEmployees() {
        List<User> employees = userRepository.findByRole(Role.EMPLOYEE);
        return employees.stream().map(emp -> {
            long total = leaveRequestRepository.countByEmployeeId(emp.getId());
            long pending = leaveRequestRepository.countByEmployeeIdAndStatus(emp.getId(), LeaveStatus.PENDING);
            long approved = leaveRequestRepository.countByEmployeeIdAndStatus(emp.getId(), LeaveStatus.APPROVED);
            long rejected = leaveRequestRepository.countByEmployeeIdAndStatus(emp.getId(), LeaveStatus.REJECTED);
            long cancelled = leaveRequestRepository.countByEmployeeIdAndStatus(emp.getId(), LeaveStatus.CANCELLED);

            return AdminEmployeeResponse.builder()
                    .id(emp.getId())
                    .name(emp.getName())
                    .email(emp.getEmail())
                    .totalRequests(total)
                    .pending(pending)
                    .approved(approved)
                    .rejected(rejected)
                    .cancelled(cancelled)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<AdminLeaveResponse> getEmployeeLeaves(String employeeId) {
        userRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream()
                .map(AdminLeaveResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
