package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service
public class XService {

    @Value("${x.client-id}")
    private String clientId;

    @Value("${x.client-secret}")
    private String clientSecret;

    @Value("${x.redirect-uri}")
    private String redirectUri;

    @Value("${x.scope}")
    private String scope;

    private final RestTemplate restTemplate = new RestTemplate();

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

    public Map getAccessToken(String code) {

        String url = "https://api.twitter.com/2/oauth2/token";

        // Basic Auth header (MUST BE BASE64)
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

        return response.getBody();
    }

    public String postTweet(String bearerToken, String text) {

        String url = "https://api.twitter.com/2/tweets";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(bearerToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> json = Map.of("text", text);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(json, headers);

        ResponseEntity<String> response =
                restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return response.getBody();
    }
}
