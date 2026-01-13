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

    // ======================================================
    // LOAD HISTORY FOR A SPECIFIC USER (PAGINATED)
    // ======================================================
    public List<Map<String, Object>> getHistoryForUser(
        String username,
        int limit,
        int offset
) {
    try (Connection conn = DriverManager.getConnection(DB_URL)) {

        PreparedStatement ps = conn.prepareStatement("""
            SELECT id, platform, text, sent_text, tweet_id,
                   status, error_message, attempt_count, created_at
            FROM tweet_history
            WHERE username = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """);

        ps.setString(1, username);
        ps.setInt(2, limit);
        ps.setInt(3, offset);

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
        throw new RuntimeException(e);
    }
}



    // ======================================================
    // SAVE HISTORY ENTRY (USER-AWARE)
    // ======================================================
    public void save(
        String username,
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
                (username, platform, text, sent_text, tweet_id,
                 status, error_message, attempt_count, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """);

            ps.setString(1, username);
            ps.setString(2, platform);
            ps.setString(3, text);
            ps.setString(4, sentText);
            ps.setString(5, tweetId);
            ps.setString(6, status);
            ps.setString(7, errorMessage);
            ps.setInt(8, attemptCount);
            ps.setLong(9, System.currentTimeMillis());

            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to save tweet history", e);
        }
    }

    // ======================================================
    // INIT / MIGRATION SAFE SCHEMA SETUP
    // ======================================================
    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            // Base table
            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS tweet_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
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

            // Ensure username column exists (safe migration)
            ensureColumnExists(conn, "tweet_history", "username", "TEXT");

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize tweet_history table", e);
        }
    }

    // ======================================================
    // SQLITE COLUMN CHECK HELPER
    // ======================================================
    private void ensureColumnExists(
        Connection conn,
        String table,
        String column,
        String type
    ) throws SQLException {

        ResultSet rs = conn.createStatement()
            .executeQuery("PRAGMA table_info(" + table + ")");

        while (rs.next()) {
            if (column.equalsIgnoreCase(rs.getString("name"))) {
                return; // column already exists
            }
        }

        conn.createStatement().execute(
            "ALTER TABLE " + table + " ADD COLUMN " + column + " " + type
        );
    }




public List<Map<String, Object>> getHistory(
        String username,
        int limit,
        int offset
) {
    try (Connection conn = DriverManager.getConnection(DB_URL)) {

        PreparedStatement ps = conn.prepareStatement("""
            SELECT id,
                   username,
                   platform,
                   text,
                   sent_text,
                   tweet_id,
                   status,
                   error_message,
                   attempt_count,
                   created_at
            FROM tweet_history
            WHERE username = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """);

        ps.setString(1, username);
        ps.setInt(2, limit);
        ps.setInt(3, offset);

        ResultSet rs = ps.executeQuery();
        List<Map<String, Object>> results = new ArrayList<>();

        while (rs.next()) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", rs.getLong("id"));
            row.put("username", rs.getString("username"));
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
        throw new RuntimeException(e);
    }
}
 






}
