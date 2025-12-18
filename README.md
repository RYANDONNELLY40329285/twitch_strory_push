"# twitch_strory_push" 


-------------------------------------------------------------------------------------------------------------------------------------------------------------------
- X Client – Frontend

Desktop frontend for X Client, built with React + TypeScript and packaged using Electron.
This app provides a desktop interface for connecting X (Twitter) and Twitch accounts, composing tweets, managing pre-tweet automation, viewing activity history, and customizing the UI appearance.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Features 

- Account Management 
•	Connect / disconnect X (Twitter) account
•	Connect / disconnect Twitch account
•	Automatically refresh account state after OAuth
•	Profile caching for instant UI load

Tweet Composer 
•	Compose and post tweets (up to 280 characters)
•	Emoji picker support
•	Character counter
•	Success / error notifications

Accounts Modal
A central modal for managing everything related to accounts and automation.

Tabs

    Pre-Tweet
        Auto-saved pre-tweet message
        Enable / disable automation
	    Platform selection

    Activity 
        Paginated Tweet Hustory 
        Auto refreshes every 15 secs 
        Status Indicators (Success / rate limited / failed)

    Settings 
        Apperance Customisation 
        Theme Selection 

Apperance/Themes
    Preset Themes: 
        red
        green 
        purple 
    Custom Theme 
        Hex color Picker 
        Live perview 
        Automatically switches to custom theme 
    Theme + custom colour persisted via backend 
    
    Theme priority 
        Custom ues custom hex colour 
        preset themnes - used predefiend gradients 
        defualt fallback theme 

-------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Tech Stack 
        React 18 
        TypeScript 
        Electron 
        Tailwind CSS 
        emoji-picker-react
-------------------------------------------------------------------------------------------------------------------------------------------------------------------
Current frontend structure 

frontend/
├── src/
│   ├── components/
│   │   ├── AccountsModal.tsx
│   │   ├── ActivityPanel.tsx
│   │   └── SettingsPanel.tsx
│   ├── types/
│   │   └── theme.ts
│   ├── App.tsx
│   └── main.tsx
├── electron/
│   └── preload.ts
├── package.json
└── README.md

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Background Intergration 

Used Enpoints 

Authentication
•	window.api.getAuthStatus()
•	window.api.getProfile()
•	window.api.startOAuth()
•	window.api.logout()

Twitch
•	window.api.startTwitchOAuth()
•	window.api.logoutTwitch()
•	window.api.getTwitchAuthStatus()
•	window.api.getTwitchProfile()

Tweets
•	window.api.postTweet(text)
•	GET /api/tweets/history

Themes
•	GET /api/user/theme
•	POST /api/user/theme

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Running the Frontend 

Install dependencies
    npm install

Start development mode 
    npm run dev

Start the desktop app 
    npm start 

This will:
    Launch the desktpp app 
    Start Electron 
    Connected to the backenbd at http://localhost:8080  

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Notes: 
    The frontend assumes the backend is already running.
    OAuth callbacks are handled via Electron preload APIs.
    Theme changes are saved automatically — no manual save button required.
    Custom colors are only applied when theme === "custom"

-------------------------------------------------------------------------------------------------------------------------------------------------------------------

Author: Ryan Donnelly (rdonnelly49@qub.ac.uk)
