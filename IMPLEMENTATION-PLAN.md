# ChaiStreaks — Notifications Implementation Plan

Version: 1.0
Scope: Local reminders + push notifications + deep linking (per notifications PRD)
Builds on top of: `IMPLEMENTATION-PLAN.md` (core app — already complete)

---

## 0. Guiding principle

**Extend the existing structure, don't restructure it.** The PRD suggests `src/lib/habits/` and `src/lib/notifications/`, but this repo already has a working, tested data layer in `src/db/`. We keep that as-is and only add what's missing:

```
src/
  lib/
    notifications/        ← NEW — everything notification-specific lives here
      setup.ts             (permissions, Android channel, foreground handler, response listener)
      schedule.ts          (schedule/cancel/reschedule per habit)
      push.ts              (push token registration + storage)
      deepLink.ts           (shared tap → route resolver, used by both local + push)

  hooks/
    useNotifications.ts    ← NEW — exposes permission status, request/openSettings, push token
    useHabits.ts           (existing — gets two new calls: schedule on save, cancel on delete)

  db/                      (existing — already has the plumbing we need, see §1)
```

Nothing in `src/db/` needs to move. Two already-existing exports do almost exactly what the PRD asks for:

- `getHabitsWithReminders(db, userId)` — habits with `reminder_status = 'enabled'` (used to reschedule everything after a permission grant or app update)
- `setHabitNotificationId(db, habitId, notificationId)` — persists the scheduled ID(s)
- `getNotificationPermission` / `setNotificationPermission` (in `preferences.ts`) — cached permission status, backed by `expo-sqlite/kv-store`

## 1. Data model decision: no schema migration needed

`habits.notification_id` is currently a single `TEXT` column. The PRD needs an array (a weekly habit reminding on Mon/Wed/Fri needs 3 scheduled notification IDs, one per weekday).

Rather than add a migration, **store a JSON-encoded array in the existing column**:

```ts
// src/lib/notifications/schedule.ts
type StoredIds = string[]; // JSON.stringify'd into habits.notification_id

export function encodeIds(ids: string[]): string {
  return JSON.stringify(ids);
}
export function decodeIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return raw ? [raw] : [];
  }
}
```

The `decodeIds` fallback (`raw ? [raw] : []`) safely handles any pre-existing plain-string values, so this is a non-breaking change. `setHabitNotificationId(db, habitId, encodeIds(ids))` — no signature change needed, it already accepts `string | null`.

---

## 2. Phase-by-phase plan

### Phase 1 — Notification foundation (`src/lib/notifications/setup.ts`)

Required before anything can be scheduled.

- `configureNotificationHandler()` — call once at app boot:
  ```ts
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  });
  ```
- `ensureAndroidChannel()` — **must run before `requestPermissionsAsync()`**, since on Android the permission prompt itself is tied to channel importance; creating the channel after asking can silently downgrade it to default importance.
  ```ts
  await Notifications.setNotificationChannelAsync('habit-reminders', {
    name: 'Habit Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250]
  });
  ```
- `requestPermission()` — wraps `getPermissionsAsync` / `requestPermissionsAsync`, writes the result via `setNotificationPermission` (existing `db/preferences.ts` function) so the rest of the app can read cached status without an async native call.
- `openNotificationSettings()` — `Linking.openSettings()` fallback for the denied state.

Wire `configureNotificationHandler()` + `ensureAndroidChannel()` into `src/app/_layout.tsx`, in `RootLayout`, before the `AppGate` renders — same place `migrateDatabase` already runs.

### Phase 2 — Scheduling (`src/lib/notifications/schedule.ts`)

```ts
scheduleHabitReminders(habit: Habit): Promise<string[]>
cancelHabitReminders(habit: Habit): Promise<void>
rescheduleHabitReminders(habit: Habit): Promise<string[]>  // cancel + schedule
```

