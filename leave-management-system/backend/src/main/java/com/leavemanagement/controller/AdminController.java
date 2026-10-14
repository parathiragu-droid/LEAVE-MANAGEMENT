package com.leavemanagement.controller;

import com.leavemanagement.dto.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @GetMapping("/overview")
    public ResponseEntity<MessageResponse> getAdminOverview() {
        return ResponseEntity.ok(new MessageResponse("Admin access granted"));
    }
}
