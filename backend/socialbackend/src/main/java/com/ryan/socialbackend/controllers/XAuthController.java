package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.XService;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/x")
public class XAuthController {

    private final XService xService;

    public XAuthController(XService xService) {
        this.xService = xService;
    }

    @GetMapping("/start")
    public String startAuth() {
        return xService.buildAuthUrl();
    }

    @GetMapping("/callback")
    public String callback(@RequestParam("code") String code) {
        String token = xService.exchangeCodeForToken(code);
        return "Linked to X! Token: " + token;
    }

    @GetMapping("/status")
    public boolean status() {
        return xService.isLinked();
    }

    @PostMapping("/tweet")
    public String tweet(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        return xService.createTweet(text);
    }
}
