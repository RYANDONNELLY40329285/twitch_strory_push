package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TwitchEventSubService {

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    @Value("${webhook.callback-url}")
    private String callbackUrl;

    private final RestTemplate rest = new RestTemplate();

    public void registerStreamOnlineEvent(String broadcasterUserId) {

        // Step 1: Get App Token (NOT user token)
        String tokenUrl =
                "https://id.twitch.tv/oauth2/token" +
                "?client_id=" + clientId +
                "&client_secret=" + clientSecret +
                "&grant_type=client_credentials";

        Map<String, Object> token = rest.postForObject(tokenUrl, null, Map.class);
        String appToken = (String) token.get("access_token");

        // Step 2: Prepare request
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appToken);
        headers.set("Client-ID", clientId);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = Map.of(
                "type", "stream.online",
                "version", "1",
                "condition", Map.of("broadcaster_user_id", broadcasterUserId),
                "transport", Map.of(
                        "method", "webhook",
                        "callback", callbackUrl,
                        "secret", "my_shared_secret_123"
                )
        );

        HttpEntity<?> entity = new HttpEntity<>(payload, headers);

        try {
            rest.postForObject(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    entity,
                    Map.class
            );
            System.out.println("✅ EventSub registered for user " + broadcasterUserId);
        } catch (Exception e) {
            System.out.println("❌ Failed to register EventSub: " + e.getMessage());
        }
    }
}
