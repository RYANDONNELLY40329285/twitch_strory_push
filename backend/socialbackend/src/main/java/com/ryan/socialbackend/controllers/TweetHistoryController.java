package com.ryan.socialbackend.controllers;

import com.ryan.socialbackend.security.TweetHistoryStore;
import org.springframework.web.bind.annotation.*;
import com.ryan.socialbackend.security.XTokenStore;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/tweets")
@CrossOrigin // allow frontend access
public class TweetHistoryController {

    private final TweetHistoryStore tweetHistoryStore;
        private final XTokenStore tokenStore;

     public TweetHistoryController(
            TweetHistoryStore tweetHistoryStore,
            XTokenStore tokenStore
    ) {
        this.tweetHistoryStore = tweetHistoryStore;
        this.tokenStore = tokenStore;
    }

@GetMapping("/history")
public List<Map<String, Object>> history(
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(defaultValue = "0") int offset
) {
    String username = tokenStore.getUsername();

    if (username == null) {
        return List.of(); // logged out → no data
    }

    return tweetHistoryStore.getHistoryForUser(username, limit, offset);
}

}
