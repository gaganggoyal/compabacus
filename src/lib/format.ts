import type { Award } from "./db/schema";

const IST = "Asia/Kolkata";

export function fmtDate(d: Date | number | string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short", year: "numeric", ...opts }).format(
    new Date(d),
  );
}

export function fmtDateTime(d: Date | number | string) {
  return fmtDate(d, { hour: "numeric", minute: "2-digit", hour12: true });
}

export function fmtDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function fmtClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** "Aarav Sharma" -> "Aarav S." for public listings. */
export function publicName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function maskName(name: string) {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.length <= 2 ? `${first[0] ?? ""}*` : `${first.slice(0, 2)}${"*".repeat(Math.min(4, first.length - 2))}`;
}

export const AWARD_META: Record<Award, { label: string; short: string; tone: string; emoji: string }> = {
  champion: { label: "Champion", short: "Gold", tone: "gold", emoji: "🥇" },
  runner_up_1: { label: "1st Runner-up", short: "Silver", tone: "silver", emoji: "🥈" },
  runner_up_2: { label: "2nd Runner-up", short: "Bronze", tone: "bronze", emoji: "🥉" },
  distinction: { label: "Distinction", short: "90%+", tone: "violet", emoji: "🌟" },
  merit: { label: "Merit", short: "75%+", tone: "sky", emoji: "⭐" },
  participation: { label: "Participation", short: "Participant", tone: "slate", emoji: "🎖️" },
};

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
