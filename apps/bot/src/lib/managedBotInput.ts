export type BotPreferences = { enabled: boolean; status: "online" | "idle" | "dnd" | "invisible"; activity: string; activityType: number };
// Les bots secondaires attendent une activation explicite depuis le dashboard.
export const defaultPreferences: BotPreferences = { enabled: false, status: "online", activity: "", activityType: 0 };

export function validatePreferences(value: unknown): BotPreferences | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.enabled !== "boolean" || !["online", "idle", "dnd", "invisible"].includes(String(v.status)) ||
    typeof v.activity !== "string" || v.activity.length > 128 || ![0, 2, 3, 5].includes(Number(v.activityType)) || typeof v.activityType !== "number") return null;
  return { enabled: v.enabled, status: v.status as BotPreferences["status"], activity: v.activity.trim(), activityType: v.activityType };
}
