# ChaiStreaks ☕🔥

A premium, offline-first **habit tracking** mobile app built with Expo (React Native). Track daily habits, visualise streaks on a GitHub-style heatmap, earn badges, track time, and stay motivated with a beautiful multi-theme UI.

---

## ✨ Features

### Core Habit Tracking

- **Create & manage habits** — with custom emoji icon, accent color, category, and optional description
- **Flexible frequency** — daily, weekly (pick days), or fully custom
- **Check / Cross marking** — mark a habit as ✓ Complete _or_ ✕ Skipped; tap again to unmark
- **Multi-time reminders** — set multiple specific notification times per habit, or switch to an hourly-interval mode
- **Habit templates** — 16 pre-built templates for quick habit creation
- **Habit categories** — organize habits by Health, Mindfulness, Productivity, Learning, Hobby, Social, Finance, Work
- **Drag-and-drop reordering** — long-press and drag to rearrange habits on the home screen
- **Habit notes** — add a note when marking a habit complete

### Streaks & Recovery

- **Account-level streak** — consecutive days with at least one habit completed
- **Chai Scrolls** — streak-recovery currency earned every 7-day block with 60%+ completion
- **Streak freeze** — spend a Chai Scroll to recover a missed day
- **Missed habit dialog** — first app open each day prompts you to verify yesterday's unmarked habits

### Progress & Analytics

- **GitHub-style heatmap** — 12-week activity grid with month labels, 4-level colour ramp, and tap-for-details
- **Progress charts** — 7-day and 30-day bar charts filtered from your account creation date
- **Completion breakdown** — Done / Skipped / Frozen / Missed rates that sum to 100%
- **Chai Score™** — a gamified score combining streaks, completion rate, and habit count
- **Per-habit analytics** — individual heatmap, streak history, and stats for each habit

### Time Tracking

- **Background timer** — start/stop timer that persists across app restarts
- **Task naming** — name what you're working on
- **Habit linking** — optionally link time entries to habits
- **Time charts** — 7-day and 30-day bar charts of hours tracked per day
- **Time heatmap** — 12-week heatmap of daily time tracked
- **Time breakdown** — tap any day to see all time entries with start/end times

### Badges & Gamification

- **38 badges** across 7 categories: Streaks, Completions, Habits, Chai Score, Perfect Days, Chai Scrolls, Time Tracking
- **Unique emojis** — each badge has its own distinct emoji
- **Collection progress** — track how many badges you've earned
- **Auto-evaluation** — badges are checked and awarded automatically

### Daily Tasks

- **Quick-add tasks** — one-off todo items scoped to today
- **Habit linking** — optionally link tasks to habits
- **Check off** — tap to complete, tap again to undo
- **Auto-cleanup** — tasks reset at midnight

### Data Management

- **Export data** — download all your data as JSON (copied to clipboard)
- **Import data** — restore from a previous export
- **Fully offline** — all data stored locally via SQLite

### Customization

