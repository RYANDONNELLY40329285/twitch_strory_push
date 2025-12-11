package com.ryan.socialbackend.startup;

import com.ryan.socialbackend.services.TwitchAppService;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

@Component
public class TwitchEventSubInitializer {

    private final TwitchAppService twitchAppService;
    private final RestTemplate rest = new RestTemplate();

    public TwitchEventSubInitializer(TwitchAppService twitchAppService) {
        this.twitchAppService = twitchAppService;
    }

    @PostConstruct
    public void cleanupEventSubs() {
        try {
            System.out.println("🔄 Cleaning Twitch EventSubs on startup...");

            String appToken = twitchAppService.getAppToken();
            String clientId = twitchAppService.getClientId();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Client-ID", clientId);
            headers.setBearerAuth(appToken);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<Map> response = rest.exchange(
                    "https://api.twitch.tv/helix/eventsub/subscriptions",
                    HttpMethod.GET,
                    entity,
                    Map.class
            );

            List<Map<String, Object>> subs =
                    (List<Map<String, Object>>) response.getBody().get("data");

            if (subs == null || subs.isEmpty()) {
                System.out.println("✔ No EventSubs found.");
                return;
            }

            System.out.println("🧹 Found " + subs.size() + " subscriptions. Deleting...");

            for (Map<String, Object> sub : subs) {
                String id = (String) sub.get("id");
                System.out.println("❌ Deleting EventSub ID: " + id);

                rest.exchange(
                        "https://api.twitch.tv/helix/eventsub/subscriptions?id=" + id,
                        HttpMethod.DELETE,
                        entity,
                        Void.class
                );
            }

            System.out.println("✅ All EventSubs deleted.");

        } catch (Exception e) {
            System.out.println("⚠ Error cleaning EventSubs:");
            e.printStackTrace();
        }
    }
}
