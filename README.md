📦 Twitch & X Automation Desktop App

Full-stack Desktop Application (Electron + Spring Boot + SQLite)

🔗 Tech Stack

Backend: Java 17, Spring Boot

Frontend: Electron + React + TypeScript

Database: SQLite

Scripting: Ruby (data export & automation)

APIs: Twitch EventSub, X (Twitter) OAuth 2.0

Architecture: Event-driven, service-oriented

🧠 Project Overview

I built a desktop automation tool that integrates Twitch and X (Twitter) to support streamers with automated posting, activity tracking, and analytics.

The app handles OAuth authentication, real-time Twitch EventSub subscriptions, automated social posting, failure recovery, and data export, all wrapped in a secure Electron desktop experience.

⚙️ Backend Architecture & Responsibilities
🔐 Authentication & Security

Implemented OAuth 2.0 flows for both Twitch and X

Secure token storage using SQLite with encryption

Automatic token invalidation and logout handling

Startup validation to detect expired or invalid tokens

Key classes

TwitchAuthController

XAuthController

TwitchTokenStore

XTokenStore

EncryptionService

📡 Event-Driven Twitch Integration

Integrated Twitch EventSub to react to real-time stream events

Automatic subscription registration on startup

Safe cleanup and re-registration logic

Local tunnel support for webhook callbacks

Events handled

Stream online/offline

Subscription lifecycle events

🤖 Automation & Business Logic

Built an AutoPostService that:

Detects stream-online events

Automatically posts to X

Applies retry logic and failure handling

Implemented rate-limit awareness and failure classification:

SUCCESS

FAILED

RATE_LIMITED

AUTH_EXPIRED

🗃️ Persistence & Data Modelling

Designed SQLite schemas for:

Tokens

Tweet history

Pretweets

Implemented user-scoped data access to ensure isolation

Added safe schema migrations on startup

Tweet history includes

Original text

Posted text

Status

Error messages

Retry count

Timestamp

📤 Export & Automation via Ruby

Integrated Ruby scripting into the Java backend to:

Export tweet history to .xlsx

Apply conditional formatting (success, failure, rate-limited)

Preserve numeric tweet IDs safely

Triggered securely via backend controller

Executed from Electron using IPC

Auto-opened exported files on completion

Why Ruby?

Excellent Excel tooling

Clear separation between backend logic and reporting

Demonstrates polyglot engineering

🖥️ Electron Desktop Integration

Built secure IPC bridges between Electron and backend

Disabled Node integration in renderer for security

Used preload scripts for controlled API access

Allowed users to:

Trigger exports

View activity history

Authenticate services

Receive real-time feedback

📊 UI & User Experience

Live activity feed with polling + refresh logic

Status-aware styling (success / failure / rate-limited)

Auto-closing notifications for exports

Pagination and performance-safe history loading

🧪 Reliability & Production Considerations

Defensive error handling across API boundaries

Clear separation of concerns:

Controllers

Services

Stores

Startup health checks

Safe background process execution

User-scoped access control enforced at store level

🏁 Key Engineering Takeaways

Built a real event-driven system, not just CRUD

Integrated multiple external APIs safely

Balanced desktop, backend, and automation concerns

Demonstrated production-style thinking:

retries

failure modes

observability

export tooling



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