- **16 app themes** — Dark, Light, Forest, Ocean, Lavender, Sunset, Midnight Sky, Nord, AMOLED, Masala Chai, Sakura, Mocha, Cyberpunk, and more
- **Quiet hours** — suppress notifications during sleep or focus hours
- **Profile card** — custom name and avatar photo

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
├── future-plans.md        # Roadmap of future features
├── assets/                # App icons, splash screens, and images
├── scripts/
│   └── send-test-push.ts  # Dev helper: send a test push notification
└── src/
    ├── app/               # Expo Router screens (file = route)
    │   ├── _layout.tsx    # Root navigator: SQLite + Theme + Timer providers
    │   ├── index.tsx      # Entry redirect (→ onboarding or tabs)
    │   ├── onboarding.tsx # First-launch wizard: name, avatar, first habit
    │   ├── (tabs)/        # Bottom-tab screens
    │   │   ├── _layout.tsx    # Tab bar configuration and theming
    │   │   ├── home.tsx       # Today's habits, tasks, streak stats
    │   │   ├── progress.tsx   # Bar charts, heatmap, Chai Score, all-time stats
    │   │   ├── badges.tsx     # Badge collection grid
    │   │   ├── timer.tsx      # Time tracker with charts and history
    │   │   └── settings.tsx   # Profile, themes, notifications, data management
    │   └── habit/
    │       ├── create.tsx     # Modal: create a new habit
    │       └── [id].tsx       # Modal: edit habit, view heatmap, danger zone
    ├── components/        # Reusable UI components
    │   ├── habit/             # Habit form components
    │   │   ├── HabitFormAppearance.tsx
    │   │   ├── HabitFormCategory.tsx
    │   │   ├── HabitFormFrequency.tsx
    │   │   ├── HabitFormPriority.tsx
    │   │   ├── HabitTemplates.tsx
    │   │   ├── CalendarHeatmap.tsx
    │   │   ├── HabitDangerZone.tsx
    │   │   ├── Label.tsx
    │   │   └── Section.tsx
    │   ├── home/              # Home screen components
    │   │   ├── DailyTasksCard.tsx
    │   │   ├── DraggableHabitList.tsx
    │   │   ├── EmptyHabits.tsx
    │   │   ├── HabitCard.tsx
    │   │   ├── HomeHeader.tsx
    │   │   ├── MissedHabitsDialog.tsx
    │   │   ├── ProgressRing.tsx
    │   │   ├── StatCard.tsx
    │   │   └── TodayProgressCard.tsx
    │   ├── navigation/
    │   │   └── TabIcon.tsx
    │   ├── onboarding/
    │   │   ├── OnboardingProfileStep.tsx
    │   │   └── OnboardingSlide.tsx
    │   ├── progress/          # Progress screen components
    │   │   ├── BarChart.tsx
    │   │   ├── BigStatCard.tsx
    │   │   ├── ChaiScoreBanner.tsx
    │   │   ├── CompletionSummary.tsx
    │   │   ├── HeatmapCalendar.tsx
    │   │   ├── PeriodTabSwitcher.tsx
    │   │   └── ScreenHeader.tsx
    │   ├── settings/
    │   │   ├── ProfileCard.tsx
    │   │   ├── SettingsRow.tsx
    │   │   ├── SettingsSectionHeader.tsx
    │   │   └── ThemePicker.tsx
    │   └── shared/
    │       ├── ConfirmDialog.tsx
    │       └── TimePicker.tsx
    ├── constants/
    │   └── index.ts       # SPACING, RADII, TYPOGRAPHY design tokens
    ├── contexts/
    │   ├── HabitsContext.tsx  # Shared habit state, badge count, streak computation
    │   ├── ThemeContext.tsx   # React context: resolves theme → colors, scheme
    │   └── TimerContext.tsx   # Global timer state, start/stop, persistence
    ├── db/                # All database logic
    │   ├── index.ts         # Single barrel export for the entire DB layer
    │   ├── schema.ts        # Table DDL, index/trigger creation, migration runner
    │   ├── types.ts         # TypeScript interfaces: User, Habit, HabitHistory, …
    │   ├── habitMethods.ts  # CRUD for `habits` table + streak computation
    │   ├── historyMethods.ts  # CRUD for `habit_history`, summaries, heatmap data
    │   ├── badgeMethods.ts  # Badge definitions, evaluation, persistence
    │   ├── timeMethods.ts   # CRUD for `time_entries` table
    │   ├── taskMethods.ts   # CRUD for `daily_tasks` table
    │   ├── scrollMethods.ts # Chai Scroll earning and spending
    │   ├── userMethods.ts   # CRUD for `users` table, ensureActiveUser
    │   ├── preferences.ts   # Key-value storage (theme, user id, onboarding)
    │   └── utils.ts         # Date helpers, JSON helpers, SQL clause builder
    ├── hooks/
    │   ├── useHabits.ts     # Re-export from HabitsContext
    │   ├── useNotifications.ts  # Permission management + push token registration
    │   └── useStats.ts      # Builds 7d / 30d bar data filtered to account creation
    ├── lib/
    │   └── notifications/
    │       ├── deepLink.ts  # Resolves notification tap → app route
    │       ├── schedule.ts  # Schedule / cancel / reconcile habit reminders
    │       └── setup.ts     # Notification handler config + Android channel setup
    ├── theme/
    │   └── index.ts        # Colors (16 themes), HABIT_COLORS palette, PRESET_ICONS
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

Six tables, all with cascading deletes from `users`:

| Table           | Purpose                                                                |
| --------------- | ---------------------------------------------------------------------- |
| `users`         | Profile (name, avatar URI, chai_scrolls)                               |
| `habits`        | Habit definitions (title, icon, color, category, frequency, reminders) |
| `habit_history` | One row per (habit, date) — status: `completed` / `skipped` / `frozen` |
| `user_badges`   | Earned badges with timestamp and seen flag                             |
| `time_entries`  | Time tracking entries with start/end times and duration                |
| `daily_tasks`   | Daily todo items scoped to a specific date                             |

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
| AMOLED         | Dark  | 🖤 True Black  |
| Masala Chai    | Light | 🟤 Warm Brown  |
| Sakura         | Light | 🌸 Pink        |
| Mocha          | Dark  | 🍫 Coffee      |
| Cyberpunk      | Dark  | 🌃 Neon Teal   |

---

## 📄 License

MIT — feel free to use, modify, and ship.
