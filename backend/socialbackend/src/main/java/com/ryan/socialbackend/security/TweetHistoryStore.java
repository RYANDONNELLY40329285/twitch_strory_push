package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class TweetHistoryStore {

    private static final String DB_URL = "jdbc:sqlite:data/tokens.db";

    public TweetHistoryStore() {
        init();
    }

public List<Map<String, Object>> getHistory(int limit, int offset) {
    try (Connection conn = DriverManager.getConnection(DB_URL)) {

        PreparedStatement ps = conn.prepareStatement("""
            SELECT id, platform, text, sent_text, tweet_id,
                   status, error_message, attempt_count, created_at
            FROM tweet_history
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """);

        ps.setInt(1, limit);
        ps.setInt(2, offset);

        ResultSet rs = ps.executeQuery();
        List<Map<String, Object>> results = new ArrayList<>();

        while (rs.next()) {
            Map<String, Object> row = new HashMap<>();

            row.put("id", rs.getLong("id"));
            row.put("platform", rs.getString("platform"));
            row.put("text", rs.getString("text"));
            row.put("sentText", rs.getString("sent_text"));
            row.put("tweetId", rs.getString("tweet_id"));
            row.put("status", rs.getString("status"));
            row.put("errorMessage", rs.getString("error_message"));
            row.put("attemptCount", rs.getInt("attempt_count"));
            row.put("createdAt", rs.getLong("created_at"));

            results.add(row);
        }

        return results;

    } catch (SQLException e) {
        throw new RuntimeException("Failed to load tweet history", e);
    }
}






    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS tweet_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    platform TEXT NOT NULL,
                    text TEXT NOT NULL,
                    sent_text TEXT,
                    tweet_id TEXT,
                    status TEXT NOT NULL,
                    error_message TEXT,
                    attempt_count INTEGER DEFAULT 1,
                    created_at INTEGER
                )
            """);

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize tweet_history table", e);
        }
    }

    public void save(
        String platform,
        String text,
        String sentText,
        String tweetId,
        String status,
        String errorMessage,
        int attemptCount
    ) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO tweet_history
                (platform, text, sent_text, tweet_id, status, error_message, attempt_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """);

            ps.setString(1, platform);
            ps.setString(2, text);
            ps.setString(3, sentText);
            ps.setString(4, tweetId);
            ps.setString(5, status);
            ps.setString(6, errorMessage);
            ps.setInt(7, attemptCount);
            ps.setLong(8, System.currentTimeMillis());

            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to save tweet history", e);
        }
    }
}
