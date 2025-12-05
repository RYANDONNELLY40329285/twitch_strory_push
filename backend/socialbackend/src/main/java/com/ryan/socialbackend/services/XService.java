package com.ryan.socialbackend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    // Only the access token can be stored on Free Tier
    private String accessToken;

    @Value("${x.client-id}")
    private String clientId;

    @Value("${x.client-secret}")
    private String clientSecret;

    @Value("${x.redirect-uri}")
    private String redirectUri;

    @Value("${x.scope}")
    private String scope;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getStoredToken() {
        return accessToken;
    }

    // ---------------------------------------------------
    // 1) Build the login URL
    // ---------------------------------------------------
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

    // ---------------------------------------------------
    // 2) Exchange authorization code for access token
    // ---------------------------------------------------
    public Map<String, Object> getAccessToken(String code) throws HttpClientErrorException, JsonProcessingException {

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

        // Debug output so you can see exactly what Twitter returns
        System.out.println("TOKEN RESPONSE:");
        System.out.println(new ObjectMapper().writeValueAsString(tokenResponse));

        // Store the access token ONLY — Free Tier returns no user identity
        if (tokenResponse != null && tokenResponse.containsKey("access_token")) {
            this.accessToken = tokenResponse.get("access_token").toString();
        }

        return tokenResponse;
    }

    // ---------------------------------------------------
    // 3) Post Tweet
    // ---------------------------------------------------
    public String postTweet(String text) {

        if (accessToken == null) {
            return "ERROR: Not authenticated with X.";
        }

        String url = "https://api.twitter.com/2/tweets";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> json = Map.of("text", text);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(json, headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return response.getBody();
    }

    // ---------------------------------------------------
    // 4) Clear
    // ---------------------------------------------------
    public void clearToken() {
        this.accessToken = null;
    }

    // ---------------------------------------------------
    // 5) Profile (Free Tier cannot return identity)
    // ---------------------------------------------------
    public Map<String, Object> getUserProfile() {

        if (accessToken == null) {
            return Map.of(
                    "connected", false,
                    "error", "Not authenticated"
            );
        }

        // Free Tier does NOT provide username, name, or profile image
        return Map.of(
                "connected", true,
                "message", "Authenticated with X. User identity is not available on Free Tier."
        );
    }
}
