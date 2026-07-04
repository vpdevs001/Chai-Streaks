# ChaiStreaks ☕

A habit-tracking app built with Expo Router + SQLite. "Build habits one cup of chai at a time."

## Status: MVP (habits + streaks + analytics) plus local & push notifications. A few stretch goals remain.

This project was built against `IMPLEMENTATION-PLAN.md` (local reminders + push, deep linking, permissions). Phases 1–5 of that plan are implemented; see [Feature Checklist](#feature-checklist) below for exactly what's built vs. outstanding.

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
- [Expo Go](https://expo.dev/go) — note: **push notifications will not work in Expo Go**; a dev build is required to test push (local reminders do work in Expo Go).

This project uses [file-based routing](https://docs.expo.dev/router/introduction) via `src/app`.

## Feature checklist

### ✅ Built — Core app

- Habit CRUD — create, edit, archive, delete (`src/db/habitMethods.ts`, `src/app/habit/create.tsx`, `src/app/habit/[id].tsx`)
- Habit fields: title, description, emoji/icon, color, frequency (`daily` / `weekly` / `custom`), target count
- SQLite persistence, survives app restart (`expo-sqlite`, `src/db/`)
- Mark-done + streak logic — current streak and longest streak computed from completion history (`computeStreaks()` in `habitMethods.ts`)
- Progress/analytics — 7/30/all-time bar charts, completion %, "Chai Score" (`src/app/(tabs)/progress.tsx`, `src/utils/chaiScore.ts`)
- Onboarding flow, theme system (system/light/dark), settings shell

### ✅ Built — Notifications (local + push)

- **Local reminders**: scheduled on habit save/edit and cancelled on delete/archive (`src/lib/notifications/schedule.ts`, wired into `habit/create.tsx` and `habit/[id].tsx`). Reminder time is picked with a native time picker (`@react-native-community/datetimepicker`, `src/components/ReminderTimePicker.tsx`) instead of free-text entry.
- **Notification ID persistence**: `habits.notification_id` stores a JSON-encoded array of IDs (`encodeIds`/`decodeIds` in `schedule.ts`), so a weekly habit reminding on multiple days schedules and tracks one ID per day. No schema migration was needed.
- **Cancel/reschedule on edit**, **cancel-only-this-habit on delete/archive** — see `handleSave` / `handleArchive` / `handleDelete` in `habit/[id].tsx`.
- **Foreground notification handler** and **Android notification channel** (high-importance, created before the permission request) — `src/lib/notifications/setup.ts`, wired into `src/app/_layout.tsx` on boot.
- **Permission flow**: Settings shows a real granted/denied/undetermined row (`src/app/(tabs)/settings.tsx`) with request-permission and "open system settings" actions.
- **Reconciliation on permission grant**: habits whose reminders couldn't be scheduled while permission was undetermined/denied are rescheduled the moment permission is granted (`reconcileHabitReminders` in `schedule.ts`), and again defensively on app boot in case permission was granted from system Settings while the app was closed.
- **Deep linking**: tapping a notification (foreground, background, or cold start) routes to `/habit/[id]` via `resolveNotificationRoute` (`src/lib/notifications/deepLink.ts`), wired into `_layout.tsx`.
- **Push notifications**: token registration + storage (`src/lib/notifications/push.ts`), Expo Push Token display/copy UI in Settings, and a standalone test script (`scripts/send-test-push.ts`, calls the Expo push HTTP API directly rather than pulling in `expo-server-sdk`).
- Module layout: `src/lib/notifications/{setup,schedule,push,deepLink}.ts`, exposed through `src/hooks/useNotifications.ts`.

### 🎁 Stretch goals

| Goal                                       | Status                                                               |
| ------------------------------------------- | --------------------------------------------------------------------- |
| Habit analytics                             | ✅ Built                                                             |
| Calendar-style streak view                  | ✅ Built (`src/components/CalendarHeatmap.tsx`, in `habit/[id].tsx`) |
| App badge (pending habits)                  | ✅ Built (`setBadgeCountAsync` in `useHabits.ts`)                    |
| Quiet hours / do-not-disturb window         | ✅ Built (schedule-time shifting in `schedule.ts` + Settings toggle) |
| Snooze action                               | ❌ Not built                                                         |
| iOS action buttons (Done / Snooze)          | ❌ Not built                                                         |
| Image push notification                     | ❌ Not built                                                         |
| Node push server (`expo-server-sdk`)        | ❌ Not built — test script uses a direct HTTP call instead           |
| Push receipts handling                      | ❌ Not built                                                         |
| Drop invalid tokens (`DeviceNotRegistered`) | ❌ Not built                                                         |
| Daily summary push                          | ❌ Not built                                                         |

## Architecture notes

Habit logic lives in `src/db/` (SQLite-backed); notification logic lives in `src/lib/notifications/`, kept separate rather than restructuring the existing habit code. `src/hooks/useNotifications.ts` exposes permission status, request/open-settings, and the push token, so screens don't talk to `expo-notifications` directly.

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
