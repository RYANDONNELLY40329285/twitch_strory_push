package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.XService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api/x/auth")
public class XAuthController {

    private final XService xService;

    public XAuthController(XService xService) {
        this.xService = xService;
    }

    @GetMapping("/login")
    public Map<String, String> login() {
        return Map.of("url", xService.generateLoginUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<?> callback(@RequestParam String code) {
        try {
            xService.getAccessToken(code);

            return ResponseEntity.ok(
                    "<html><body><script>window.close();</script>Login successful. You may close this window.</body></html>"
            );

        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode())
                    .body(Map.of(
                            "error", "twitter_token_error",
                            "status", e.getStatusCode().value(),
                            "body", e.getResponseBodyAsString()
                    ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "server_error",
                            "message", e.getMessage()
                    ));
        }
    }

    @GetMapping("/profile")
    public Map<String, Object> profile() {
        return xService.getUserProfile();
    }

    @PostMapping("/tweet")
    public Map<String, Object> tweet(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        return Map.of("result", xService.postTweet(text));
    }

    @RequestMapping(value = "/logout", method = {RequestMethod.GET, RequestMethod.POST})
    public Map<String, Object> logout() {
        xService.clearToken();
        return Map.of("success", true);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("connected", xService.getStoredToken() != null);
    }
}
