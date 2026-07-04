# ChaiStreaks ☕

A habit-tracking app built with Expo Router + SQLite. "Build habits one cup of chai at a time."

## Status: MVP (habits + streaks + analytics). Notifications not yet implemented.

This project is being built against a two-part plan:

1. `IMPLEMENTATION-PLAN.md` — the core app (habits, streaks, theming, progress screens). **Done.**
2. A notifications PRD (local reminders + push, deep linking, permissions) — **not started.**

See [Feature Checklist](#feature-checklist) below for exactly what's implemented vs. outstanding.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go) — note: **push notifications will not work in Expo Go**; a dev build is required once notifications land (see below).

This project uses [file-based routing](https://docs.expo.dev/router/introduction) via `src/app`.

## Feature checklist

### ✅ Built

- Habit CRUD — create, edit, archive, delete (`src/db/habitMethods.ts`, `src/app/habit/create.tsx`, `src/app/habit/[id].tsx`)
- Habit fields: title, description, emoji/icon, color, frequency (`daily` / `weekly` / `custom`), target count
- SQLite persistence, survives app restart (`expo-sqlite`, `src/db/`)
- Mark-done + streak logic — current streak and longest streak computed from completion history (`computeStreaks()` in `habitMethods.ts`)
- Progress/analytics — 7/30/all-time bar charts, completion %, "Chai Score" (`src/app/(tabs)/progress.tsx`, `src/utils/chaiScore.ts`)
- Onboarding flow, theme system (system/light/dark), settings shell

### 🚧 Not yet built — Notifications (local + push)

None of the notification requirements are implemented yet. Specifically missing:

- **Local reminders**: no scheduling call on habit save/edit/delete (no `expo-notifications` usage anywhere in `src/`)
- **Notification ID persistence**: `habits.notification_id` is a single column today; the notification PRD needs an array of IDs per habit (multiple weekly reminder times)
- **Cancel/reschedule on edit**, **cancel-only-this-habit on delete**
- **Foreground notification handler** (`Notifications.setNotificationHandler`)
- **Android notification channel** (high-importance, created before permission request)
- **Permission flow**: Settings currently shows "Habit Reminders — Coming soon" as a placeholder; no request/denied-state UI or "open system settings" link
- **Deep linking**: tapping a notification does not route to `/habit/[id]` yet
- **Push notifications**: no registration, no Expo Push Token display/copy UI, no Push tab, no dev-build push testing flow
- Planned module layout (not present yet): `src/lib/notifications/{setup,schedule,push}.ts`, exposed through `src/hooks/use-push-notifications.ts`

### 🎁 Stretch goals

| Goal                                        | Status       |
| ------------------------------------------- | ------------ |
| Habit analytics                             | ✅ Built     |
| Calendar-style streak view                  | ❌ Not built |
| Snooze action                               | ❌ Not built |
| iOS action buttons (Done / Snooze)          | ❌ Not built |
| App badge (pending habits)                  | ❌ Not built |
| Image push notification                     | ❌ Not built |
| Node push server (`expo-server-sdk`)        | ❌ Not built |
| Push receipts handling                      | ❌ Not built |
| Drop invalid tokens (`DeviceNotRegistered`) | ❌ Not built |
| Quiet hours / do-not-disturb window         | ❌ Not built |
| Daily summary push                          | ❌ Not built |

## Architecture notes

Current structure (`src/`) differs slightly from the notifications PRD's suggested layout — habit logic lives in `src/db/` (SQLite-backed) rather than `src/lib/habits/`. When notifications are implemented, plan to add a new `src/lib/notifications/` module and a `use-push-notifications` hook rather than restructuring the existing habit code.

## Other setup steps

- ESLint: `npx expo lint`, or see ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- Unit testing: see ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- TypeScript: see ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Notifications docs (v55)](https://docs.expo.dev/versions/v55.0.0/sdk/notifications/) — required reading before implementing the notifications feature
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/)

## Join the community

- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
