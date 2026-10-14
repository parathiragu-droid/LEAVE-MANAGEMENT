package com.leavemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminLeaveReviewRequest {
    private String comment;

    // Security: Any client-injected status or reviewer fields are ignored
    private String status;
    private String reviewedBy;
    private String reviewedByName;
    private String reviewedAt;
}
