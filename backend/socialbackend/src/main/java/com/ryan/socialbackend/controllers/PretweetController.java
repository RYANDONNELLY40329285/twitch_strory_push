package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.services.PretweetService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pretweet")
public class PretweetController {

    private final PretweetService pretweetService;

    public PretweetController(PretweetService pretweetService) {
        this.pretweetService = pretweetService;
    }

    @PostMapping("/save")
   public Map<String, Object> savePretweet(@RequestBody Map<String, Object> body) {
    String text = (String) body.get("text");
    String platforms = (String) body.get("platforms");
    pretweetService.savePretweet(text, platforms);
    return Map.of("status", "saved");
}
    @GetMapping("/load")
    public Map<String, Object> loadPretweet() {
        return pretweetService.loadPretweet();
    }
}
