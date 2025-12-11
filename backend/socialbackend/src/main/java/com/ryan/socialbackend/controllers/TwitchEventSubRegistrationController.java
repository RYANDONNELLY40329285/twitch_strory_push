package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.TwitchAppService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/twitch")
public class TwitchEventSubRegistrationController {

    private final TwitchAppService twitchAppService;
    private final RestTemplate rest = new RestTemplate();

    @Value("${twitch.client-id}")
    private String clientId;

    public TwitchEventSubRegistrationController(TwitchAppService appService) {
        this.twitchAppService = appService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(
            @RequestParam String username,
            @RequestParam String callbackUrl
    ) {
        String userId = twitchAppService.getUserId(username);
        String appToken = twitchAppService.getAppToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appToken);
        headers.set("Client-ID", clientId);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "type", "stream.online",
                "version", "1",
                "condition", Map.of("broadcaster_user_id", userId),
                "transport", Map.of(
                        "method", "webhook",
                        "callback", callbackUrl,
                        "secret", "my_shared_secret_123"
                )
        );

        HttpEntity<?> entity = new HttpEntity<>(payload, headers);

        Map<String, Object> response = rest.postForObject(
                "https://api.twitch.tv/helix/eventsub/subscriptions",
                entity,
                Map.class
        );

        return Map.of("status", "ok", "response", response);
    }
}
