package com.ryan.socialbackend.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.ryan.socialbackend.services.TwitchService;
import com.ryan.socialbackend.services.TwitchAppService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/twitch/auth")
public class TwitchAuthController {

    private final TwitchService twitchService;
    private final TwitchAppService twitchAppService;

    public TwitchAuthController(TwitchService twitchService, TwitchAppService twitchAppService) {
        this.twitchService = twitchService;
        this.twitchAppService = twitchAppService;
    }

    @GetMapping("/login")
    public Map<String, String> login() {
        return Map.of("url", twitchService.generateLoginUrl());
    }

 @GetMapping("/callback")
public ResponseEntity<?> callback(@RequestParam String code) {
    try {
        twitchService.getAccessToken(code);

        // ✔ REPLACE OLD RESPONSE WITH THIS ONE:
        return ResponseEntity.ok(
            "<html><body style='background:#1e1e1e;color:white;font-family:sans-serif;text-align:center;padding-top:50px;'>"
            + "<h2>✔ Twitch Login Successful</h2>"
            + "<p>You may now return to the application.</p>"
            + "</body></html>"
        );

    } catch (Exception e) {
        e.printStackTrace();
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
        twitchService.clearToken();  // now deletes EventSub too
        return Map.of("success", true);
    }


    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("connected", twitchService.getStoredToken() != null);
    }

    @GetMapping("/force-refresh")
    public Map<String, Object> forceRefresh() throws JsonProcessingException {
        twitchService.forceRefreshNow();
        return Map.of("status", "forced refresh completed");
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        Map<String, Object> profile = twitchService.getUserProfile();

        if (profile == null) {
            return Map.of("connected", false);
        }

        String username = (String) profile.get("username");
        String userId = twitchAppService.getUserId(username);

        return Map.of(
            "connected", true,
            "username", username,
            "userId", userId
        );
    }

    @GetMapping("/app-token")
    public Map<String, Object> getAppToken() {
        String token = twitchAppService.getAppToken();
        return Map.of("app_token", token);
    }
}
