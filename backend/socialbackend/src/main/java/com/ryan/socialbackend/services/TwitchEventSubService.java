package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
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

    // Stores the most recent EventSub subscription ID
    private String lastSubscriptionId = null;

    // Stores the app token used for create/delete
    private String appAccessToken = null;

    // ---------------------------------------------------------
    // GET APP ACCESS TOKEN (client_credentials)
    // ---------------------------------------------------------
    private String fetchAppToken() {
        if (appAccessToken != null) {
            return appAccessToken;
        }

        String tokenUrl =
                "https://id.twitch.tv/oauth2/token" +
                        "?client_id=" + clientId +
                        "&client_secret=" + clientSecret +
                        "&grant_type=client_credentials";

        Map<String, Object> token = rest.postForObject(tokenUrl, null, Map.class);

        if (token == null || token.get("access_token") == null) {
            throw new RuntimeException("Failed to retrieve app token.");
        }

        appAccessToken = (String) token.get("access_token");

        return appAccessToken;
    }

    // ---------------------------------------------------------
    // REGISTER STREAM.ONLINE EVENTSUB
    // ---------------------------------------------------------
    public void registerStreamOnlineEvent(String broadcasterUserId) {

        String appToken = fetchAppToken();

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
            Map<String, Object> response = rest.postForObject(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    entity,
                    Map.class
            );

            if (response != null && response.get("data") != null) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");

                if (!data.isEmpty()) {
                    lastSubscriptionId = (String) data.get(0).get("id");
                }
            }

            System.out.println("✅ EventSub registered for user " + broadcasterUserId);
            System.out.println("📌 Subscription ID: " + lastSubscriptionId);

        } catch (Exception e) {
            System.out.println("❌ Failed to register EventSub: " + e.getMessage());
        }
    }

    // ---------------------------------------------------------
    // DELETE EVENTSUB SUBSCRIPTION
    // ---------------------------------------------------------
    public void deleteEventSub() {

        if (lastSubscriptionId == null) {
            System.out.println("⚠ No EventSub subscription to delete.");
            return;
        }

        String appToken = fetchAppToken();

        String url = "https://api.twitch.tv/helix/eventsub/subscriptions?id=" + lastSubscriptionId;

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(appToken);
        headers.set("Client-ID", clientId);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        try {
            rest.exchange(url, HttpMethod.DELETE, entity, Map.class);
            System.out.println("🗑 Successfully deleted EventSub: " + lastSubscriptionId);
        } catch (Exception e) {
            System.out.println("❌ Failed to delete EventSub: " + e.getMessage());
        }

        lastSubscriptionId = null;
    }

    // ---------------------------------------------------------
    // DELETE ALL — called during logout
    // ---------------------------------------------------------
    public void deleteAllForUser() {
        deleteEventSub();
    }
}
