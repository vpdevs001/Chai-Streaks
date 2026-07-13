# ChaiStreaks ☕🔥

A premium, offline-first **habit tracking** mobile app built with Expo (React Native). Track daily habits, visualise streaks on a GitHub-style heatmap, and stay motivated with a beautiful multi-theme UI.

---

## ✨ Features

- **Create & manage habits** — with custom emoji icon, accent color, and optional description
- **Flexible frequency** — daily, weekly (pick days), or fully custom
- **Check / Cross marking** — mark a habit as ✓ Complete _or_ ✕ Skipped; tap again to unmark
- **Multi-time reminders** — set multiple specific notification times per habit, or switch to an hourly-interval mode (e.g. every 2 h from 09:00–18:00)
- **GitHub-style heatmap** — 18-week activity grid with month labels, 4-level colour ramp, and interactive cell tap showing date details
- **Progress charts** — 7-day and 30-day bar charts filtered from your account creation date (no phantom past days)
- **Chai Score™** — a gamified score combining streaks, completion rate, and habit count
- **10+ app themes** — Dark, Light, Forest, Ocean, Lavender, Sunset, Midnight Sky, Nord, and more, each with a live colour preview
- **Quiet hours** — suppress notifications during sleep or focus hours
- **Profile card** — custom name and avatar photo
- **Onboarding flow** — first-launch setup wizard
- **Fully offline** — all data stored locally via SQLite (expo-sqlite SDK 55)

---

## 🛠 Tech Stack

