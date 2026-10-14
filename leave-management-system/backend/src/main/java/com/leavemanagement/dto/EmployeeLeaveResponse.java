package com.leavemanagement.dto;

import com.leavemanagement.model.LeaveRequest;
import com.leavemanagement.model.LeaveStatus;
import com.leavemanagement.model.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeLeaveResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String employeeEmail;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private LeaveStatus status;
    private Instant createdAt;
    private Instant updatedAt;
    private String adminComment;
    private Instant reviewedAt;
    private String reviewerDisplayName;

    public static EmployeeLeaveResponse fromEntity(LeaveRequest entity) {
        if (entity == null) {
            return null;
        }

        String displayName = null;
        if (entity.getReviewedAt() != null || entity.getStatus() == LeaveStatus.APPROVED || entity.getStatus() == LeaveStatus.REJECTED) {
            displayName = "Administrator";
        }

        return EmployeeLeaveResponse.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployeeName())
                .employeeEmail(entity.getEmployeeEmail())
                .leaveType(entity.getLeaveType())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .adminComment(entity.getAdminComment())
                .reviewedAt(entity.getReviewedAt())
                .reviewerDisplayName(displayName)
                .build();
    }
}
