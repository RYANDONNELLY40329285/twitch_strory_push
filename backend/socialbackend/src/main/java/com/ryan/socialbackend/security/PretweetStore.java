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

            // Updated table including text, platforms, enabled flag
            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS pretweet (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    text TEXT,
                    platforms TEXT,
                    enabled INTEGER DEFAULT 1,
                    updated_at INTEGER
                )
            """);

            // Ensure row exists
            PreparedStatement insert = conn.prepareStatement("""
                INSERT INTO pretweet (id, text, platforms, enabled, updated_at)
                VALUES (1, '', '[]', 1, ?)
                ON CONFLICT(id) DO NOTHING
            """);
            insert.setLong(1, System.currentTimeMillis());
            insert.executeUpdate();

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Pretweet table", e);
        }
    }

    public void save(String text, String platforms, boolean enabled) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            PreparedStatement ps = conn.prepareStatement("""
                UPDATE pretweet
                SET text = ?, platforms = ?, enabled = ?, updated_at = ?
                WHERE id = 1
            """);

            ps.setString(1, text);
            ps.setString(2, platforms);
            ps.setInt(3, enabled ? 1 : 0);
            ps.setLong(4, System.currentTimeMillis());
            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to save pretweet", e);
        }
    }

    public void setEnabled(boolean enabled) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            PreparedStatement ps = conn.prepareStatement("""
                UPDATE pretweet SET enabled = ? WHERE id = 1
            """);
            ps.setInt(1, enabled ? 1 : 0);
            ps.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Failed to update enabled state", e);
        }
    }

    public PretweetData load() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            ResultSet rs = conn.createStatement()
                .executeQuery("SELECT text, platforms, enabled FROM pretweet WHERE id = 1");

            if (!rs.next()) return new PretweetData("", "[]", true);

            return new PretweetData(
                rs.getString("text"),
                rs.getString("platforms"),
                rs.getInt("enabled") == 1
            );

        } catch (Exception e) {
            throw new RuntimeException("Failed to load pretweet", e);
        }
    }

    public record PretweetData(String text, String platforms, boolean enabled) {}
}