- `daily` → one `Notifications.scheduleNotificationAsync` with a `calendar` trigger (hour/minute from `reminder_time`, `repeats: true`).
- `weekly` / `custom` → one scheduled notification **per selected weekday** (`frequency_days`), each with `{ weekday, hour, minute, repeats: true }`.
- Every scheduled notification's `content.data` carries the deep-link contract from the PRD:
  ```ts
  data: { screen: '/habit', habitId: habit.id }
  ```
- `cancelHabitReminders` decodes the stored IDs and calls `Notifications.cancelScheduledNotificationAsync` per ID — **only for that habit**, never `cancelAllScheduledNotificationsAsync`.

Wiring into existing screens:

| Screen                               | Change                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/habit/create.tsx`           | After `createHabit(...)`, if `reminder_status === 'enabled'`, call `scheduleHabitReminders`, then `setHabitNotificationId(db, habit.id, encodeIds(ids))`.                |
| `src/app/habit/[id].tsx` (edit save) | Before calling `updateHabit`, call `cancelHabitReminders(existingHabit)`; after update, if reminders still enabled, `scheduleHabitReminders` + `setHabitNotificationId`. |
| `src/app/habit/[id].tsx` (delete)    | Before `deleteHabit`, call `cancelHabitReminders(habit)`.                                                                                                                |

This mirrors the existing pattern in `useHabits.ts` (`toggleHabit` calling into `src/db` then refreshing state) — no new architectural pattern introduced.

### Phase 3 — Deep linking + tap handling (`src/lib/notifications/deepLink.ts`)

One resolver shared by local and push, since the PRD requires both to reuse the same tap handler:

```ts
export function resolveNotificationRoute(data: Record<string, unknown>): string | null {
  if (data?.screen === '/habit' && data?.habitId != null) {
    return `/habit/${data.habitId}`;
  }
  return null;
}
```

In `src/app/_layout.tsx`:

- `Notifications.addNotificationResponseReceivedListener` — handles taps while the app is running (foreground/background), routes via `router.push(resolveNotificationRoute(...))`.
- `Notifications.getLastNotificationResponseAsync()` on mount — handles the **cold start** case (app was killed, user tapped notification to launch it), which is easy to miss and is explicitly implied by the PRD's "app closed" push scenario.

Expose both through `useNotifications()` so `_layout.tsx` stays thin.

### Phase 4 — Permission UX (Settings tab)

Replace the current placeholder in `src/app/(tabs)/settings.tsx`:

```tsx
<SettingsRow emoji="🔔" label="Habit Reminders" sublabel="Coming soon" />
```

with a real permission-aware row driven by `useNotifications()`:

- `granted` → "Habit Reminders — On"
- `denied` → "Habit Reminders — Off · Tap to open Settings" → `openNotificationSettings()`
- `undetermined` → "Habit Reminders — Tap to enable" → `requestPermission()`

No crash path: every call in `setup.ts` and `schedule.ts` should check permission state first and no-op (not throw) if denied — the habit still saves, it just isn't scheduled.

### Phase 5 — Push notifications (`src/lib/notifications/push.ts`)

- `registerForPushToken()` — `Notifications.getExpoPushTokenAsync({ projectId })` (projectId already in `app.json` → `extra.eas.projectId`), gated behind `Device.isDevice` (already have `expo-device` installed).
- Store the token via the existing generic `setPreference` / `getPreference` helpers (`db/preferences.ts`) — no new persistence layer needed, e.g. key `'@habit_tracker/push_token'`.
- Settings tab: new "Push" section — token displayed in a selectable `Text`, with a "Copy" button (`expo-clipboard` — one new dependency).
- Push payloads use the **same** `{ screen, habitId }` data contract and are handled by the **same** `resolveNotificationRoute` — reuse, not a parallel code path.
- Document (in README) that push requires a dev build (`eas build --profile development`) since it doesn't work in Expo Go — `eas.json` already has a working `development` profile, no changes needed there.
- Testing: a tiny standalone Node script (not shipped in the app) using `expo-server-sdk`, per the PRD's "sending is a server-side responsibility" rule — lives outside `src/`, e.g. `scripts/send-test-push.ts`.

---

## 3. Easy bonus wins (worth doing alongside the above)

These either reuse data/plumbing that already exists, or are a few lines on top of Phase 1–5 work.

| Bonus feature                                    | Why it's easy                                                                                                                                                                                                                                                                                    | Effort                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Calendar-style streak view**                   | `getHabitCalendarData(db, habitId, days)` **already exists** in `historyMethods.ts` and returns exactly a `{date: status}` map for the last 90 days — nobody's built a UI for it yet. Add a small heatmap grid component (`CalendarHeatmap.tsx`) to `src/app/habit/[id].tsx`. Zero backend work. | Small                       |
| **App badge count**                              | `Notifications.setBadgeCountAsync(count)` — the "today's pending habits" number is already computed in `useHabits.ts` (`habits.length - completedCount`). Just call it whenever that value changes.                                                                                              | Small                       |
| **Quiet hours**                                  | Generic `getPreference`/`setPreference` helpers already exist in `db/preferences.ts` — store `quiet_hours_start`/`quiet_hours_end`, and check the window inside `scheduleHabitReminders` before setting the trigger (skip/shift reminders that land inside it).                                  | Small–Medium                |
| **Snooze action**                                | `Notifications.scheduleNotificationAsync` again with the same `habitId`, offset +10 min, triggered from `addNotificationResponseReceivedListener` when `actionIdentifier === 'snooze'`. Needs one `setNotificationCategoryAsync` category registered in `setup.ts`.                              | Medium                      |
| **iOS action buttons (Done / Snooze)**           | Same category API as Snooze above — register once, "Done" action calls the same `markHabitCompleted` already in `db/historyMethods.ts` used by `useHabits.toggleHabit`.                                                                                                                          | Medium                      |
| **Drop invalid tokens on `DeviceNotRegistered`** | Only relevant once push receipts are checked server-side (Phase 5 test script) — just delete the stored token via `removePreference`.                                                                                                                                                            | Small (once Phase 5 exists) |

Not included as "easy": daily summary push, image push, push receipts dashboard — these need a real backend/scheduler and are out of scope for a client-only repo.

---

## 4. Suggested build order

1. Phase 1 (foundation) — nothing else works without this.
2. Phase 2 (scheduling) + wire into create/edit/delete — this alone satisfies most of the PRD's "local notifications" core requirement.
3. Phase 3 (deep linking) — small, high value, makes reminders actually useful.
4. Phase 4 (Settings permission UX) — mostly UI, unblocks real device testing.
5. **Bonus: app badge + calendar view** — do these here, they're nearly free and don't depend on push.
6. Phase 5 (push) — biggest lift (dev build required to test).
7. **Bonus: quiet hours, snooze/action buttons** — natural follow-ups once push + scheduling both exist.

## 5. New files summary

```
src/lib/notifications/setup.ts       (new)
src/lib/notifications/schedule.ts    (new)
src/lib/notifications/push.ts        (new)
src/lib/notifications/deepLink.ts    (new)
src/hooks/useNotifications.ts        (new)
src/components/CalendarHeatmap.tsx   (new — bonus)
scripts/send-test-push.ts            (new — push testing only, not shipped)

src/app/_layout.tsx                  (edit — register handler + tap listener)
src/app/habit/create.tsx             (edit — schedule on save)
src/app/habit/[id].tsx               (edit — cancel/reschedule/cancel-on-delete)
src/app/(tabs)/settings.tsx          (edit — real permission row + push token section)
app.json                             (edit — add expo-notifications config plugin)
package.json                        (edit — add expo-clipboard, expo-server-sdk as devDependency for the test script)
```

No changes needed to `src/db/schema.ts`, `src/db/types.ts` (beyond documenting the JSON-array convention), or `eas.json`.
