package com.ryan.socialbackend.services;

import org.springframework.stereotype.Service;
import java.util.Map;

import com.ryan.socialbackend.security.PretweetStore;

@Service
public class PretweetService {

    private final PretweetStore store;

    public PretweetService(PretweetStore store) {
        this.store = store;
    }

    public void savePretweet(String text, String platformsJson) {
        store.save(text, platformsJson);
    }

    public Map<String, Object> loadPretweet() {
        return Map.of(
                "text", store.loadText(),
                "platforms", store.loadPlatforms()
        );
    }
}
