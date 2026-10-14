package com.leavemanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveSummaryResponse {
    private long total;
    private long pending;
    private long approved;
    private long rejected;
    private long cancelled;
}
