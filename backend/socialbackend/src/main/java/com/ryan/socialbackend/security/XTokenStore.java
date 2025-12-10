package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;

@Component
public class XTokenStore {

    private final EncryptionService encryption;
    private String encryptedAccessToken;

    public XTokenStore(EncryptionService encryption) {
        this.encryption = encryption;
    }

    public void storeAccessToken(String accessToken) {
        encryptedAccessToken = accessToken == null
                ? null
                : encryption.encrypt(accessToken);
    }

    public String getAccessToken() {
        return encryptedAccessToken == null
                ? null
                : encryption.decrypt(encryptedAccessToken);
    }

    public void clear() {
        encryptedAccessToken = null;
    }
}
