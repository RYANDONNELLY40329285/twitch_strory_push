package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.XService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/x/auth")
public class XAuthController {

    private final XService xService;

    public XAuthController(XService xService) {
        this.xService = xService;
    }

    @GetMapping("/login")
    public Map<String,String> login() {
        return Map.of("url", xService.generateLoginUrl());
    }

    @GetMapping("/callback")
    public Map<String,Object> callback(@RequestParam String code) {
        return xService.getAccessToken(code);
    }

    @PostMapping("/tweet")
    public Map<String,Object> tweet(
            @RequestHeader("Authorization") String bearer,
            @RequestBody Map<String,String> body
    ) {
        String token = bearer.replace("Bearer ", "");
        String text = body.get("text");

        String result = xService.postTweet(token, text);

        return Map.of("result", result);
    }
}
