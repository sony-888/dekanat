import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileBadge, Wallet, ScrollText, BookOpen, Shield, CalendarClock, RefreshCw,
  Users, HeartHandshake, PauseCircle, FileText, Check, Building2, AlarmClock,
  Newspaper, GraduationCap,
} from "lucide-react";
import type { ApplicationStatus, NotificationCategory } from "../lib/types";

const docIcons: Record<string, typeof FileText> = {
  "file-badge": FileBadge,
  wallet: Wallet,
  scroll: ScrollText,
  "book-open": BookOpen,
  shield: Shield,
  "calendar-clock": CalendarClock,
  refresh: RefreshCw,
  users: Users,
  "heart-handshake": HeartHandshake,
  "pause-circle": PauseCircle,
};

export function DocIcon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const Icon = docIcons[name] ?? FileText;
  return <Icon size={size} strokeWidth={1.8} className={className} aria-hidden />;
}

const categoryIcons: Record<NotificationCategory, typeof FileText> = {
  dean: Building2,
  deadline: AlarmClock,
  schedule: CalendarClock,
  news: Newspaper,
  grades: GraduationCap,
};

const categoryTone: Record<NotificationCategory, string> = {
  dean: "",
  deadline: "coral",
  schedule: "gold",
  news: "violet",
  grades: "teal",
};

export function CategoryIcon({ category, size = "sm" }: { category: NotificationCategory; size?: "sm" | "md" }) {
  const Icon = categoryIcons[category] ?? Newspaper;
  return (
    <span className={`icon-circle ${size === "sm" ? "sm" : ""} ${categoryTone[category] ?? ""}`} aria-hidden>
      <Icon size={size === "sm" ? 16 : 19} strokeWidth={1.8} />
    </span>
  );
}

export function Avatar({ name, hue = 158, size, className = "" }: { name: string; hue?: number; size?: "lg"; className?: string }) {
  const text = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span
      className={`avatar ${size === "lg" ? "avatar-lg" : ""} ${className}`}
      style={{ background: `linear-gradient(145deg, hsl(${hue} 42% 32%), hsl(${(hue + 46) % 360} 48% 44%))` }}
      aria-hidden
    >
      {text}
    </span>
  );
}

export function Ring({
  value, max = 5, size = 118, stroke = 9, color = "var(--site-accent)", track = "color-mix(in srgb, var(--site-fg) 9%, transparent)", children,
}: {
  value: number; max?: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, value / max));
  return (
    <div className="gpa-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="gpa-ring-center">{children}</div>
    </div>
  );
}

export function Seg<T extends string>({
  value, options, onChange, label,
}: {
  value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatusPill({ status, label }: { status: ApplicationStatus; label: string }) {
  return <span className={`status-pill status-${status}`}>{label}</span>;
}

export function Sheet({
  open, onClose, title, eyebrow, children, foot, wide,
}: {
  open: boolean; onClose: () => void; title: string; eyebrow?: string; children: React.ReactNode; foot?: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={wide ? { maxWidth: 760 } : undefined}
      >
        <div className="sheet-grab" />
        <header className="sheet-head">
          <div className="grow">
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h2 className="h3" style={{ marginTop: eyebrow ? 3 : 0 }}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {foot ? <footer className="sheet-foot">{foot}</footer> : null}
      </section>
    </div>,
    document.body,
  );
}

type ToastItem = { id: number; text: string };
const ToastContext = createContext<{ notify: (text: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const notify = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current.slice(-2), { id, text }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-wrap" role="status" aria-live="polite">
          {items.map((item) => (
            <div key={item.id} className="toast">
              <span style={{ display: "inline-flex", color: "inherit" }}>
                <Check size={16} strokeWidth={2.6} />
              </span>
              {item.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("ToastProvider is missing");
  return value;
}
