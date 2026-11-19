import type { Lang } from "./types";
import { todayStr } from "./api";

export function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDay(dateStr);
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function weekdayShort(dateStr: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { weekday: "short" })
    .format(parseDay(dateStr))
    .replace(".", "");
}

export function weekdayLong(dateStr: string, lang: Lang): string {
  const text = new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { weekday: "long" }).format(parseDay(dateStr));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function monthShort(dateStr: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { month: "short" })
    .format(parseDay(dateStr))
    .replace(".", "");
}

export function dayNumber(dateStr: string): number {
  return parseDay(dateStr).getDate();
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function dayRelative(dateStr: string, lang: Lang): string | null {
  const today = todayStr();
  if (dateStr === today) return lang === "ru" ? "Сегодня" : "Today";
  if (dateStr === addDays(today, 1)) return lang === "ru" ? "Завтра" : "Tomorrow";
  return null;
}

export function clockToMinutes(clock: string): number {
  const [h, m] = clock.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function durationLabel(from: string, to: string, lang: Lang): string {
  const total = Math.max(0, clockToMinutes(to) - clockToMinutes(from));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (lang === "ru") {
    if (h && m) return `${h} ч ${m} мин`;
    if (h) return `${h} ч`;
    return `${m} мин`;
  }
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function plural(lang: Lang, n: number, one: string, few: string, many: string): string {
  if (lang === "en") return n === 1 ? one : many;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function greetingKey(hour = new Date().getHours()): "home.morning" | "home.afternoon" | "home.evening" {
  if (hour < 12) return "home.morning";
  if (hour < 18) return "home.afternoon";
  return "home.evening";
}

export function timeAgo(iso: string, lang: Lang): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  const rtf = new Intl.RelativeTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { numeric: "auto" });
  if (minutes < 1) return lang === "ru" ? "только что" : "just now";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "short" })
    .format(new Date(iso));
}

export function timeOf(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function shortName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts.slice(0, 2).join(" ") || fullName;
}

export function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
