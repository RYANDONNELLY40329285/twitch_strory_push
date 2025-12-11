package com.ryan.socialbackend.services;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Map;

@Service
public class AutoTunnelService {

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    private final RestTemplate rest = new RestTemplate();
    private final TwitchAppService twitchAppService;

    private String tunnelUrl = null;

    public AutoTunnelService(TwitchAppService twitchAppService) {
        this.twitchAppService = twitchAppService;
    }

    @PostConstruct
    public void init() {
        new Thread(this::startTunnel).start();
    }

    private void startTunnel() {
        try {
            System.out.println("🔵 Starting localhost.run tunnel...");

            ProcessBuilder pb = new ProcessBuilder("ssh", "-R", "80:localhost:8080", "nokey@localhost.run");
            pb.redirectErrorStream(true);

            Process process = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

            String line;
            while ((line = reader.readLine()) != null) {

                System.out.println("[TUNNEL] " + line);

                if (line.contains(".lhr.life")) {
                    tunnelUrl = extractUrl(line);
                    System.out.println("🌍 Public tunnel URL = https://" + tunnelUrl);

                    // Once we have the URL → register EventSub
                    registerEventSub();
                }
            }

        } catch (Exception e) {
            System.out.println("❌ Tunnel crashed: " + e.getMessage());
        }
    }

    private String extractUrl(String line) {
        String[] parts = line.split(" ");
        for (String p : parts) {
            if (p.contains(".lhr.life")) {
                return p;
            }
        }
        return null;
    }

    private void registerEventSub() {
        try {
            // Clean old EventSubs first
            cleanupEventSub();

            // Fetch logged-in Twitch user
            Map<String, Object> me = rest.getForObject("http://localhost:8080/api/twitch/auth/me", Map.class);
            if (me == null || !(boolean) me.get("connected")) {
                System.out.println("❌ No Twitch user logged in — cannot register EventSub");
                return;
            }

            String username = (String) me.get("username");
            String userId = twitchAppService.getUserId(username);

            System.out.println("🔗 Registering EventSub for " + username + " (" + userId + ")");

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
                            "callback", "https://" + tunnelUrl + "/api/webhooks/twitch/callback",
                            "secret", "local_dev_secret"
                    )
            );

            HttpEntity<?> entity = new HttpEntity<>(payload, headers);

            rest.postForObject(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    entity,
                    Map.class
            );

            System.out.println("✅ EventSub registered!");

        } catch (Exception e) {
            System.out.println("❌ Failed to register EventSub: " + e.getMessage());
        }
    }

    private void cleanupEventSub() {
        try {
            String token = twitchAppService.getAppToken();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.set("Client-ID", clientId);

            HttpEntity<?> entity = new HttpEntity<>(headers);

            Map<String, Object> response = rest.exchange(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    HttpMethod.GET,
                    entity,
                    Map.class
            ).getBody();

            if (response == null) return;

            for (Object o : (Iterable<?>) response.get("data")) {
                Map<String, Object> sub = (Map<String, Object>) o;

                String id = (String) sub.get("id");
                System.out.println("🗑 Removing old subscription: " + id);

                rest.exchange(
                        "https://api.twitch.tv/helix/eventsub/subscriptions?id=" + id,
                        HttpMethod.DELETE,
                        entity,
                        Void.class
                );
            }

            System.out.println("🧹 EventSub cleanup complete");

        } catch (Exception e) {
            System.out.println("⚠ Cleanup failed: " + e.getMessage());
        }
    }
}
