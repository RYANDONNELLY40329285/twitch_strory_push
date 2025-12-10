package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;
import java.sql.*;

@Component
public class PretweetStore {

    private static final String DB_URL = "jdbc:sqlite:data/tokens.db";

    public PretweetStore() {
        init();
    }

    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            // Create table if missing
            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS pretweet (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    text TEXT,
                    platforms TEXT,
                    updated_at INTEGER
                )
            """);

            // Ensure 'platforms' column exists for older DBs
            ResultSet rs = conn.createStatement()
                    .executeQuery("PRAGMA table_info(pretweet)");

            boolean hasPlatforms = false;

            while (rs.next()) {
                if ("platforms".equalsIgnoreCase(rs.getString("name"))) {
                    hasPlatforms = true;
                    break;
                }
            }

            if (!hasPlatforms) {
                conn.createStatement()
                        .execute("ALTER TABLE pretweet ADD COLUMN platforms TEXT DEFAULT ''");
                System.out.println("🔥 Added 'platforms' column to pretweet table.");
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Pretweet table", e);
        }
    }

    // ------------------------------------------------------
    // SAVE PRETWEET + PLATFORMS
    // ------------------------------------------------------
    public void save(String text, String platforms) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO pretweet (id, text, platforms, updated_at)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    text = excluded.text,
                    platforms = excluded.platforms,
                    updated_at = excluded.updated_at
            """);

            ps.setString(1, text);
            ps.setString(2, platforms);
            ps.setLong(3, System.currentTimeMillis());
            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to save pretweet", e);
        }
    }

    // ------------------------------------------------------
    // LOAD PRETWEET TEXT
    // ------------------------------------------------------
    public String loadText() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT text FROM pretweet WHERE id = 1");

            if (!rs.next()) return "";
            return rs.getString("text");

        } catch (Exception e) {
            throw new RuntimeException("Failed to load pretweet text", e);
        }
    }

    // ------------------------------------------------------
    // LOAD PLATFORMS
    // ------------------------------------------------------
    public String loadPlatforms() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT platforms FROM pretweet WHERE id = 1");

            if (!rs.next()) return "";
            return rs.getString("platforms");

        } catch (Exception e) {
            throw new RuntimeException("Failed to load platforms", e);
        }
    }

    // Optional clear
    public void clear() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            conn.createStatement().execute("DELETE FROM pretweet WHERE id = 1");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to clear pretweet", e);
        }
    }
}
