package com.expensetracker.system;

import com.expensetracker.system.dto.HealthStatusResponse;
import com.expensetracker.system.dto.SystemInfoResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.application.name:expense-tracker-backend}")
    private String appName;

    public SystemController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthStatusResponse> getHealth() {
        String dbStatus = "UP";
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        } catch (Exception e) {
            dbStatus = "DOWN: " + e.getMessage();
        }

        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();

        HealthStatusResponse response = HealthStatusResponse.builder()
                .status("UP")
                .database(dbStatus)
                .timestamp(OffsetDateTime.now())
                .uptimeSeconds(uptimeMs / 1000)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<SystemInfoResponse> getSystemInfo() {
        SystemInfoResponse info = SystemInfoResponse.builder()
                .applicationName(appName)
                .version("1.0.0-MVP")
                .environment(System.getProperty("spring.profiles.active", "dev"))
                .javaVersion(System.getProperty("java.version"))
                .springBootVersion("3.3.3")
                .build();

        return ResponseEntity.ok(info);
    }
}
