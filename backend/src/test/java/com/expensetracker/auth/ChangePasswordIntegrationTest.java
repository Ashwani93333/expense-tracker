package com.expensetracker.auth;

import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
class ChangePasswordIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private User user;
    private String token;
    private String oldHash;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setFullName("Password Tester");
        user.setEmail("pwchange-" + UUID.randomUUID() + "@example.com");
        user.setPasswordHash(passwordEncoder.encode("Current@123"));
        user = userRepository.save(user);
        oldHash = user.getPasswordHash();
        token = jwtUtils.generateTokenFromEmail(user.getEmail(), user.getId());
    }

    @Test
    void changePasswordSuccessfullyUpdatesHash() throws Exception {
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Current@123\",\"newPassword\":\"NewPass@456\",\"confirmPassword\":\"NewPass@456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        User updated = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updated.getPasswordHash()).isNotEqualTo(oldHash);
        assertThat(passwordEncoder.matches("NewPass@456", updated.getPasswordHash())).isTrue();
    }

    @Test
    void rejectsWrongCurrentPassword() throws Exception {
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Wrong@123\",\"newPassword\":\"NewPass@456\",\"confirmPassword\":\"NewPass@456\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsWeakNewPassword() throws Exception {
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Current@123\",\"newPassword\":\"weak\",\"confirmPassword\":\"weak\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsMismatchedConfirmation() throws Exception {
        mockMvc.perform(put("/api/auth/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Current@123\",\"newPassword\":\"NewPass@456\",\"confirmPassword\":\"Different@789\"}"))
                .andExpect(status().isBadRequest());
    }
}