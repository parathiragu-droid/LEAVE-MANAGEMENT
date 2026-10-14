package com.leavemanagement.config;

import com.leavemanagement.model.Role;
import com.leavemanagement.model.User;
import com.leavemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class AdminAccountInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin1.email:${ADMIN1_EMAIL:parathiragu@gmail.com}}")
    private String admin1Email;

    @Value("${admin1.password:${ADMIN1_PASSWORD:}}")
    private String admin1Password;

    @Value("${admin2.email:${ADMIN2_EMAIL:kayalvezhi21@gmail.com}}")
    private String admin2Email;

    @Value("${admin2.password:${ADMIN2_PASSWORD:}}")
    private String admin2Password;

    @Override
    public void run(String... args) {
        initializeAdmin("Admin 1", admin1Email, admin1Password);
        initializeAdmin("Admin 2", admin2Email, admin2Password);
    }

    private void initializeAdmin(String defaultName, String email, String password) {
        if (email == null || email.trim().isEmpty()) {
            log.info("Admin initialization for '{}': Skipped (no email configured).", defaultName);
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.getRole() != Role.ADMIN) {
                // CASE 2: Account exists with role EMPLOYEE
                // -> convert role to ADMIN
                // -> replace its password hash using the secure configured ADMIN password
                // -> never retain a password created through public employee registration for this reserved admin account
                log.info("Reconciling reserved admin account '{}': Converting role from EMPLOYEE to ADMIN.", normalizedEmail);
                existingUser.setRole(Role.ADMIN);
                if (password != null && !password.trim().isEmpty()) {
                    existingUser.setPassword(passwordEncoder.encode(password));
                }
                userRepository.save(existingUser);
                log.info("Account '{}' successfully converted to ADMIN with configured credentials.", normalizedEmail);
            } else {
                // CASE 3: Account exists with role ADMIN -> keep role ADMIN
                if (password != null && !password.trim().isEmpty() && !passwordEncoder.matches(password, existingUser.getPassword())) {
                    existingUser.setPassword(passwordEncoder.encode(password));
                    userRepository.save(existingUser);
                    log.info("Admin account '{}' credentials synchronized with configured password.", normalizedEmail);
                } else {
                    log.info("Admin account '{}' verified with ADMIN role.", normalizedEmail);
                }
            }
            return;
        }

        // CASE 1: Account does not exist -> create account -> BCrypt configured password -> role = ADMIN
        if (password == null || password.trim().isEmpty()) {
            log.warn("Cannot initialize '{}' ({}): Password environment variable is not set.", defaultName, normalizedEmail);
            return;
        }

        log.info("Creating initial admin account: '{}'", normalizedEmail);
        User newAdmin = User.builder()
                .name(defaultName)
                .email(normalizedEmail)
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .build();

        userRepository.save(newAdmin);
        log.info("Initial admin account '{}' created successfully with ADMIN role.", normalizedEmail);
    }
}
