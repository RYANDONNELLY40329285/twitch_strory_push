package com.ryan.socialbackend.security.settingsPannel;

import org.springframework.stereotype.Component;
import java.sql.*;

@Component
public class ThemeStore {

    private static final String DB_URL = "jdbc:sqlite:data/tokens.db";

    public ThemeStore() {
        init();
    }

    private void init() {
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
           conn.createStatement().execute("""
    CREATE TABLE IF NOT EXISTS user_theme (
        username TEXT PRIMARY KEY,
        theme TEXT NOT NULL,
        custom_color TEXT
    )
""");
        } catch (Exception e) {
            throw new RuntimeException("Failed to init user_theme table", e);
        }
    }

   public void saveTheme(String username, String theme, String customColor) {
    try (Connection conn = DriverManager.getConnection(DB_URL)) {
        PreparedStatement ps = conn.prepareStatement("""
            INSERT INTO user_theme (username, theme, custom_color)
            VALUES (?, ?, ?)
            ON CONFLICT(username)
            DO UPDATE SET
              theme = excluded.theme,
              custom_color = excluded.custom_color
        """);

        ps.setString(1, username);
        ps.setString(2, theme);
        ps.setString(3, customColor);

        ps.executeUpdate();
    } catch (Exception e) {
        throw new RuntimeException("Failed to save theme", e);
    }
}


public ThemeData getTheme(String username) {
    try (Connection conn = DriverManager.getConnection(DB_URL)) {
        PreparedStatement ps = conn.prepareStatement("""
            SELECT theme, custom_color
            FROM user_theme
            WHERE username = ?
        """);

        ps.setString(1, username);
        ResultSet rs = ps.executeQuery();

        if (rs.next()) {
            return new ThemeData(
                rs.getString("theme"),
                rs.getString("custom_color")
            );
        }
    } catch (Exception ignored) {}

    return new ThemeData("default", null);
}

    

}
