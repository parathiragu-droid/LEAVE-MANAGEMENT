package com.leavemanagement.service;

import com.leavemanagement.dto.CreateLeaveRequest;
import com.leavemanagement.dto.EmployeeLeaveResponse;
import com.leavemanagement.dto.LeaveSummaryResponse;
import com.leavemanagement.dto.UpdateLeaveRequest;

import java.util.List;

public interface LeaveService {

    EmployeeLeaveResponse createLeave(CreateLeaveRequest request, String authenticatedEmail);

    List<EmployeeLeaveResponse> getMyLeaves(String authenticatedEmail);

    EmployeeLeaveResponse getLeaveById(String id, String authenticatedEmail);

    EmployeeLeaveResponse updateLeave(String id, UpdateLeaveRequest request, String authenticatedEmail);

    EmployeeLeaveResponse cancelLeave(String id, String authenticatedEmail);

    LeaveSummaryResponse getLeaveSummary(String authenticatedEmail);
}
