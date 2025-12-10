package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;

@Component
public class TwitchTokenStore {

    private final EncryptionService encryption;
    private String encryptedAccessToken;
    private String encryptedRefreshToken;

    public TwitchTokenStore(EncryptionService encryption) {
        this.encryption = encryption;
    }

    public void storeTokens(String accessToken, String refreshToken) {
        encryptedAccessToken = accessToken == null ? null : encryption.encrypt(accessToken);
        encryptedRefreshToken = refreshToken == null ? null : encryption.encrypt(refreshToken);
    }

    public String getAccessToken() {
        return encryptedAccessToken == null ? null : encryption.decrypt(encryptedAccessToken);
    }

    public String getRefreshToken() {
        return encryptedRefreshToken == null ? null : encryption.decrypt(encryptedRefreshToken);
    }

    public void clear() {
        encryptedAccessToken = null;
        encryptedRefreshToken = null;
    }
}
