import { useEffect, useRef, useState } from "react";
import {
  ArrowRightLeft, CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Plus, Search, UserRound, X,
} from "lucide-react";
import { api, todayStr } from "../lib/api";
import type { ClassItem, ScheduleSearchResult, ScheduleViewData } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { Sheet } from "../components/ui";
import { addDays, dayRelative, isToday, monthShort, weekdayLong } from "../lib/format";

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

export function ScheduleLookup() {
  const { t, pick, lang } = useI18n();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<ScheduleSearchResult[]>([]);
  const [target, setTarget] = useState<ScheduleSearchResult | null>(null);
  const [view, setView] = useState<ScheduleViewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (!focused) return;
    const timer = window.setTimeout(() => {
      api.scheduleLookup(query.trim())
        .then((value) => setResults(value.results))
        .catch(() => setResults([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, focused]);

  const load = async (item: ScheduleSearchResult, date: string) => {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setFailed(false);
    try {
      const value = await api.scheduleView(
        item.kind === "group" ? { group: item.key } : { teacher: item.key },
        date,
      );
      if (requestId.current === id) setView(value);
    } catch {
      if (requestId.current === id) setFailed(true);
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  };

  const choose = (item: ScheduleSearchResult) => {
    setFocused(false);
    setTarget(item);
    setView(null);
    setQuery("");
    void load(item, todayStr());
  };

  const close = () => {
    setTarget(null);
    setView(null);
    setFailed(false);
  };

  const shiftWeek = (days: number) => {
    if (!target || !view) return;
    setView(null);
    void load(target, addDays(view.monday, days));
  };

  const goToday = () => {
    if (!target) return;
    setView(null);
    void load(target, todayStr());
  };

  const first = view?.days[0]?.date;
  const last = view?.days[view.days.length - 1]?.date;
  const range = first && last ? `${Number(first.slice(8))}–${Number(last.slice(8))} ${monthShort(last, lang)}` : "";
  const days = view?.days.filter((day) => day.classes.length) ?? [];

  return (
    <>
      <section className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="schedule-lookup">{t("schedule.searchTitle")}</label>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--site-muted)" }}
              aria-hidden
            />
            <input
              id="schedule-lookup"
              className="input"
              style={{ paddingLeft: 36 }}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t("schedule.searchPlaceholder")}
              autoComplete="off"
            />
            {focused ? (
              <div
                className="card"
                style={{
                  position: "absolute", zIndex: 40, left: 0, right: 0, top: "calc(100% + 6px)",
                  padding: 6, maxHeight: 300, overflowY: "auto", boxShadow: "0 18px 40px rgba(20, 20, 18, 0.18)",
                }}
              >
                {results.length ? results.map((item) => (
                  <button
                    key={`${item.kind}-${item.key}`}
                    type="button"
                    className="news-item"
                    style={{ width: "100%" }}
                    onMouseDown={(event) => { event.preventDefault(); choose(item); }}
                  >
                    <span className={`icon-circle sm ${item.kind === "teacher" ? "violet" : ""}`}>
                      {item.kind === "teacher" ? <UserRound size={16} /> : <CalendarDays size={16} />}
                    </span>
                    <span className="grow" style={{ textAlign: "left" }}>
                      <span className="news-title" style={{ display: "block" }}>{pick(item.label)}</span>
                      <span className="news-meta">{pick(item.meta)} · {item.key}</span>
                    </span>
                  </button>
                )) : (
                  <p className="small muted" style={{ margin: 0, padding: "10px 8px" }}>{t("schedule.searchEmpty")}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <p className="tiny muted" style={{ margin: "8px 0 0" }}>{t("schedule.searchHint")}</p>
      </section>

      <Sheet
        open={target !== null}
        onClose={close}
        title={target ? pick(target.label) : ""}
        eyebrow={target ? `${pick(target.meta)}${view ? ` · ${t("schedule.subtitle", { n: view.weekNumber, dates: range })}` : ""}` : undefined}
        wide
        foot={(
          <button type="button" className="btn btn-ghost btn-block" onClick={close}>
            {t("common.close")}
          </button>
        )}
      >
        {target ? (
          <div className="stack-sm">
            <div className="row" style={{ alignItems: "center", gap: 8 }}>
              <button type="button" className="icon-btn" onClick={() => shiftWeek(-7)} disabled={!view} aria-label={t("dean.prevWeek")}>
                <ChevronLeft size={18} />
              </button>
              <div className="grow" style={{ textAlign: "center", minWidth: 0 }}>
                <b className="small">{view ? t("dean.week", { n: view.weekNumber }) : t("schedule.viewTitle")}</b>
                <div className="tiny muted">{range}</div>
              </div>
              <button type="button" className="icon-btn" onClick={() => shiftWeek(7)} disabled={!view} aria-label={t("dean.nextWeek")}>
                <ChevronRight size={18} />
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={goToday}>
              <CalendarDays size={15} /> {t("schedule.today")}
            </button>

            {loading ? (
              <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                <Loader2 size={18} className="spin" />
                <span className="small muted">{t("common.loading")}</span>
              </div>
            ) : failed ? (
              <div className="empty-state">
                <span className="icon-circle coral"><CalendarDays size={22} /></span>
                <div className="h3">{t("common.error")}</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => target && load(target, todayStr())}>
                  {t("common.retry")}
                </button>
              </div>
            ) : view && days.length ? (
              days.map((day) => (
                <section key={day.date}>
                  <div className="day-head">
                    <h3 className="h3">{dayRelative(day.date, lang) ?? weekdayLong(day.date, lang)}</h3>
                    <span className="day-chip">
                      {Number(day.date.slice(8))} {monthShort(day.date, lang)}
                      {isToday(day.date) ? ` · ${t("schedule.today")}` : ""}
                    </span>
                  </div>
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
                              <div className="class-kind">{pick(item.kindLabel)}</div>
                              <h4 className="class-title">{pick(item.title)}</h4>
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
                </section>
              ))
            ) : view ? (
              <div className="empty-state">
                <span className="icon-circle teal"><CalendarDays size={22} /></span>
                <div className="h3">{t("schedule.noClassesWeek")}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
