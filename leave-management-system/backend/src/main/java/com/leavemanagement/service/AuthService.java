package com.leavemanagement.service;

import com.leavemanagement.dto.AuthResponse;
import com.leavemanagement.dto.LoginRequest;
import com.leavemanagement.dto.MessageResponse;
import com.leavemanagement.dto.RegisterRequest;
import com.leavemanagement.dto.UserResponse;
import org.springframework.security.core.Authentication;

public interface AuthService {
    MessageResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(Authentication authentication);
}
