/**
 * Resolves notification payload data to a routing path within the app.
 */
export function resolveNotificationRoute(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (data && data.screen === '/habit' && data.habitId != null) {
    return `/habit/${data.habitId}`;
  }
  return null;
}
