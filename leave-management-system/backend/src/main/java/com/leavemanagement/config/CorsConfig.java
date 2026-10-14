package com.leavemanagement.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    @Value("${FRONTEND_URL:${app.cors.frontend-url:}}")
    private String configuredFrontendUrl;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = new ArrayList<>();

        boolean isProduction = "prod".equalsIgnoreCase(activeProfile) || "production".equalsIgnoreCase(activeProfile);

        if (isProduction) {
            // In production, allow ONLY the trusted configured frontend URL (no wildcards, no localhost)
            if (configuredFrontendUrl != null && !configuredFrontendUrl.trim().isEmpty()) {
                String trimmedUrl = configuredFrontendUrl.trim().replaceAll("/+$", "");
                allowedOrigins.add(trimmedUrl);
            }
        } else {
            // In development / test environments, allow local development ports
            allowedOrigins.add("http://localhost:5173");
            allowedOrigins.add("http://127.0.0.1:5173");
            if (configuredFrontendUrl != null && !configuredFrontendUrl.trim().isEmpty()) {
                String trimmedUrl = configuredFrontendUrl.trim().replaceAll("/+$", "");
                if (!allowedOrigins.contains(trimmedUrl)) {
                    allowedOrigins.add(trimmedUrl);
                }
            }
        }

        if (allowedOrigins.contains("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            configuration.setAllowedOrigins(allowedOrigins);
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
