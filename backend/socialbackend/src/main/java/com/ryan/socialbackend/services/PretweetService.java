package com.ryan.socialbackend.services;

import org.springframework.stereotype.Service;
import com.ryan.socialbackend.security.PretweetStore;

@Service
public class PretweetService {

    private final PretweetStore store;

    public PretweetService(PretweetStore store) {
        this.store = store;
    }

    public void savePretweet(String text, String platforms, boolean enabled) {
        store.save(text, platforms, enabled);
    }

    public PretweetStore.PretweetData loadPretweet() {
        return store.load();
    }

    public void setEnabled(boolean enabled) {
        store.setEnabled(enabled);
    }
}
