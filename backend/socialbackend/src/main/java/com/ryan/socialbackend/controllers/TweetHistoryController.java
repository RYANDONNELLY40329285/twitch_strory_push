package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.security.TweetHistoryStore;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tweets")
@CrossOrigin // allow frontend access
public class TweetHistoryController {

    private final TweetHistoryStore tweetHistoryStore;

    public TweetHistoryController(TweetHistoryStore tweetHistoryStore) {
        this.tweetHistoryStore = tweetHistoryStore;
    }

@GetMapping("/history")
public List<Map<String, Object>> getHistory(
    @RequestParam(defaultValue = "20") int limit,
    @RequestParam(defaultValue = "0") int offset
) {
    return tweetHistoryStore.getHistory(limit, offset);
}

}
