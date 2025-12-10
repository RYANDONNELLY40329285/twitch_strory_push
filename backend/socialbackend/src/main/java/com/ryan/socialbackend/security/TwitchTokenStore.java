package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;
import java.sql.*;

@Component
public class TwitchTokenStore {

    private static final String DB_URL = "jdbc:sqlite:data/tokens.db";

    private final EncryptionService encryption;

    public TwitchTokenStore(EncryptionService encryption) {
        this.encryption = encryption;
        init();
    }

    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS twitch_tokens (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    access_token TEXT,
                    refresh_token TEXT,
                    expires_at INTEGER
                )
            """);

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize Twitch SQLite table", e);
        }
    }

    public void save(String accessToken, String refreshToken, long expiresAt) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO twitch_tokens (id, access_token, refresh_token, expires_at)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    access_token = excluded.access_token,
                    refresh_token = excluded.refresh_token,
                    expires_at = excluded.expires_at
            """);

            ps.setString(1, encryption.encrypt(accessToken));
            ps.setString(2, encryption.encrypt(refreshToken));
            ps.setLong(3, expiresAt);
            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to store Twitch tokens", e);
        }
    }

    public String getAccessToken() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT access_token FROM twitch_tokens WHERE id = 1");

            if (!rs.next()) return null;

            String encrypted = rs.getString("access_token");

            return encrypted == null ? null : encryption.decrypt(encrypted);

        } catch (Exception e) {
            throw new RuntimeException("Failed to read Twitch access token", e);
        }
    }

    public String getRefreshToken() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT refresh_token FROM twitch_tokens WHERE id = 1");

            if (!rs.next()) return null;

            String encrypted = rs.getString("refresh_token");

            return encrypted == null ? null : encryption.decrypt(encrypted);

        } catch (Exception e) {
            throw new RuntimeException("Failed to read Twitch refresh token", e);
        }
    }

    public Long getExpiresAt() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT expires_at FROM twitch_tokens WHERE id = 1");

            if (!rs.next()) return null;

            return rs.getLong("expires_at");

        } catch (Exception e) {
            throw new RuntimeException("Failed to read Twitch expires_at", e);
        }
    }

    public void clear() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            conn.createStatement().execute("DELETE FROM twitch_tokens WHERE id = 1");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to clear Twitch tokens", e);
        }
    }
}
