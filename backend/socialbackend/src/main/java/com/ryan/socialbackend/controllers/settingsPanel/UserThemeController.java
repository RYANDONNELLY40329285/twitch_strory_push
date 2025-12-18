package com.ryan.socialbackend.controllers.settingsPanel;

import com.ryan.socialbackend.security.settingsPannel.ThemeStore;
import com.ryan.socialbackend.security.settingsPannel.ThemeData;
import com.ryan.socialbackend.security.XTokenStore;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/theme")
@CrossOrigin
public class UserThemeController {

    private final ThemeStore themeStore;
    private final XTokenStore tokenStore;

    public UserThemeController(ThemeStore themeStore, XTokenStore tokenStore) {
        this.themeStore = themeStore;
        this.tokenStore = tokenStore;
    }

    // =========================
    // GET THEME
    // =========================
    @GetMapping
    public ThemeData getTheme() {
        String username = tokenStore.getUsername();

        if (username == null) {
            return new ThemeData("default", null);
        }

        return themeStore.getTheme(username);
    }

    // =========================
    // SAVE THEME
    // =========================
    @PostMapping
    public void saveTheme(@RequestBody ThemeData body) {
        String username = tokenStore.getUsername();
        if (username == null) return;

        themeStore.saveTheme(
            username,
            body.theme(),
            body.customColor()
        );
    }
}
