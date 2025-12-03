package com.ryan.socialbackend.services;

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

    // stored user access token (in-memory for now)
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

    // 1) build the login URL
    public String generateLoginUrl() {
        return "https://twitter.com/i/oauth2/authorize"
                + "?response_type=code"
                + "&client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&scope=" + scope.replace(" ", "%20")
                + "&state=12345"
                + "&code_challenge=challenge"
                + "&code_challenge_method=plain";
    }

    // 2) exchange code for token and store it
    public Map<String, Object> getAccessToken(String code) throws HttpClientErrorException {

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
                        "&code_verifier=challenge";

        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> tokenResponse = response.getBody();

        if (tokenResponse != null && tokenResponse.containsKey("access_token")) {
            this.accessToken = tokenResponse.get("access_token").toString();
        }

        return tokenResponse;
    }

    // 3) post a tweet using the stored token
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
}
