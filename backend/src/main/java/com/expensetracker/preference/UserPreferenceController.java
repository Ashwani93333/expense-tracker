package com.expensetracker.preference;

import com.expensetracker.preference.dto.UpdateUserPreferencesRequest;
import com.expensetracker.preference.dto.UserPreferencesDto;
import com.expensetracker.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/preferences")
public class UserPreferenceController {

    private final UserPreferenceService preferenceService;

    public UserPreferenceController(UserPreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<UserPreferencesDto> getPreferences(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(preferenceService.getPreferences(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<UserPreferencesDto> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateUserPreferencesRequest request) {
        return ResponseEntity.ok(preferenceService.updatePreferences(principal.getId(), request));
    }
}