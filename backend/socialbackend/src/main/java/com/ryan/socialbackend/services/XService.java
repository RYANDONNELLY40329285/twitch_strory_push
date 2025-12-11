package com.ryan.socialbackend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.socialbackend.security.XTokenStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class XService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final XTokenStore tokenStore;

    @Value("${x.client-id}")
    private String clientId;

    @Value("${x.client-secret}")
    private String clientSecret;

    @Value("${x.redirect-uri}")
    private String redirectUri;

    @Value("${x.scope}")
    private String scope;

    public XService(XTokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    public String getStoredToken() {
        return tokenStore.getAccessToken();
    }

    public String generateLoginUrl() {
        return "https://twitter.com/i/oauth2/authorize"
                + "?response_type=code"
                + "&client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&scope=" + scope.replace(" ", "%20")
                + "&state=12345"
                + "&include_granted_scopes=true"
                + "&code_challenge=challenge"
                + "&code_challenge_method=plain";
    }

    public Map<String, Object> getAccessToken(String code)
            throws HttpClientErrorException, JsonProcessingException {

        String url = "https://api.twitter.com/2/oauth2/token";

        String basic = clientId + ":" + clientSecret;
        String base64Creds = Base64.getEncoder().encodeToString(
                basic.getBytes(StandardCharsets.UTF_8)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + base64Creds);

        String body =
                "grant_type=authorization_code" +
                "&code=" + code +
                "&redirect_uri=" + redirectUri +
                "&include_granted_scopes=true" +
                "&code_verifier=challenge";

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        Map<String, Object> tokenResponse = response.getBody();

        if (tokenResponse != null && tokenResponse.containsKey("access_token")) {
            tokenStore.save(tokenResponse.get("access_token").toString());
        }

        return tokenResponse;
    }

  
public String postTweet(String text) {
    String accessToken = tokenStore.getAccessToken();
    if (accessToken == null) return "ERROR: Not authenticated with X.";

    // -------------------------------------------------------
    // 🕒 Generate timestamp (visible in logs)
    // -------------------------------------------------------
    String timestamp = java.time.LocalDateTime.now().toString();
    System.out.println("🕒 Tweet timestamp: " + timestamp);

    // -------------------------------------------------------
    // 🔥 Invisible uniqueness: add timestamp encoded invisibly
    //    Use INVISIBLE SEPARATOR (U+2063) + timestamp characters
    // -------------------------------------------------------
    String invisibleTimestamp = "\u2063" + timestamp.replaceAll("[^0-9]", "") + "\u2063";

    // Combine user text + invisible uniqueness
    String uniqueText = text + invisibleTimestamp;

    String url = "https://api.twitter.com/2/tweets";

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<?> entity = new HttpEntity<>(Map.of("text", uniqueText), headers);

    try {
        System.out.println("🚀 Sending Tweet: " + text);
        return restTemplate.exchange(url, HttpMethod.POST, entity, String.class)
                .getBody();
    } catch (HttpClientErrorException e) {
        System.out.println("❌ Tweet failed: " + e.getResponseBodyAsString());
        throw e;
    }
}








    public void clearToken() {
        tokenStore.clear();
    }

    public Map<String, Object> getUserProfile() {
        if (tokenStore.getAccessToken() == null) {
            return Map.of("connected", false, "error", "Not authenticated");
        }

        return Map.of(
                "connected", true,
                "message", "Authenticated with X. User identity is not available on Free Tier."
        );
    }
}
