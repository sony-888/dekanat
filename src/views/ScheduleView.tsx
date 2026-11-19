import { useEffect, useState } from "react";
import {
  ArrowRightLeft, CalendarDays, Clock, MapPin, Plus, UserRound, X,
} from "lucide-react";
import type { ClassItem, Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { clockToMinutes, dayRelative, isToday, monthShort, weekdayLong, weekdayShort } from "../lib/format";
import { ScheduleLookup } from "./ScheduleLookup";

function statusLabelKey(status: ClassItem["status"]): string {
  if (status === "moved") return "schedule.moved";
  if (status === "cancelled") return "schedule.cancelled";
  if (status === "added") return "schedule.added";
  return "";
}

export function ScheduleView({ data, now }: { data: Payload; now: Date }) {
  const { t, pick, lang } = useI18n();
  const days = data.schedule.days;
  const todayInWeek = days.find((day) => isToday(day.date))?.date;
  const firstDay = todayInWeek ?? days.find((day) => day.classes.length)?.date ?? days[0]?.date;
  const [selected, setSelected] = useState(firstDay);

  useEffect(() => {
    if (!days.some((day) => day.date === selected)) setSelected(firstDay);
  }, [days, selected, firstDay]);

  const day = days.find((item) => item.date === selected) ?? days[0];
  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const rangeLabel = first && last ? `${Number(first.slice(8))}–${Number(last.slice(8))} ${monthShort(last, lang)}` : "";
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const relative = day ? dayRelative(day.date, lang) : null;

  return (
    <div className="page-enter">
      <div className="page-head">
        <div>
          <p className="eyebrow">{t("nav.schedule")}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t("schedule.title")}</h1>
          <p className="page-sub">{t("schedule.subtitle", { n: data.schedule.weekNumber, dates: rangeLabel })}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(todayInWeek ?? firstDay)}>
            <CalendarDays size={15} />
            {t("schedule.today")}
          </button>
        </div>
      </div>

      <ScheduleLookup />

      <div className="week-strip scroll-x" role="tablist" aria-label={t("nav.schedule")}>
        {days.map((item) => {
          const active = item.date === selected;
          const weekend = item.weekday >= 6;
          return (
            <button
              key={item.date}
              type="button"
              role="tab"
              aria-selected={active}
              className={`day-tile ${active ? "selected" : ""} ${isToday(item.date) ? "today" : ""} ${weekend ? "weekend" : ""}`}
              onClick={() => setSelected(item.date)}
            >
              <span className="dw">{weekdayShort(item.date, lang)}</span>
              <span className="dn">{Number(item.date.slice(8))}</span>
              <span className={`dc ${item.classes.length ? "has" : ""}`} />
            </button>
          );
        })}
      </div>

      {day ? (
        <section style={{ marginTop: 8 }}>
          <div className="day-head">
            <h2 className="h2">{relative ?? weekdayLong(day.date, lang)}</h2>
            <span className="day-chip">
              {Number(day.date.slice(8))} {monthShort(day.date, lang)}
              {day.classes.length ? ` · ${t("schedule.classesCount", { n: day.classes.length })}` : ""}
            </span>
          </div>

          {day.classes.length ? (
            <div className="stack-sm">
              {day.classes.map((item) => {
                const isLive = isToday(day.date) && nowMinutes >= clockToMinutes(item.start) && nowMinutes < clockToMinutes(item.end) && item.status !== "cancelled";
                return (
                  <article key={item.id} className={`class-row`}>
                    <div className="class-time">
                      <b>{item.start}</b>
                      <span>{item.end}</span>
                    </div>
                    <div className={`class-card ${item.status !== "normal" ? item.status : ""}`}>
                      <div className="class-top">
                        <div className="grow">
                          <div className="class-kind" style={{ color: item.kind === "exam" ? "var(--site-coral)" : undefined }}>
                            {pick(item.kindLabel)}
                            {isLive ? <span className="pill pill-accent" style={{ marginLeft: 8, height: 18, padding: "0 7px", fontSize: 9.5 }}>{t("schedule.now")}</span> : null}
                          </div>
                          <h3 className="class-title">{pick(item.title)}</h3>
                        </div>
                        {item.status !== "normal" ? (
                          <span className={`status-pill ${item.status === "cancelled" ? "status-rejected" : item.status === "moved" ? "status-in_review" : "status-issued"}`}>
                            {t(statusLabelKey(item.status))}
                          </span>
                        ) : null}
                      </div>
                      <div className="class-meta">
                        <span><MapPin size={13} /> {item.room} · {pick(item.building)}</span>
                        <span><UserRound size={13} /> {pick(item.teacher)}</span>
                        <span><Clock size={13} /> {item.start}–{item.end}</span>
                      </div>
                      {item.status === "moved" && item.original ? (
                        <div className="class-note">
                          <ArrowRightLeft size={14} style={{ flex: "none" }} />
                          <span>
                            {t("schedule.was")}: <span className="class-oldtime">{item.original.start}–{item.original.end} · {item.original.room}</span>
                            <br />
                            {pick(item.note)}
                          </span>
                        </div>
                      ) : item.status !== "normal" && item.note ? (
                        <div className="class-note">
                          {item.status === "cancelled" ? <X size={14} style={{ flex: "none" }} /> : <Plus size={14} style={{ flex: "none" }} />}
                          <span>{pick(item.note)}</span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon-circle teal"><CalendarDays size={22} /></span>
              <div className="h3">{t("schedule.emptyDay")}</div>
              <p className="muted small" style={{ maxWidth: 340 }}>{t("schedule.emptyDaySub")}</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
