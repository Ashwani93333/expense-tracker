package com.expensetracker.notification;

import com.expensetracker.notification.dto.NotificationSettingsDto;
import com.expensetracker.notification.dto.UpdateNotificationSettingsRequest;
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
@RequestMapping("/api/users/me/notification-settings")
public class NotificationSettingsController {

    private final NotificationSettingsService settingsService;

    public NotificationSettingsController(NotificationSettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<NotificationSettingsDto> getSettings(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(settingsService.getSettings(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<NotificationSettingsDto> updateSettings(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateNotificationSettingsRequest request) {
        return ResponseEntity.ok(settingsService.updateSettings(principal.getId(), request));
    }
}
