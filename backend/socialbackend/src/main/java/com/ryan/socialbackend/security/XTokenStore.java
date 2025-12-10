package com.ryan.socialbackend.security;

import org.springframework.stereotype.Component;
import java.sql.*;

@Component
public class XTokenStore {

    private static final String DB_URL = "jdbc:sqlite:data/tokens.db";

    private final EncryptionService encryption;

    public XTokenStore(EncryptionService encryption) {
        this.encryption = encryption;
        init();
    }

    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            conn.createStatement().execute("""
                CREATE TABLE IF NOT EXISTS x_tokens (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    access_token TEXT
                )
            """);

        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize X SQLite table", e);
        }
    }

    public void save(String accessToken) {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {

            PreparedStatement ps = conn.prepareStatement("""
                INSERT INTO x_tokens (id, access_token)
                VALUES (1, ?)
                ON CONFLICT(id) DO UPDATE SET
                    access_token = excluded.access_token
            """);

            ps.setString(1, encryption.encrypt(accessToken));
            ps.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Failed to store X token", e);
        }
    }

    public String getAccessToken() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            ResultSet rs = conn.createStatement()
                    .executeQuery("SELECT access_token FROM x_tokens WHERE id = 1");

            if (!rs.next()) return null;

            String encrypted = rs.getString("access_token");

            return encrypted == null ? null : encryption.decrypt(encrypted);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load X access token", e);
        }
    }

    public void clear() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            conn.createStatement().execute("DELETE FROM x_tokens WHERE id = 1");
        } catch (SQLException e) {
            throw new RuntimeException("Failed to clear X token", e);
        }
    }
}
