package com.leavemanagement.repository;

import com.leavemanagement.model.LeaveRequest;
import com.leavemanagement.model.LeaveStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveRequestRepository extends MongoRepository<LeaveRequest, String> {

    List<LeaveRequest> findByEmployeeIdOrderByCreatedAtDesc(String employeeId);

    Optional<LeaveRequest> findByIdAndEmployeeId(String id, String employeeId);

    long countByEmployeeId(String employeeId);

    long countByEmployeeIdAndStatus(String employeeId, LeaveStatus status);

    List<LeaveRequest> findAllByOrderByCreatedAtDesc();

    List<LeaveRequest> findByStatusOrderByCreatedAtDesc(LeaveStatus status);

    long countByStatus(LeaveStatus status);
}
