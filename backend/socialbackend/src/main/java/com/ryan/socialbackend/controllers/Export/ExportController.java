package com.ryan.socialbackend.controllers.Export;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exports")
@CrossOrigin(origins = "http://localhost:5173")
public class ExportController {

  @PostMapping("/tweet-history")
public ResponseEntity<?> exportTweetHistory() {
    try {
        ProcessBuilder pb = new ProcessBuilder(
            "ruby",
            "../scripts/export_tweet_history_xlsx.rb"
        );

        pb.directory(new File("."));
        pb.redirectErrorStream(true);

        Process process = pb.start();
        process.waitFor();

        File file = new File("tweet_history.xlsx");

        if (!file.exists()) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Export file not found"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Tweet history exported",
            "path", file.getAbsolutePath()
        ));

    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of(
            "success", false,
            "message", e.getMessage()
        ));
    }
}



}