| Layer                | Technology                                                                        |
| -------------------- | --------------------------------------------------------------------------------- |
| Framework            | [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/)                            |
| Language             | TypeScript                                                                        |
| Navigation           | [Expo Router v4](https://docs.expo.dev/router/introduction/) (file-based routing) |
| Database             | [expo-sqlite](https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/) (local SQLite)  |
| Preferences          | `expo-sqlite/kv-store` (AsyncStorage replacement)                                 |
| Animations           | `react-native-reanimated` v4                                                      |
| Gestures             | `react-native-gesture-handler`                                                    |
| Notifications        | `expo-notifications`                                                              |
| Haptics              | `expo-haptics`                                                                    |
| Date Picker          | `@react-native-community/datetimepicker`                                          |
| Image Picker         | `expo-image-picker`                                                               |
| Linting / Formatting | Prettier                                                                          |
| Package Manager      | Bun                                                                               |

---

## 📁 Folder Structure

```
chai-streaks/
├── app.json               # Expo app configuration (name, icons, plugins)
├── eas.json               # EAS Build profiles
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── assets/                # App icons, splash screens, and images
├── scripts/
│   └── send-test-push.ts  # Dev helper: send a test push notification
└── src/
    ├── app/               # Expo Router screens (file = route)
    │   ├── _layout.tsx    # Root navigator: SQLite + Theme providers, notification setup
    │   ├── index.tsx      # Entry redirect (→ onboarding or tabs)
    │   ├── onboarding.tsx # First-launch wizard: name, avatar, first habit
    │   ├── (tabs)/        # Bottom-tab screens
    │   │   ├── _layout.tsx    # Tab bar configuration and theming
    │   │   ├── home.tsx       # Today's habits list with streak stats
    │   │   ├── progress.tsx   # Bar charts, Chai Score, all-time stats
    │   │   └── settings.tsx   # Profile, themes, notifications, quiet hours, reset
    │   └── habit/
    │       ├── create.tsx     # Modal: create a new habit
    │       └── [id].tsx       # Modal: edit habit, view heatmap, danger zone
    ├── components/        # Reusable UI components
    │   ├── BarChart.tsx           # 7-day / 30-day bar chart
    │   ├── BigStatCard.tsx        # Large number stat card (streak, completions)
    │   ├── CalendarHeatmap.tsx    # GitHub-style 18-week activity heatmap
    │   ├── ChaiScoreBanner.tsx    # Animated Chai Score display
    │   ├── CompletionSummary.tsx  # Text summary of period completion
    │   ├── ConfirmDialog.tsx      # Reusable confirmation modal
    │   ├── EmptyHabits.tsx        # Empty state illustration for no habits
    │   ├── HabitCard.tsx          # Habit row with ✓/✕ action buttons
    │   ├── HabitDangerZone.tsx    # Archive / delete action buttons
    │   ├── HabitFormAppearance.tsx  # Icon and colour picker section
    │   ├── HabitFormFrequency.tsx   # Frequency type and day selector section
    │   ├── HomeHeader.tsx         # Greeting + profile avatar header
    │   ├── Label.tsx              # Form field label
    │   ├── PeriodTabSwitcher.tsx  # 7d / 30d tab pill
    │   ├── ProfileCard.tsx        # Editable profile name/avatar card
    │   ├── ReminderPicker.tsx     # Multi-time / hourly reminder selector
    │   ├── ReminderTimePicker.tsx # Legacy single-time picker (kept for reference)
    │   ├── ScreenHeader.tsx       # Shared screen title + subtitle header
    │   ├── Section.tsx            # Titled card section wrapper
    │   ├── SettingsRow.tsx        # Tappable settings list row
    │   ├── SettingsSectionHeader.tsx  # Settings group heading
    │   ├── StatCard.tsx           # Compact stat pill (streak, best, score)
    │   ├── TabIcon.tsx            # Bottom tab icon with label
    │   ├── ThemePicker.tsx        # Theme grid with colour previews
    │   └── TodayProgressCard.tsx  # Ring / progress bar for today
    ├── constants/
    │   └── index.ts       # SPACING, RADII, TYPOGRAPHY design tokens
    ├── contexts/
    │   └── ThemeContext.tsx  # React context: resolves theme → colors, scheme
    ├── db/                # All database logic
    │   ├── index.ts         # Single barrel export for the entire DB layer
    │   ├── schema.ts        # Table DDL, index/trigger creation, migration runner
    │   ├── types.ts         # TypeScript interfaces: User, Habit, HabitHistory, …
    │   ├── habitMethods.ts  # CRUD for `habits` table + streak computation helper
    │   ├── historyMethods.ts  # CRUD for `habit_history`, weekly/monthly summaries, heatmap data
    │   ├── userMethods.ts   # CRUD for `users` table, ensureActiveUser
    │   ├── preferences.ts   # Key-value storage (theme, user id, onboarding, notifications)
    │   └── utils.ts         # Date helpers, JSON helpers, SQL clause builder, streak calculator
    ├── hooks/
    │   ├── useHabits.ts     # Loads habits + today's history; toggleHabit (complete/skip/unmark)
    │   ├── useNotifications.ts  # Permission management + push token registration
    │   └── useStats.ts      # Builds 7d / 30d bar data filtered to account creation date
    ├── lib/
    │   └── notifications/
    │       ├── deepLink.ts  # Resolves notification tap → app route
    │       ├── schedule.ts  # Schedule / cancel / reconcile habit reminders (multi-time + hourly)
    │       └── setup.ts     # Notification handler config + Android channel setup
    ├── theme/
    │   └── index.ts        # Colors (dark/light/forest/ocean/lavender/sunset/midnight/nord),
    │                       # HABIT_COLORS palette (24 colors), PRESET_ICONS (60 emojis)
    └── utils/
        ├── chaiScore.ts    # Chai Score formula
        └── dateHelpers.ts  # Greeting, date formatting, getLast7Days, getLast30Days
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) or npm/yarn
- [Expo Go](https://expo.dev/go) on iOS/Android **or** a simulator/emulator
- Node 20+

### Install

```bash
bun install
```

### Run (development)

```bash
bun run start          # Expo Metro bundler
bun run ios            # iOS Simulator
bun run android        # Android Emulator
```

### Build (production)

Configure your EAS credentials in `eas.json` and run:

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## 🗄 Database Schema

Three tables, all with cascading deletes from `users`:

| Table           | Purpose                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| `users`         | Profile (name, avatar URI)                                              |
| `habits`        | Habit definitions (title, icon, color, frequency, reminders)            |
| `habit_history` | One row per (habit, date) — status: `completed` / `skipped` / `partial` |

Migrations are tracked via SQLite `PRAGMA user_version`. To add a migration, push a new entry to the `MIGRATIONS` array in `src/db/schema.ts`.

---

## 🎨 App Themes

Themes are defined in `src/theme/index.ts` and selected via Settings → Appearance.

| Theme          | Mode  | Accent         |
| -------------- | ----- | -------------- |
| Classic Dark   | Dark  | 🟠 Orange      |
| Classic Light  | Light | 🟠 Orange      |
| Forest Dark    | Dark  | 🟢 Green       |
| Forest Light   | Light | 🟢 Green       |
| Ocean Dark     | Dark  | 🔵 Sky Blue    |
| Ocean Light    | Light | 🔵 Sky Blue    |
| Lavender Dark  | Dark  | 🟣 Purple      |
| Lavender Light | Light | 🟣 Purple      |
| Sunset Dark    | Dark  | 🌹 Rose        |
| Sunset Light   | Light | 🌹 Rose        |
| Midnight Sky   | Dark  | 💜 Indigo      |
| Nord           | Dark  | 🩵 Arctic Blue |

---

## 📄 License

MIT — feel free to use, modify, and ship.
