"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    // OAuth start
    startOAuth: async () => {
        return await electron_1.ipcRenderer.invoke("oauth-start");
    },
    // Logout
    logout: async () => {
        return await electron_1.ipcRenderer.invoke("oauth-logout");
    },
    // Backend status
    getAuthStatus: async () => {
        return await electron_1.ipcRenderer.invoke("auth-status");
    },
    // Profile
    getProfile: async () => {
        return await electron_1.ipcRenderer.invoke("profile-get");
    },
    // Tweet posting
    postTweet: async (text) => {
        return await electron_1.ipcRenderer.invoke("tweet-post", text);
    },
    // OAuth finished
    onOAuthComplete: (cb) => {
        electron_1.ipcRenderer.on("oauth-complete", () => cb());
    },
    // Auto-profile from popup
    onAutoProfile: (cb) => {
        electron_1.ipcRenderer.on("auto-profile", (_event, profile) => cb(profile));
    },
});
