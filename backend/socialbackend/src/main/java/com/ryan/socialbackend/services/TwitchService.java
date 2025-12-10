package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class TwitchService {

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    @Value("${twitch.redirect-uri}")
    private String redirectUri;

    private String accessToken;
    private Map<String, Object> cachedProfile;

    private final RestTemplate rest = new RestTemplate();

    private long expiresAt; // epoch millis when token expires
private String refreshToken;

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

    accessToken = (String) response.get("access_token");
    refreshToken = (String) response.get("refresh_token");

    Integer expiresIn = (Integer) response.get("expires_in"); // seconds
    expiresAt = System.currentTimeMillis() + (expiresIn * 1000L);

    cachedProfile = null;
}




    // --------------------------------------------------------
    // Fetch and format Twitch user profile
    // --------------------------------------------------------
   public Map<String, Object> getUserProfile() {
    if (accessToken == null) return null;

    refreshAccessTokenIfNeeded(); // <--- NEW

    if (cachedProfile != null) return cachedProfile;

    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Bearer " + accessToken);
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




    public void refreshAccessTokenIfNeeded() {
    long now = System.currentTimeMillis();

    // Only refresh if within last 60 seconds of life (OBS industry standard)
    if (accessToken == null || refreshToken == null || now < expiresAt - 60000) {
        return; // no refresh needed
    }

    String url = "https://id.twitch.tv/oauth2/token"
            + "?grant_type=refresh_token"
            + "&refresh_token=" + refreshToken
            + "&client_id=" + clientId
            + "&client_secret=" + clientSecret;

    Map<String, Object> response = rest.postForObject(url, null, Map.class);

    if (response == null || response.get("access_token") == null) {
        throw new RuntimeException("Failed to refresh Twitch access token.");
    }

    accessToken = (String) response.get("access_token");
    refreshToken = (String) response.get("refresh_token");

    Integer expiresIn = (Integer) response.get("expires_in");
    expiresAt = System.currentTimeMillis() + (expiresIn * 1000L);

    cachedProfile = null;
}


    // --------------------------------------------------------
    // Token helpers
    // --------------------------------------------------------
    public String getStoredToken() {
        return accessToken;
    }

    public void clearToken() {
        accessToken = null;
        cachedProfile = null;
    }

    

}
