import { useEffect, useState } from "react";
import {
  ArrowRightLeft, CalendarClock, CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock, Loader2, MapPin,
  Plus, UserRound, X,
} from "lucide-react";
import { api, todayStr } from "../lib/api";
import type { ClassItem, TeacherScheduleData } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { addDays, dayRelative, isToday, monthShort, weekdayLong, weekdayShort } from "../lib/format";
import { ScheduleLookup } from "./ScheduleLookup";

function statusKey(status: ClassItem["status"]): string {
  if (status === "moved") return "schedule.moved";
  if (status === "cancelled") return "schedule.cancelled";
  if (status === "added") return "schedule.added";
  return "";
}

function statusClass(status: ClassItem["status"]): string {
  if (status === "cancelled") return "status-rejected";
  if (status === "moved") return "status-in_review";
  return "status-issued";
}

export function TeacherSchedule() {
  const { t, pick, lang } = useI18n();
  const [anchor, setAnchor] = useState(todayStr());
  const [data, setData] = useState<TeacherScheduleData | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const load = async (date: string) => {
    setFailed(false);
    try {
      const value = await api.teacherSchedule(date);
      setData(value);
      setSelected((current) => (current && value.days.some((day) => day.date === current)
        ? current
        : value.days.find((day) => day.date === todayStr())?.date ?? value.days[0]?.date ?? null));
    } catch {
      setFailed(true);
    }
  };

  useEffect(() => {
    void load(todayStr());
  }, []);

  const shiftWeek = (days: number) => {
    if (!data) return;
    const next = addDays(data.monday, days);
    setAnchor(next);
    setSelected((current) => (current ? addDays(current, days) : next));
    void load(next);
  };

  const goToday = () => {
    setAnchor(todayStr());
    setSelected(todayStr());
    void load(todayStr());
  };

  if (failed && !data) {
    return (
      <div className="card card-pad empty-state">
        <span className="icon-circle"><CalendarX2 size={20} /></span>
        <p className="h3" style={{ margin: 0 }}>{t("teacher.scheduleError")}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => load(anchor)}>
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <Loader2 size={18} className="spin" />
        <span className="small muted">{t("common.loading")}</span>
      </div>
    );
  }

  const first = data.days[0]?.date;
  const last = data.days[data.days.length - 1]?.date;
  const rangeLabel = first && last
    ? (monthShort(first, lang) === monthShort(last, lang)
      ? `${Number(first.slice(8))}–${Number(last.slice(8))} ${monthShort(last, lang)}`
      : `${Number(first.slice(8))} ${monthShort(first, lang)} – ${Number(last.slice(8))} ${monthShort(last, lang)}`)
    : "";
  const day = data.days.find((item) => item.date === selected) ?? data.days[0] ?? null;
  const relative = day ? dayRelative(day.date, lang) : null;

  return (
    <div className="stack" style={{ gap: 14 }}>
      <ScheduleLookup />

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="row" style={{ alignItems: "center", gap: 8 }}>
          <button type="button" className="icon-btn" onClick={() => shiftWeek(-7)} aria-label={t("dean.prevWeek")} title={t("dean.prevWeek")}>
            <ChevronLeft size={18} />
          </button>
          <div className="grow" style={{ textAlign: "center", minWidth: 0 }}>
            <b className="small">{t("dean.week", { n: data.weekNumber })}</b>
            <div className="tiny muted">{rangeLabel}</div>
          </div>
          <button type="button" className="icon-btn" onClick={() => shiftWeek(7)} aria-label={t("dean.nextWeek")} title={t("dean.nextWeek")}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm grow" onClick={goToday}>
            <CalendarDays size={15} /> {t("dean.thisWeek")}
          </button>
        </div>

        <p className="tiny muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {data.groups.length
            ? t("teacher.groups", { list: data.groups.join(" · ") })
            : t("teacher.noSchedule")}
        </p>
      </div>

      <div className="week-strip" role="tablist" aria-label={t("nav.schedule")}>
        {data.days.map((item) => {
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
        <section>
          <div className="day-head">
            <h2 className="h2">{relative ?? weekdayLong(day.date, lang)}</h2>
            <span className="day-chip">
              {Number(day.date.slice(8))} {monthShort(day.date, lang)}
              {day.classes.length ? ` · ${t("schedule.classesCount", { n: day.classes.length })}` : ""}
            </span>
          </div>

          {day.classes.length ? (
            <div className="stack-sm">
              {day.classes.map((item) => (
                <article key={item.id} className="class-row">
                  <div className="class-time">
                    <b>{item.start}</b>
                    <span>{item.end}</span>
                  </div>
                  <div className={`class-card ${item.status !== "normal" ? item.status : ""}`}>
                    <div className="class-top">
                      <div className="grow">
                        <div className="class-kind" style={{ color: item.kind === "exam" ? "var(--site-coral)" : undefined }}>
                          {pick(item.kindLabel)}
                        </div>
                        <h3 className="class-title">{pick(item.title)}</h3>
                      </div>
                      {item.status !== "normal" ? (
                        <span className={`status-pill ${statusClass(item.status)}`}>{t(statusKey(item.status))}</span>
                      ) : null}
                    </div>
                    <div className="class-meta">
                      {item.group ? <span className="pill pill-accent" style={{ height: 20, fontSize: 10 }}>{item.group}</span> : null}
                      <span><MapPin size={13} /> {item.room} · {pick(item.building)}</span>
                      <span><UserRound size={13} /> {pick(item.teacher)}</span>
                      <span><Clock size={13} /> {item.start}–{item.end}</span>
                    </div>
                    {item.status === "moved" && item.original ? (
                      <div className="class-note">
                        <ArrowRightLeft size={14} style={{ flex: "none" }} />
                        <span>
                          {t("schedule.was")}: <span className="class-oldtime">{item.original.start}–{item.original.end} · {item.original.room}</span>
                          {item.note ? <><br />{pick(item.note)}</> : null}
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
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="icon-circle teal"><CalendarClock size={22} /></span>
              <div className="h3">{t("schedule.emptyDay")}</div>
              <p className="muted small" style={{ maxWidth: 340 }}>{t("schedule.emptyDaySub")}</p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
