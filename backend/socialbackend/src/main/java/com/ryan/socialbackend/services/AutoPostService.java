package com.ryan.socialbackend.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.socialbackend.security.PretweetStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AutoPostService {

    private final PretweetStore pretweetStore;
    private final XService xService;

    public AutoPostService(PretweetStore pretweetStore, XService xService) {
        this.pretweetStore = pretweetStore;
        this.xService = xService;
    }

    public void handleLiveEvent() {
        PretweetStore.PretweetData data = pretweetStore.load();

        if (!data.enabled()) {
            System.out.println("⚠ Auto-post disabled — skipping.");
            return;
        }

        String text = data.text();

        if (text == null || text.isBlank()) {
            System.out.println("⚠ Pretweet text empty — skipping.");
            return;
        }

        // Parse JSON platform list
        List<String> platforms;
        try {
            platforms = new ObjectMapper().readValue(data.platforms(), List.class);
        } catch (Exception e) {
            System.out.println("❌ Failed to parse platforms JSON");
            return;
        }

        // ---- POST TO X (TWITTER) ----
        if (platforms.contains("x")) {
            String token = xService.getStoredToken();

            if (token == null) {
                System.out.println("⚠ Cannot post to X — not authenticated.");
            } else {
                try {
                    System.out.println("📢 Posting to X: " + text);
                    xService.postTweet(text);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        // ---- ADD FUTURE PLATFORMS HERE ----
        // instagramPoster.post(text)
        // tiktokPoster.post(text)
        // youtubePoster.post(text)
    }
}
