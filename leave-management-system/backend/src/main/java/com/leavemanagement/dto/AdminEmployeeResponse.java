package com.leavemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmployeeResponse {
    private String id;
    private String name;
    private String email;
    private long totalRequests;
    private long pending;
    private long approved;
    private long rejected;
    private long cancelled;
}
