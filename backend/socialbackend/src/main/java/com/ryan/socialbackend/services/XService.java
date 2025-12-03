package com.ryan.socialbackend.services;

import org.springframework.stereotype.Service;

@Service
public class XService {

    // Store temporary access token in memory for now
    private String accessToken;

    public String buildAuthUrl() {
        // TEMPORARY HARDCODED VALUES
        String clientId = "YOUR_CLIENT_ID";
        String redirectUri = "http://localhost:8080/auth/x/callback";

        return "https://twitter.com/i/oauth2/authorize"
                + "?response_type=code"
                + "&client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&scope=tweet.read%20tweet.write%20users.read%20offline.access"
                + "&state=1234"
                + "&code_challenge=challenge"
                + "&code_challenge_method=plain";
    }

    public String exchangeCodeForToken(String code) {
        // For now, return a fake access token
        // Later we will call Twitter API here.
        this.accessToken = "test-token-" + code;
        return this.accessToken;
    }

    public boolean isLinked() {
        return this.accessToken != null;
    }

    public String createTweet(String text) {
        if (!isLinked()) {
            return "ERROR: Not linked to X yet";
        }

        // Later call Twitter API here
        return "Tweet created: " + text;
    }
}
