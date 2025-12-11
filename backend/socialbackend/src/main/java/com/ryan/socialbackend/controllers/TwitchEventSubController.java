package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.security.PretweetStore;
import com.ryan.socialbackend.services.XService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks/twitch")
public class TwitchEventSubController {

    private final PretweetStore pretweetStore;
    private final XService xService;

    public TwitchEventSubController(PretweetStore pretweetStore, XService xService) {
        this.pretweetStore = pretweetStore;
        this.xService = xService;
    }

    // ====================================================================
    //  SINGLE CALLBACK HANDLER — handles BOTH verification AND notifications
    // ====================================================================
    @PostMapping("/callback")
    public ResponseEntity<String> callback(
            @RequestHeader(value = "Twitch-Eventsub-Message-Type", required = false) String messageType,
            @RequestHeader Map<String, String> headers,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        System.out.println("==========================================");
        System.out.println("🔥 Twitch EventSub POST received");
        System.out.println("Headers: " + headers);
        System.out.println("Body: " + body);
        System.out.println("==========================================");

        // No body?
        if (body == null) {
            System.out.println("⚠ No body received — ignoring");
            return ResponseEntity.ok("ok");
        }

        // ====================================================================
        // 1️⃣ Twitch verification challenge (MANDATORY for EventSub to work)
        // ====================================================================
        if ("webhook_callback_verification".equals(messageType)) {
            String challenge = (String) body.get("challenge");
            System.out.println("🔵 Responding to Twitch challenge: " + challenge);

            // MUST return raw/plain text
            return ResponseEntity
                    .ok()
                    .header("Content-Type", "text/plain")
                    .body(challenge);
        }

        // ====================================================================
        // 2️⃣ All normal EventSub notifications
        // ====================================================================
        Map<String, Object> subscription =
                (Map<String, Object>) body.get("subscription");

        if (subscription == null) {
            System.out.println("⚠ No subscription block found — cannot parse event");
            return ResponseEntity.ok("ok");
        }

        String type = (String) subscription.get("type");
        System.out.println("📨 Event type detected: " + type);

        if ("stream.online".equals(type)) {
            handleStreamOnline();
        }

        // Always respond OK
        return ResponseEntity.ok("ok");
    }

    // ====================================================================
    // 3️⃣ Handle stream.online
    // ====================================================================
    private void handleStreamOnline() {
        System.out.println("🚀 Twitch says stream is now ONLINE");

        PretweetStore.PretweetData data = pretweetStore.load();

        System.out.println("📝 Pretweet data: enabled=" + data.enabled() +
                ", platforms=" + data.platforms() +
                ", text=" + data.text());

        if (!data.enabled()) {
            System.out.println("⚠ Pretweet is disabled — skipping");
            return;
        }

        if (!data.platforms().contains("x")) {
            System.out.println("❌ X is not selected — skipping tweet");
            return;
        }

        System.out.println("🐦 Sending Tweet NOW...");
        String result = xService.postTweet(data.text());
        System.out.println("🐦 Tweet result: " + result);
    }
}
