package com.expensetracker.auth;

import com.expensetracker.auth.dto.AuthResponse;
import com.expensetracker.auth.dto.LoginRequest;
import com.expensetracker.auth.dto.SignupRequest;
import com.expensetracker.auth.dto.UserDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @Test
    public void testSignupSuccess() throws Exception {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setFullName("John Doe");
        signupRequest.setEmail("john@example.com");
        signupRequest.setPassword("password123");

        UserDto userDto = UserDto.builder()
                .id(UUID.randomUUID())
                .fullName("John Doe")
                .email("john@example.com")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("mock-jwt-token")
                .tokenType("Bearer")
                .user(userDto)
                .build();

        when(authService.signup(any(SignupRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(signupRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"));
    }

    @Test
    public void testLoginSuccess() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("password123");

        UserDto userDto = UserDto.builder()
                .id(UUID.randomUUID())
                .fullName("John Doe")
                .email("john@example.com")
                .build();

        AuthResponse authResponse = AuthResponse.builder()
                .token("mock-jwt-token")
                .tokenType("Bearer")
                .user(userDto)
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("john@example.com"));
    }

    @Test
    public void testSystemHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/system/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
