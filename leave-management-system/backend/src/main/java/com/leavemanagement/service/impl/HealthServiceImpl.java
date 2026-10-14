package com.leavemanagement.service.impl;

import com.leavemanagement.dto.HealthResponse;
import com.leavemanagement.service.HealthService;
import org.springframework.stereotype.Service;

@Service
public class HealthServiceImpl implements HealthService {

    @Override
    public HealthResponse getHealthStatus() {
        return new HealthResponse("UP");
    }
}
