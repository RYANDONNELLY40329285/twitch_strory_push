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

    // ----------------------------------------------------
    // 1️⃣ Twitch GET challenge (used by some tools / tests)
    // ----------------------------------------------------
    @GetMapping("/callback")
    public ResponseEntity<String> verifyGet(
            @RequestParam(name = "hub.challenge", required = false) String challenge) {

        System.out.println("🔔 GET verification received: " + challenge);

        if (challenge != null) {
            return ResponseEntity.ok(challenge);
        }

        return ResponseEntity.ok("ok");
    }

    // ----------------------------------------------------
    // 2️⃣ Twitch POST EventSub notification
    // ----------------------------------------------------
    @PostMapping("/callback")
    public ResponseEntity<String> callback(
            @RequestHeader Map<String, String> headers,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        System.out.println("==========================================");
        System.out.println("🔥 Twitch EventSub POST received");
        System.out.println("Headers: " + headers);
        System.out.println("Body: " + body);
        System.out.println("==========================================");

        if (body == null) {
            System.out.println("⚠ No body received — ignoring");
            return ResponseEntity.ok("ok");
        }

        // ------------------------------------------------
        // Twitch challenge verification (POST version)
        // ------------------------------------------------
        if (body.containsKey("challenge")) {
            String challenge = body.get("challenge").toString();
            System.out.println("🔵 Responding to Twitch challenge: " + challenge);
            return ResponseEntity.ok(challenge);
        }

        // ------------------------------------------------
        // Handle EventSub notification
        // ------------------------------------------------
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

        return ResponseEntity.ok("ok");
    }

    // ----------------------------------------------------
    // 3️⃣ On stream.online → send tweet if allowed
    // ----------------------------------------------------
    private void handleStreamOnline() {
        System.out.println("🚀 Twitch says stream is now ONLINE");

        PretweetStore.PretweetData data = pretweetStore.load();

        System.out.println("📝 Pretweet data: enabled=" + data.enabled() +
                ", platforms=" + data.platforms() +
                ", text=" + data.text());

        // Disabled toggle
        if (!data.enabled()) {
            System.out.println("⚠ Pretweet is disabled — skipping");
            return;
        }

        // X platform not selected
        if (!data.platforms().contains("x")) {
            System.out.println("❌ X is not selected — skipping tweet");
            return;
        }

        // Send Tweet
        System.out.println("🐦 Sending Tweet NOW...");
        String result = xService.postTweet(data.text());
        System.out.println("🐦 Tweet result: " + result);
    }
}
