package com.leavemanagement.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leaveRequests")
public class LeaveRequest {

    @Id
    private String id;

    @Indexed
    private String employeeId;

    private String employeeName;

    private String employeeEmail;

    private LeaveType leaveType;

    private LocalDate startDate;

    private LocalDate endDate;

    private String reason;

    @Indexed
    @Builder.Default
    private LeaveStatus status = LeaveStatus.PENDING;

    @Indexed
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    private String adminComment;

    private Instant reviewedAt;

    private String reviewedBy;

    private String reviewedByName;
}
