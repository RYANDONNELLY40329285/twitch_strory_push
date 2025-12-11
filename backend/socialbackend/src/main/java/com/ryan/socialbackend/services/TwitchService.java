package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.socialbackend.security.TwitchTokenStore;

import java.util.List;
import java.util.Map;

@Service
public class TwitchService {
    private final TwitchEventSubService eventSubService;

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    @Value("${twitch.redirect-uri}")
    private String redirectUri;

    private final RestTemplate rest = new RestTemplate();
    private final TwitchTokenStore tokenStore;

    private Map<String, Object> cachedProfile;

 public TwitchService(TwitchTokenStore tokenStore, TwitchEventSubService eventSubService) {
    this.tokenStore = tokenStore;
    this.eventSubService = eventSubService;
}

    // --------------------------------------------------------
    // Generate Twitch Login URL
    // --------------------------------------------------------
    public String generateLoginUrl() {
        return "https://id.twitch.tv/oauth2/authorize"
                + "?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&response_type=code"
                + "&scope=user:read:email";
    }

    // --------------------------------------------------------
    // Exchange code for access token
    // --------------------------------------------------------
    public void getAccessToken(String code) {

        String url = "https://id.twitch.tv/oauth2/token"
                + "?client_id=" + clientId
                + "&client_secret=" + clientSecret
                + "&code=" + code
                + "&grant_type=authorization_code"
                + "&redirect_uri=" + redirectUri;

        Map<String, Object> response = rest.postForObject(url, null, Map.class);

        if (response == null || response.get("access_token") == null) {
            throw new RuntimeException("Failed to get Twitch access token.");
        }

        String accessToken = (String) response.get("access_token");
        String refreshToken = (String) response.get("refresh_token");
        Integer expiresIn = (Integer) response.get("expires_in");

        long expiresAt = System.currentTimeMillis() + (expiresIn * 1000L);

        // 🔐 Save encrypted tokens + expiry in SQLite
        tokenStore.save(accessToken, refreshToken, expiresAt);

        
        cachedProfile = null;

        // Auto register EventSub for this user
Map<String, Object> profile = getUserProfile();
String username = (String) profile.get("username");

// Get user ID from Helix
String userId = fetchUserId(username);

// Register stream.online event
eventSubService.registerStreamOnlineEvent(userId);



    }

    // --------------------------------------------------------
    // Auto-refresh token
    // --------------------------------------------------------
    public void refreshAccessTokenIfNeeded() {

        String accessToken = tokenStore.getAccessToken();
        String refreshToken = tokenStore.getRefreshToken();
        Long expiresAt = tokenStore.getExpiresAt();

        if (accessToken == null || refreshToken == null || expiresAt == null) return;

        long now = System.currentTimeMillis();

        if (now < expiresAt - 60000) return; // not time to refresh yet

        String url = "https://id.twitch.tv/oauth2/token"
                + "?grant_type=refresh_token"
                + "&refresh_token=" + refreshToken
                + "&client_id=" + clientId
                + "&client_secret=" + clientSecret;

        Map<String, Object> response = rest.postForObject(url, null, Map.class);

        // If refresh fails, delete everything and force relogin
        if (response == null || response.get("access_token") == null) {
            tokenStore.clear();
            cachedProfile = null;
            return;
        }

        String newAccess = (String) response.get("access_token");
        String newRefresh = (String) response.get("refresh_token");
        int expiresIn = (Integer) response.get("expires_in");

        long newExpiresAt = System.currentTimeMillis() + (expiresIn * 1000L);

        // 🔐 Save new encrypted tokens
        tokenStore.save(newAccess, newRefresh, newExpiresAt);

        cachedProfile = null;
    }

    // --------------------------------------------------------
    // Fetch Twitch profile
    // --------------------------------------------------------
    public Map<String, Object> getUserProfile() {

        String accessToken = tokenStore.getAccessToken();
        if (accessToken == null) return null;

        refreshAccessTokenIfNeeded();

        if (cachedProfile != null) return cachedProfile;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + tokenStore.getAccessToken());
        headers.set("Client-Id", clientId);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://api.twitch.tv/helix/users";

        Map<String, Object> result = rest.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
        ).getBody();

        if (result == null || result.get("data") == null) {
            throw new RuntimeException("Failed to fetch Twitch profile.");
        }

        Map<String, Object> user = ((List<Map<String, Object>>) result.get("data")).get(0);

        cachedProfile = Map.of(
                "username", user.get("login"),
                "name", user.get("display_name"),
                "profile_image_url", user.get("profile_image_url")
        );

        return cachedProfile;
    }

    // --------------------------------------------------------
    // Token helpers
    // --------------------------------------------------------
    public String getStoredToken() {
        return tokenStore.getAccessToken();
    }

    public void clearToken() {
        tokenStore.clear();
        cachedProfile = null;
    }


public void forceRefreshNow() {

    String refreshToken = tokenStore.getRefreshToken();
    if (refreshToken == null) {
        throw new RuntimeException("No refresh token stored — cannot refresh.");
    }

    System.out.println("🔄 FORCING TWITCH REFRESH...");

    // Correct Twitch refresh token endpoint (POST with form body)
    String url = "https://id.twitch.tv/oauth2/token";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    // Correct refresh parameters (Twitch does NOT accept refresh via query string anymore)
    String body =
            "grant_type=refresh_token" +
            "&refresh_token=" + refreshToken +
            "&client_id=" + clientId +
            "&client_secret=" + clientSecret;

    HttpEntity<String> entity = new HttpEntity<>(body, headers);

    Map<String, Object> response = rest.postForObject(url, entity, Map.class);

    // Log response safely (no checked exceptions)
    try {
        System.out.println("REFRESH RESPONSE:");
        System.out.println(new ObjectMapper().writeValueAsString(response));
    } catch (Exception e) {
        System.out.println("Failed to print refresh response JSON: " + e.getMessage());
    }

    // If refresh fails → delete saved tokens
    if (response == null || response.get("access_token") == null) {
        tokenStore.clear();
        cachedProfile = null;
        throw new RuntimeException("Refresh failed — tokens deleted.");
    }

    // Extract new tokens
    String newAccess = (String) response.get("access_token");
    String newRefresh = (String) response.get("refresh_token"); // may be null (Twitch often does NOT rotate refresh tokens)
    Integer expiresIn = (Integer) response.get("expires_in");

    long newExpiresAt = System.currentTimeMillis() + (expiresIn * 1000L);

    // Save encrypted tokens + new expiry
    tokenStore.save(newAccess, newRefresh, newExpiresAt);

    System.out.println("✔ Refresh complete — new access token saved.");
}


public String fetchUserId(String username) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(tokenStore.getAccessToken());
    headers.set("Client-Id", clientId);

    HttpEntity<?> entity = new HttpEntity<>(headers);

    String url = "https://api.twitch.tv/helix/users?login=" + username;

    Map<String, Object> response = rest.exchange(
            url,
            HttpMethod.GET,
            entity,
            Map.class
    ).getBody();

    Map<String, Object> user = ((List<Map<String, Object>>) response.get("data")).get(0);
    return (String) user.get("id");
}

  

}
