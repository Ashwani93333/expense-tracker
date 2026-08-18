package com.expensetracker.user;

import com.expensetracker.auth.dto.UserDto;
import com.expensetracker.security.UserPrincipal;
import com.expensetracker.user.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getProfile(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteAccount(
            @AuthenticationPrincipal UserPrincipal principal) {
        userService.deleteAccount(principal.getId());
        return ResponseEntity.ok(Map.of("message", "Account deactivated successfully"));
    }
}
