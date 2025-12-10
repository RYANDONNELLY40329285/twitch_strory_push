
package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.PretweetService;
import com.ryan.socialbackend.security.PretweetStore;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pretweet")
public class PretweetController {

    private final PretweetService service;

    public PretweetController(PretweetService service) {
        this.service = service;
    }

    @PostMapping("/save")
    public Map<String, Object> save(@RequestBody Map<String, Object> body) {

        String text = (String) body.get("text");
        String platforms = (String) body.get("platforms");
        boolean enabled = (Boolean) body.get("enabled");

        service.savePretweet(text, platforms, enabled);

        return Map.of("status", "saved");
    }

    @GetMapping("/load")
    public Map<String, Object> load() {
        PretweetStore.PretweetData data = service.loadPretweet();

        return Map.of(
                "text", data.text(),
                "platforms", data.platforms(),
                "enabled", data.enabled()
        );
    }

    @PostMapping("/enabled")
    public Map<String, Object> setEnabled(@RequestBody Map<String, Object> body) {
        boolean enabled = (Boolean) body.get("enabled");

        service.setEnabled(enabled);

        return Map.of("status", "updated", "enabled", enabled);
    }
}
