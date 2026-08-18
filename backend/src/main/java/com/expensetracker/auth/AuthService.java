package com.expensetracker.auth;

import com.expensetracker.auth.dto.*;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.exception.UserAlreadyExistsException;
import com.expensetracker.model.Role;
import com.expensetracker.model.User;
import com.expensetracker.notification.NotificationSettingsService;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtUtils;
import com.expensetracker.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final NotificationSettingsService notificationSettingsService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtUtils jwtUtils, NotificationSettingsService notificationSettingsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.notificationSettingsService = notificationSettingsService;
    }

    @Transactional
    public AuthResponse signup(SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail().toLowerCase().trim())) {
            throw new UserAlreadyExistsException("User already exists with email: " + signupRequest.getEmail());
        }

        User user = User.builder()
                .fullName(signupRequest.getFullName().trim())
                .email(signupRequest.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(signupRequest.getPassword()))
                .avatarUrl(signupRequest.getAvatarUrl())
                .role(Role.ROLE_USER)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        notificationSettingsService.ensureDefaults(savedUser.getId());

        String token = jwtUtils.generateTokenFromEmail(savedUser.getEmail(), savedUser.getId());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail().toLowerCase().trim(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtUtils.generateJwtToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findByEmail(userPrincipal.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .user(UserDto.fromEntity(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new ResourceNotFoundException("No authenticated user found");
        }

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + principal.getId()));

        return UserDto.fromEntity(user);
    }
}
