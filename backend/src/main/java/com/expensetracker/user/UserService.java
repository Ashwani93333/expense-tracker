package com.expensetracker.user;

import com.expensetracker.auth.dto.UserDto;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.user.dto.UpdateProfileRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public UserDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getAvatarUrl() != null) {
            user.setAvatarUrl(req.getAvatarUrl());
        }

        // Password change
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null || req.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Current password is incorrect");
            }
            user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        }

        return UserDto.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setIsActive(false);
        userRepository.save(user);
    }
}
