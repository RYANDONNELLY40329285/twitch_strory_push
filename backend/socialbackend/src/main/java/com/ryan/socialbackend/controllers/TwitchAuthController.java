package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.TwitchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/twitch/auth")
public class TwitchAuthController {

    private final TwitchService twitchService;

    public TwitchAuthController(TwitchService twitchService) {
        this.twitchService = twitchService;
    }

    @GetMapping("/login")
    public Map<String, String> login() {
        return Map.of("url", twitchService.generateLoginUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<?> callback(@RequestParam String code) {
        try {
            twitchService.getAccessToken(code);

            return ResponseEntity.ok(
                    "<html><body><script>window.close();</script>Login successful. You may close this window.</body></html>"
            );

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "twitch_login_failed", "message", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public Map<String, Object> profile() {
        return twitchService.getUserProfile();
    }

    @PostMapping("/logout")
    public Map<String, Object> logout() {
        twitchService.clearToken();
        return Map.of("success", true);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("connected", twitchService.getStoredToken() != null);
    }
}
