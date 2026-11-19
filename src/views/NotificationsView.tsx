import { useState } from "react";
import { ArrowRight, Bell, CheckCheck, Clock, Pin } from "lucide-react";
import type { Notification, NotificationCategory, Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { timeAgo } from "../lib/format";
import { CategoryIcon } from "../components/ui";

const categories: NotificationCategory[] = ["dean", "deadline", "schedule", "news", "grades"];

export function NotificationsView({
  data, onRead, onNavigate, onMarkAll,
}: {
  data: Payload;
  onRead: (id: string) => void;
  onNavigate: (route: "schedule" | "grades" | "documents" | "notifications") => void;
  onMarkAll: () => void;
}) {
  const { t, pick, lang } = useI18n();
  const [filter, setFilter] = useState<"all" | NotificationCategory>("all");
  const unread = data.notifications.filter((item) => !item.read).length;
  const items = filter === "all" ? data.notifications : data.notifications.filter((item) => item.category === filter);

  const open = (item: Notification) => {
    if (!item.read) onRead(item.id);
    const target = item.action?.target?.replace(/^\//, "");
    if (target === "schedule" || target === "grades" || target === "documents" || target === "notifications") {
      onNavigate(target);
    }
  };

  return (
    <div className="page-enter stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">{t("nav.notifications")}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t("notifications.title")}</h1>
          <p className="page-sub">{t("notifications.subtitle")}{unread ? ` · ${unread} ${t("notifications.unread")}` : ""}</p>
        </div>
        {unread ? (
          <div className="page-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onMarkAll}>
              <CheckCheck size={15} />
              <span className="long">{t("notifications.markAll")}</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="tabs-scroll" role="tablist" aria-label={t("notifications.title")}>
        <button type="button" role="tab" aria-selected={filter === "all"} className={`filter-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          {t("notifications.all")} <span className="count">{data.notifications.length}</span>
        </button>
        {categories.map((category) => {
          const count = data.notifications.filter((item) => item.category === category).length;
          if (!count) return null;
          return (
            <button key={category} type="button" role="tab" aria-selected={filter === category} className={`filter-chip ${filter === category ? "active" : ""}`} onClick={() => setFilter(category)}>
              {t(`notifications.${category}`)} <span className="count">{count}</span>
            </button>
          );
        })}
      </div>

      {items.length ? (
        <div className="stack-sm">
          {items.map((item) => (
            <button key={item.id} type="button" className={`notif-item ${item.read ? "" : "unread"}`} onClick={() => open(item)}>
              <CategoryIcon category={item.category} size="md" />
              <span className="grow">
                <span className="notif-title" style={{ display: "block" }}>
                  {item.pinned ? <Pin size={12} className="pin-mark" style={{ verticalAlign: -1, marginRight: 4 }} /> : null}
                  {pick(item.title)}
                </span>
                <span className="small muted" style={{ display: "block", lineHeight: 1.5, marginTop: 4 }}>{pick(item.body)}</span>
                <span className="notif-meta">
                  <span>{t(`notifications.${item.category}`)}</span>
                  <span>·</span>
                  <span>{timeAgo(item.createdAt, lang)}</span>
                  {item.dueInDays != null ? (
                    <span className={`pill ${item.dueInDays <= 2 ? "pill-coral" : "pill-gold"}`} style={{ height: 21, fontSize: 10 }}>
                      <Clock size={11} /> {t("notifications.due")} {item.dueInDays} {lang === "ru" ? (item.dueInDays === 1 ? "день" : item.dueInDays < 5 ? "дня" : "дней") : (item.dueInDays === 1 ? "day" : "days")}
                    </span>
                  ) : null}
                  {item.action ? (
                    <span className="pill pill-accent" style={{ height: 21, fontSize: 10 }}>
                      {pick(item.action.label)} <ArrowRight size={11} />
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="icon-circle gold"><Bell size={22} /></span>
          <div className="h3">{t("notifications.empty")}</div>
          <p className="muted small" style={{ maxWidth: 340 }}>{t("notifications.emptySub")}</p>
        </div>
      )}
    </div>
  );
}
