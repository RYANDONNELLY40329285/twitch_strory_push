package com.ryan.socialbackend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TwitchAppService {

    @Value("${twitch.client-id}")
    private String clientId;

    @Value("${twitch.client-secret}")
    private String clientSecret;

    private final RestTemplate rest = new RestTemplate();

    public String getAppToken() {
        String url =
                "https://id.twitch.tv/oauth2/token" +
                "?client_id=" + clientId +
                "&client_secret=" + clientSecret +
                "&grant_type=client_credentials";

        Map<String, Object> response = rest.postForObject(url, null, Map.class);
        return (String) response.get("access_token");
    }

    public String getUserId(String username) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(getAppToken());
        headers.set("Client-ID", clientId);

        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://api.twitch.tv/helix/users?login=" + username;

        Map<String, Object> result = rest.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
        ).getBody();

        Map<String, Object> user = ((java.util.List<Map<String, Object>>) result.get("data")).get(0);

        return (String) user.get("id");
    }

    public String getClientId() {
    return clientId;
}


}
