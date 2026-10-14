package com.leavemanagement.service.impl;

import com.leavemanagement.dto.CreateLeaveRequest;
import com.leavemanagement.dto.EmployeeLeaveResponse;
import com.leavemanagement.dto.LeaveSummaryResponse;
import com.leavemanagement.dto.UpdateLeaveRequest;
import com.leavemanagement.exception.InvalidLeaveOperationException;
import com.leavemanagement.exception.ResourceNotFoundException;
import com.leavemanagement.model.LeaveRequest;
import com.leavemanagement.model.LeaveStatus;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.LeaveRequestRepository;
import com.leavemanagement.repository.UserRepository;
import com.leavemanagement.service.LeaveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveServiceImpl implements LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    @Override
    public EmployeeLeaveResponse createLeave(CreateLeaveRequest request, String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidLeaveOperationException("End date cannot be before start date");
        }

        // Never trust client inputs for employeeId, employeeName, employeeEmail, or status.
        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employeeId(user.getId())
                .employeeName(user.getName())
                .employeeEmail(user.getEmail())
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(request.getReason().trim())
                .status(LeaveStatus.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request created successfully with id {} for employee {}", saved.getId(), user.getEmail());
        return EmployeeLeaveResponse.fromEntity(saved);
    }

    @Override
    public List<EmployeeLeaveResponse> getMyLeaves(String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        return leaveRequestRepository.findByEmployeeIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(EmployeeLeaveResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public EmployeeLeaveResponse getLeaveById(String id, String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndEmployeeId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        return EmployeeLeaveResponse.fromEntity(leaveRequest);
    }

    @Override
    public EmployeeLeaveResponse updateLeave(String id, UpdateLeaveRequest request, String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndEmployeeId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new InvalidLeaveOperationException("Only pending leave requests can be updated");
        }

        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new InvalidLeaveOperationException("End date cannot be before start date");
        }

        // Only allow updating editable fields; never overwrite user identity, review fields, or status
        leaveRequest.setLeaveType(request.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setReason(request.getReason().trim());
        leaveRequest.setUpdatedAt(Instant.now());

        LeaveRequest updated = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request id {} updated by employee {}", updated.getId(), user.getEmail());
        return EmployeeLeaveResponse.fromEntity(updated);
    }

    @Override
    public EmployeeLeaveResponse cancelLeave(String id, String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        LeaveRequest leaveRequest = leaveRequestRepository.findByIdAndEmployeeId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw new InvalidLeaveOperationException("Only pending leave requests can be cancelled");
        }

        // Soft cancel without physically deleting from MongoDB
        leaveRequest.setStatus(LeaveStatus.CANCELLED);
        leaveRequest.setUpdatedAt(Instant.now());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("Leave request id {} cancelled by employee {}", saved.getId(), user.getEmail());
        return EmployeeLeaveResponse.fromEntity(saved);
    }

    @Override
    public LeaveSummaryResponse getLeaveSummary(String authenticatedEmail) {
        User user = getAuthenticatedUser(authenticatedEmail);
        String employeeId = user.getId();

        return LeaveSummaryResponse.builder()
                .total(leaveRequestRepository.countByEmployeeId(employeeId))
                .pending(leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.PENDING))
                .approved(leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.APPROVED))
                .rejected(leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.REJECTED))
                .cancelled(leaveRequestRepository.countByEmployeeIdAndStatus(employeeId, LeaveStatus.CANCELLED))
                .build();
    }
}
