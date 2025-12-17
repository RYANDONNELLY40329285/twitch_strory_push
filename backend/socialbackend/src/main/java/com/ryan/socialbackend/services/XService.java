package com.ryan.socialbackend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.socialbackend.security.TweetHistoryStore;
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
    private final TweetHistoryStore tweetHistoryStore;

    @Value("${x.client-id}")
    private String clientId;

    @Value("${x.client-secret}")
    private String clientSecret;

    @Value("${x.redirect-uri}")
    private String redirectUri;

    @Value("${x.scope}")
    private String scope;

  
public XService(XTokenStore tokenStore, TweetHistoryStore tweetHistoryStore) {
    this.tokenStore = tokenStore;
    this.tweetHistoryStore = tweetHistoryStore;
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

    if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
        throw new RuntimeException("No access token returned from X");
    }

    // ======================================================
    // 1️⃣ SAVE ACCESS TOKEN
    // ======================================================
    String accessToken = tokenResponse.get("access_token").toString();
    tokenStore.saveAccessToken(accessToken);

    // ======================================================
    // 2️⃣ FETCH USER PROFILE (USERNAME)
    // ======================================================
    HttpHeaders profileHeaders = new HttpHeaders();
    profileHeaders.setBearerAuth(accessToken);

    ResponseEntity<Map> profileResponse =
        restTemplate.exchange(
            "https://api.twitter.com/2/users/me",
            HttpMethod.GET,
            new HttpEntity<>(profileHeaders),
            Map.class
        );

    Map<?, ?> bodyMap = profileResponse.getBody();
    if (bodyMap != null && bodyMap.containsKey("data")) {
        Map<?, ?> data = (Map<?, ?>) bodyMap.get("data");
        String username = data.get("username").toString();

        // ======================================================
        // 3️⃣ SAVE USERNAME
        // ======================================================
        tokenStore.saveUsername(username);

        System.out.println("✅ X username saved: @" + username);
    }

    return tokenResponse;
}



  

    public String postTweet(String text) {
    String accessToken = tokenStore.getAccessToken();

    if (accessToken == null) {
        tweetHistoryStore.save(
                       tokenStore.getUsername(),
            "X",
            text,
            null,
            null,
            "FAILED",
            "Not authenticated with X",
            0
        );
        return "ERROR: Not authenticated with X.";
    }

    // Add timestamp + zero-width space to avoid duplicate tweet errors
    String timestamp =
        new java.text.SimpleDateFormat("dd MMM yyyy — HH:mm")
            .format(new java.util.Date());

    String uniqueText = text + " [" + timestamp + "]\u200B";

    String url = "https://api.twitter.com/2/tweets";

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<?> entity =
        new HttpEntity<>(Map.of("text", uniqueText), headers);

    int maxRetries = 5;
    int retryDelayMs = 30_000;

    for (int attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            System.out.println("🚀 Sending Tweet (attempt " + attempt + "/" + maxRetries + ")...");

            ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            tweetHistoryStore.save(
                    tokenStore.getUsername(),
                "X",
                text,
                uniqueText,
                extractTweetId(response.getBody()),
                "SUCCESS",
                null,
                attempt
            );

            return response.getBody();
        }
        catch (HttpClientErrorException e) {
            int status = e.getStatusCode().value();

            // ----------- RATE LIMIT (429) -----------
            if (status == 429) {
                tweetHistoryStore.save(
                               tokenStore.getUsername(),
                    "X",
                    text,
                    uniqueText,
                    null,
                    "RATE_LIMITED",
                    e.getResponseBodyAsString(),
                    attempt
                );

                System.out.println("⚠ Twitter rate limit hit (429). Retrying in 30 seconds...");

                try {
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException ignored) {}

                continue;
            }

            // ----------- OTHER CLIENT ERRORS -----------
            tweetHistoryStore.save(
                           tokenStore.getUsername(),
                "X",
                text,
                uniqueText,
                null,
                "FAILED",
                e.getResponseBodyAsString(),
                attempt
            );

            System.out.println("❌ Tweet failed: " + e.getResponseBodyAsString());
            return "ERROR: " + e.getResponseBodyAsString();
        }
        catch (Exception e) {
            tweetHistoryStore.save(
                           tokenStore.getUsername(),
                "X",
                text,
                uniqueText,
                null,
                "FAILED",
                e.getMessage(),
                attempt
            );

            System.out.println("❌ Unexpected error while tweeting: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    // Should only reach here if all retries exhausted
    tweetHistoryStore.save(
                   tokenStore.getUsername(),
        "X",
        text,
        uniqueText,
        null,
        "FAILED",
        "Max retries exceeded due to rate limiting",
        maxRetries
    );

    return "ERROR: Failed after " + maxRetries + " attempts due to rate limiting.";
}



private String extractTweetId(String responseBody) {
    try {
        ObjectMapper mapper = new ObjectMapper();
        Map<?, ?> json = mapper.readValue(responseBody, Map.class);

        return ((Map<?, ?>) json.get("data")).get("id").toString();
    } catch (Exception e) {
        return null;
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


    public void setUsername(String username) {
    tokenStore.saveUsername(username);
}



}
