package com.leavemanagement.service;

import com.leavemanagement.dto.AdminDashboardResponse;
import com.leavemanagement.dto.AdminEmployeeResponse;
import com.leavemanagement.dto.AdminLeaveResponse;
import com.leavemanagement.dto.AdminLeaveReviewRequest;
import com.leavemanagement.model.LeaveStatus;

import java.util.List;

public interface AdminLeaveService {

    AdminDashboardResponse getDashboardMetrics();

    List<AdminLeaveResponse> getAllLeaves(LeaveStatus status);

    AdminLeaveResponse getLeaveById(String id);

    AdminLeaveResponse approveLeave(String id, AdminLeaveReviewRequest request, String adminEmail);

    AdminLeaveResponse rejectLeave(String id, AdminLeaveReviewRequest request, String adminEmail);

    List<AdminEmployeeResponse> getEmployees();

    List<AdminLeaveResponse> getEmployeeLeaves(String employeeId);
}
